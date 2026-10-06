import Link from "next/link";
import { BRAND } from "@/lib/constants";

export default function NotFound() {
  return (
    <main className="grid min-h-[70vh] place-items-center px-6">
      <section className="text-center">
        <p className="eyebrow mb-5">{BRAND.full}</p>
        <h1 className="font-display text-[clamp(3rem,12vw,8rem)] leading-none text-ink">
          404
        </h1>
        <p className="mx-auto mt-6 max-w-md text-muted">
          Sahifa topilmadi. Siz qidirayotgan sahifa ko'chirilgan yoki mavjud emas.
        </p>
        <Link href="/" className="btn btn-solid mt-9">
          Bosh sahifaga qaytish
        </Link>
      </section>
    </main>
  );
}
