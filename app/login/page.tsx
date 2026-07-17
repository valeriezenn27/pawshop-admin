import { Suspense } from "react";
import LoginForm from "@/components/LoginForm";

export const metadata = { title: "Sign in · PawShop Ops" };

export default function LoginPage() {
  return (
    <div className="flex min-h-screen">
      <div className="relative hidden w-[42%] shrink-0 flex-col justify-between overflow-hidden bg-gradient-to-br from-brand-500 via-brand-700 to-brand-900 px-14 py-14 text-white shadow-xl lg:flex">
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-brand-900/40 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-amber-400/20 blur-3xl" />

        <div className="relative flex h-9 w-9 items-center justify-center rounded-md bg-white font-display text-lg italic text-brand-700 shadow-lg shadow-black/20">
          P
        </div>

        <p className="relative font-display text-4xl italic leading-[1.15] tracking-tight text-white drop-shadow-sm">
          Every SKU,
          <br />
          accounted for.
        </p>

        <div className="relative border-t border-brand-500 pt-6">
          <p className="text-sm leading-6 text-brand-100">
            Multi-tenant inventory ops with row-level isolation between organizations — enforced in Postgres, not application code.
          </p>
          <p className="mt-5 text-[11px] uppercase tracking-[0.14em] text-brand-200">PawShop — Commerce Ops</p>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center px-6 py-16 sm:px-12">
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
