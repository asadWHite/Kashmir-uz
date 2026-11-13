/**
 * Turns a PostgreSQL driver error into a message an administrator can act on.
 *
 * The previous version lived inside one route and told the operator to run
 * `npx drizzle-kit push`. That advice was wrong twice over: `drizzle-kit push`
 * reconciles the database *to the schema* and can DROP columns, and the
 * project's real changes are delivered as the additive, idempotent scripts in
 * `migrations/`. Saying "run push" to someone holding production data is
 * dangerous, so this helper names the actual missing object and points at the
 * migration gate instead.
 *
 * It also unwraps the driver's `cause` chain, because Drizzle wraps the original
 * pg error, and the `code` lives on the wrapped error rather than the top one.
 */

interface PgLikeError {
  code?: string;
  message?: string;
  detail?: string;
  table?: string;
  column?: string;
  cause?: PgLikeError;
  constraint?: string;
}

/** Depth-limited unwrap; Drizzle can nest the original error one or two levels. */
function pgError(error: unknown): PgLikeError {
  const result: PgLikeError = {};
  let current: unknown = error;
  for (let depth = 0; depth < 4 && current && typeof current === "object"; depth += 1) {
    const node = current as PgLikeError;
    result.code ??= node.code;
    result.detail ??= node.detail;
    result.table ??= node.table;
    result.column ??= node.column;
    result.constraint ??= node.constraint;
    result.message ??= node.message;
    current = node.cause;
  }
  return result;
}

/**
 * Pull the offending identifier out of the PostgreSQL text, which is the only
 * place it appears for a missing table/column.
 *   relation "content_translations" does not exist
 *   column "extra" of relation "content_translations" does not exist
 */
function missingObject(error: PgLikeError): { table?: string; column?: string } {
  const text = `${error.message ?? ""} ${error.detail ?? ""}`;
  const column = /column "([^"]+)" of relation "([^"]+)"/.exec(text);
  if (column) return { column: column[1], table: column[2] };
  // PostgreSQL also says: column "review_status" does not exist
  const bareColumn = /column "([^"]+)" does not exist/.exec(text);
  if (bareColumn) return { column: bareColumn[1] };
  const relation = /relation "([^"]+)" does not exist/.exec(text) ?? /table "([^"]+)" does not exist/.exec(text);
  if (relation) return { table: relation[1] };
  return {};
}

const MIGRATE_HINT =
  "Примените миграции к базе, которую использует сайт: npx tsx scripts/db-gate.ts (скрипт идемпотентный и ничего не удаляет).";

export function databaseErrorMessage(error: unknown, scope: string): string {
  const pg = pgError(error);
  const { table, column } = missingObject(pg);

  if (pg.code === "42P01" || pg.code === "42703") {
    const what = column
      ? `В базе нет столбца «${column}»${table ? ` в таблице «${table}»` : ""}.`
      : table
        ? `В базе нет таблицы «${table}».`
        : "База не соответствует текущей схеме (таблица или столбец отсутствует).";
    return `${what} ${MIGRATE_HINT} Не используйте drizzle-kit push на рабочей базе: он может удалить данные.`;
  }

  if (pg.code === "22001") {
    return "Значение не помещается в поле базы (слишком длинный текст или изображение). Сохранение отменено.";
  }
  if (pg.code === "23503") {
    return "Выбранная категория отсутствует в базе. Обновите список категорий и попробуйте снова.";
  }
  if (pg.code === "23502") {
    return "Не заполнено обязательное поле базы. Сохранение отменено.";
  }
  if (pg.code === "23505") {
    return "Такая запись уже существует (дубликат уникального поля).";
  }
  if (pg.code === "22P02") {
    return "Некорректное значение для числового или служебного поля.";
  }
  if (pg.code === "53300" || pg.code === "57P01" || pg.code === "08006") {
    return "База данных недоступна или перегружена. Повторите попытку через несколько секунд.";
  }

  return `${scope} не удалось (PostgreSQL ${pg.code ?? "unknown"}). Подробности в server logs.`;
}
