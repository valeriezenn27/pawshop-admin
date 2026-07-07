import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "PawShop Ops",
  description: "Multi-tenant commerce operations and data import workspace",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let account: { email: string; role: string } | null = null;
  if (user) {
    const { data: admin } = await supabase.from("platform_admins").select("user_id").maybeSingle();
    if (admin) {
      account = { email: user.email ?? "Signed in", role: "platform_admin" };
    } else {
      const { data: membership } = await supabase.from("organization_members").select("role").limit(1).maybeSingle();
      account = { email: user.email ?? "Signed in", role: membership?.role ?? "member" };
    }
  }

  return (
    <html lang="en">
      <body className="font-sans">
        <div className="flex h-screen overflow-hidden bg-gray-50">
          <Sidebar account={account} />
          <main className="flex-1 overflow-y-auto">
            <div className="p-6 lg:p-8">{children}</div>
          </main>
        </div>
      </body>
    </html>
  );
}
