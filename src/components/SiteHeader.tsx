import Link from "next/link";

import { Container } from "@/components/Container";

const navItems = [
  { href: "#music", label: "Music" },
  { href: "#shows", label: "Shows" },
  { href: "#merch", label: "Merch" },
  { href: "#contact", label: "Contact" },
] as const;

export function SiteHeader() {
  return (
    <header className="border-b border-border/60 bg-bg/70 backdrop-blur">
      <Container className="flex h-16 items-center justify-between">
        <Link
          href="/"
          className="text-sm font-semibold tracking-wide text-text"
          aria-label="Home"
        >
          bandland
        </Link>
        <nav aria-label="Primary">
          <ul className="flex items-center gap-4 text-sm text-text-muted">
            {navItems.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  className="rounded-full px-2 py-1 transition-colors hover:text-text focus-visible:text-text"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </Container>
    </header>
  );
}

