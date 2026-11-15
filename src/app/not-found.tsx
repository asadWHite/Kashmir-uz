import Link from "next/link";
import { BRAND } from "@/lib/constants";
import { getRequestLocale } from "@/lib/locale/server";

const MESSAGES = {
  ru: {
    eyebrow: BRAND.full,
    title: "404",
    description:
      "Страница, которую вы ищете, перемещена или больше не существует.",
    cta: "На главную",
  },
  uz: {
    eyebrow: BRAND.full,
    title: "404",
    description:
      "Siz qidirayotgan sahifa ko'chirilgan yoki endi mavjud emas.",
    cta: "Bosh sahifa",
  },
  en: {
    eyebrow: BRAND.full,
    title: "404",
    description:
      "The page you are looking for has moved or no longer exists.",
    cta: "Return home",
  },
};

export default async function NotFound() {
  const locale = await getRequestLocale();
  const msg = MESSAGES[locale] ?? MESSAGES.ru;

  return (
    <main className="grid min-h-[70vh] place-items-center px-6">
      <section className="text-center">
        <p className="eyebrow mb-5">{msg.eyebrow}</p>
        <h1 className="font-display text-[clamp(3rem,12vw,8rem)] leading-none text-ink">
          {msg.title}
        </h1>
        <p className="mx-auto mt-6 max-w-md text-muted">{msg.description}</p>
        <Link href="/" className="btn btn-solid mt-9">
          {msg.cta}
        </Link>
      </section>
    </main>
  );
}
