import type { Metadata } from "next";
import { Playfair_Display } from "next/font/google";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-serif",
});

export const metadata: Metadata = {
  title: {
    default: "Easy Life — Counseling rooms",
    template: "%s — Easy Life",
  },
  description:
    "Life counseling, career development, marriage counseling, and quiet rooms for family, grief, stress, and personal growth. Open a room and speak.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={playfair.variable} data-scroll-behavior="smooth">
      <body>
        <a className="skip" href="#content">Skip to content</a>
        <SiteHeader />
        <main id="content">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
