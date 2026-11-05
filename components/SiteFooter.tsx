"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { services } from "@/lib/services";

const pages = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About us" },
  { href: "/services", label: "Services" },
  { href: "/contact", label: "Contact us" },
];

export function SiteFooter() {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return null;

  return (
    <footer className="site-footer">
      <div className="shell footer-inner">
        <div className="footer-brand">
          <Link href="/" className="footer-lockup">
            <img className="footer-logo" src="/logo.jpg" alt="Easy Life Counselling" />
            <span>
              <strong>Easy Life</strong>
              <em>Talk · Heal · Thrive</em>
            </span>
          </Link>
          <p>
            Easy Life offers private supportive conversations. This is not emergency care
            and does not replace a clinician when you need one.
          </p>
        </div>

        <nav className="footer-col" aria-label="Visit">
          <p>Visit</p>
          {pages.map((page) => (
            <Link key={page.href} href={page.href}>
              {page.label}
            </Link>
          ))}
          <Link href="/contact">Speak with us</Link>
        </nav>

        <nav className="footer-col" aria-label="Rooms">
          <p>Rooms</p>
          {services.map((service) => (
            <Link key={service.slug} href={`/session/${service.slug}`}>
              {service.title}
            </Link>
          ))}
        </nav>

        <div className="footer-care">
          <p>If you need help now</p>
          <p className="footer-care-copy">
            If you are in danger, contact local emergency services.
          </p>
          <ul>
            <li>
              <span>United States</span>
              <a href="tel:988">Call or text 988</a>
            </li>
            <li>
              <span>South Africa</span>
              <a href="tel:0800567567">SADAG 0800 567 567</a>
            </li>
            <li>
              <span>Elsewhere</span>
              <a href="https://www.iasp.info/suicidalthoughts/">iasp.info</a>
            </li>
          </ul>
        </div>
      </div>

      <div className="shell footer-base">
        <p>© {new Date().getFullYear()} Easy Life Counselling</p>
        <p>Conversations are for adults.</p>
      </div>
    </footer>
  );
}
