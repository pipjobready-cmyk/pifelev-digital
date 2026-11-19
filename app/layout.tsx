import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PIFELEV Digital | More Local Customers, Within 3 Miles",
  description: "Practical Google Business Profile optimization and local visibility management for businesses in Cagayan de Oro.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://pifelev-digital.vercel.app"),
  openGraph: { title: "PIFELEV Digital", description: "More Local Customers, Within 3 Miles.", type: "website" }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}