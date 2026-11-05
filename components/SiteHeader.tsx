"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About us" },
  { href: "/services", label: "Services" },
  { href: "/contact", label: "Contact us" },
];

export function SiteHeader() {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return null;

  return (
    <header className="site-header">
      <div className="shell header-inner">
        <Link href="/" className="brand">
          <img className="brand-logo" src="/logo.jpg" alt="Easy Life Counselling" />
        </Link>
        <nav id="site-nav" className="nav" aria-label="Main">
          {links.map((link) => {
            const current = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
            return (
              <Link key={link.href} href={link.href} aria-current={current ? "page" : undefined}>
                {link.label}
              </Link>
            );
          })}
          <Link className="button" href="/contact">
            Speak with us
          </Link>
        </nav>
      </div>
    </header>
  );
}
