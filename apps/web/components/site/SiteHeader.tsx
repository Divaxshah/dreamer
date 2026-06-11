import Link from "next/link";

const links = [
  { href: "/pricing", label: "Pricing" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/studio", label: "Studio" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-20 items-center justify-between px-6 lg:px-12 max-w-[1400px]">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="h-10 w-10 bg-primary text-primary-foreground flex items-center justify-center font-display text-2xl leading-none rounded-2xl rotate-3 group-hover:rotate-0 transition-transform">
            W
          </div>
          <span className="font-display text-2xl tracking-tight text-foreground font-bold">Webmaker</span>
        </Link>

        <nav className="hidden md:flex items-center gap-10 text-sm font-medium">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="text-muted-foreground hover:text-primary transition-colors">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-6">
          <Link href="/auth" className="hidden md:inline-flex text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Log in
          </Link>
          <Link href="/studio" className="hidden md:inline-flex h-12 items-center justify-center rounded-full bg-foreground px-8 text-sm font-bold text-background transition-all hover:scale-105 active:scale-95 shadow-lg shadow-black/5 dark:shadow-white/5">
            Get Started
          </Link>
        </div>
      </div>
    </header>
  );
}
