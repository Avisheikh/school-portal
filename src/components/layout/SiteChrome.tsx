import Image from "next/image";
import Link from "next/link";
import { DONATE_URL } from "@/lib/donate";

const links = [
  { href: "/", label: "Home" },
  { href: "/about", label: "Our Story" },
  { href: "/#students", label: "Students" },
  { href: "/team", label: "Teachers" },
  { href: "/programs", label: "Programs" },
  { href: "/activities", label: "Activities" },
  { href: "/impact", label: "Impact" },
  { href: DONATE_URL, label: "Donate", external: true },
];

export function SiteHeader({ tone = "light" }: { tone?: "light" | "dark" }) {
  const light = tone === "light";
  return (
    <header
      className={`absolute inset-x-0 top-0 z-30 ${
        light ? "text-white" : "text-brand-ink"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4">
        <Link href="/" className="fade-up flex items-center gap-3">
          <Image
            src="/media/logo.jpg"
            alt="School of Social Development logo"
            width={56}
            height={56}
            className="h-12 w-12 rounded-full bg-white shadow-md sm:h-14 sm:w-14"
            priority
          />
          <span className="hidden min-[420px]:block">
            <span className="font-display block text-base leading-tight sm:text-lg">
              School of Social Development
            </span>
            <span
              className={`text-[11px] tracking-wide ${
                light ? "text-white/80" : "text-muted"
              }`}
            >
              SOSD · Indrawati-11, Bodgaun
            </span>
          </span>
        </Link>
        <nav className="hidden items-center gap-5 text-sm lg:flex">
          {links.map((l) =>
            "external" in l && l.external ? (
              <a
                key={l.href}
                href={l.href}
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-mustard transition hover:opacity-90"
              >
                {l.label}
              </a>
            ) : (
              <Link
                key={l.href}
                href={l.href}
                className={`transition ${
                  light
                    ? "text-white/85 hover:text-white"
                    : "text-ink/80 hover:text-brand"
                }`}
              >
                {l.label}
              </Link>
            ),
          )}
          <Link href="/admin" className="btn btn-ghost text-xs">
            Staff
          </Link>
        </nav>
        <a
          href={DONATE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-primary pulse-soft text-sm lg:hidden"
        >
          Donate
        </a>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="bg-brand-ink text-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 md:grid-cols-[1.2fr_1fr]">
        <div className="flex gap-4">
          <Image
            src="/media/logo.jpg"
            alt="SOSD logo"
            width={72}
            height={72}
            className="h-16 w-16 rounded-full bg-white"
          />
          <div>
            <p className="font-display text-2xl leading-tight">
              School of Social Development
            </p>
            <p className="mt-2 max-w-md text-sm text-white/70">
              A village education project in Bodgaun, Indrawati-11,
              Sindhupalchowk — kindergarten, elementary learning, and community
              hope since 2021.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/80 md:justify-end md:self-end">
          <Link href="/#students">Students</Link>
          <Link href="/team">Teachers</Link>
          <Link href="/programs">Programs</Link>
          <Link href="/activities">Activities</Link>
          <Link href="/impact">Impact</Link>
          <a href={DONATE_URL} target="_blank" rel="noopener noreferrer">
            Donate
          </a>
          <Link href="/admin">Staff portal</Link>
        </div>
      </div>
      <div className="border-t border-white/10 px-5 py-4 text-center text-xs text-white/50">
        © {new Date().getFullYear()} SOSD Bodgaun · Built for the children of
        Indrawati-11
      </div>
    </footer>
  );
}

export function PublicShell({
  children,
  headerTone = "light",
}: {
  children: React.ReactNode;
  headerTone?: "light" | "dark";
}) {
  return (
    <div className="min-h-screen">
      <SiteHeader tone={headerTone} />
      <main>{children}</main>
      <SiteFooter />
    </div>
  );
}
