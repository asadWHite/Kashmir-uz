import { SQL, getTableName } from "drizzle-orm";
import { getTableConfig, PgDialect } from "drizzle-orm/pg-core";
import * as schema from "../schema";
const dialect = new PgDialect();
const expression = (value: unknown): unknown => value instanceof SQL ? dialect.sqlToQuery(value).sql : value;
// Runtime contract prevents a stale catalog reference from masking model drift.
// SQL catalog comparison remains independent and read-only.
export function modelContract() {
  return Object.values(schema).map(table => {
    const c = getTableConfig(table);
    return {
      name: c.name,
      columns: c.columns.map(col => ({name:col.name,type:col.getSQLType(),required:col.notNull,primary:col.primary,unique:col.isUnique,default:expression(col.default) ?? null})),
      indexes: c.indexes.map(i => ({name:i.config.name,unique:i.config.unique,method:i.config.method,columns:i.config.columns.map(col => "name" in col ? {name:col.name,order:col.indexConfig?.order,nulls:col.indexConfig?.nulls} : expression(col)),where:expression(i.config.where) ?? null})),
      checks: c.checks.map(check => ({name:check.name,expression:expression(check.value)})),
      foreignKeys: c.foreignKeys.map(fk => {const r=fk.reference();return {columns:r.columns.map(col=>col.name),table:getTableName(r.foreignTable),foreignColumns:r.foreignColumns.map(col=>col.name),onDelete:fk.onDelete,onUpdate:fk.onUpdate};}),
      uniqueConstraints: c.uniqueConstraints.map(u=>({name:u.name,columns:u.columns.map(col=>col.name),nullsNotDistinct:u.nullsNotDistinct})),
      primaryKeys: c.primaryKeys.map(pk=>({columns:pk.columns.map(col=>col.name)})),
    };
  }).sort((a,b)=>a.name.localeCompare(b.name));
}
