import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";
import AppShell from "@/components/AppShell";
import { createClient } from "@/lib/supabase/server";
import { THEME_STORAGE_KEY } from "@/lib/theme";

const themeBootstrapScript = `
(function () {
  try {
    var theme = localStorage.getItem("${THEME_STORAGE_KEY}") || "default";
    document.documentElement.setAttribute("data-theme", theme);
    if (theme === "dark") document.documentElement.classList.add("dark");
  } catch (e) {}
})();
`;

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
  axes: ["opsz"],
});

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
    <html lang="en" className={`${inter.variable} ${fraunces.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrapScript }} />
      </head>
      <body className="font-sans">
        <AppShell account={account}>{children}</AppShell>
      </body>
    </html>
  );
}
