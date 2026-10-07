import type { Metadata } from "next";
import "./globals.css";
import { WakingBanner } from "@/components/waking-banner";

export const metadata: Metadata = {
  title: "Zivira Labs Company Admin",
  description: "Tenant administration portal for Zivira Labs"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body><WakingBanner apiBase={process.env.NEXT_PUBLIC_API_URL ?? "https://zivira-backend-swagger-ui.onrender.com/api"} tokenKey="zivira.manager.token" />{children}</body>
    </html>
  );
}
