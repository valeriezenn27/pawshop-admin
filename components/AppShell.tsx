"use client";

import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";

interface AppShellProps {
  account: { email: string; role: string } | null;
  children: React.ReactNode;
}

export default function AppShell({ account, children }: AppShellProps) {
  const pathname = usePathname();

  if (pathname === "/login") {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-stone-50">
      <Sidebar account={account} />
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
