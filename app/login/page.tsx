import { Suspense } from "react";
import LoginForm from "@/components/LoginForm";

export const metadata = { title: "Sign in · PawShop Ops" };

export default function LoginPage() {
  return <div className="flex min-h-[calc(100vh-3rem)] items-center justify-center"><Suspense><LoginForm /></Suspense></div>;
}
