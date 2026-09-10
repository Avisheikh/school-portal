import Image from "next/image";
import Link from "next/link";
import { PublicShell } from "@/components/layout/SiteChrome";
import { PublicSchoolOverview } from "@/components/public/PublicSchoolOverview";
import { DONATE_URL } from "@/lib/donate";
import { readDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const db = await readDb();
  const students = db.students.filter((s) => s.status === "active").length;
  const programs = db.programs.filter((p) => p.status === "active").length;
  const teachers = db.teachers.filter((t) => t.status === "active").length;
  const activities = db.activities.filter((a) => a.published).length;

  return (
    <PublicShell>
      {/* Hero — brand + CTA */}
      <section className="relative min-h-[85svh] overflow-hidden text-white">
        <Image
          src="/media/campus-mustard.jpg"
          alt="SOSD blue campus rising above mustard fields in Bodgaun"
          fill
          priority
          className="object-cover ken-burns"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-ink via-brand-ink/55 to-brand-ink/25" />
        <div className="relative mx-auto flex min-h-[85svh] max-w-6xl flex-col justify-end px-5 pb-14 pt-28 sm:justify-center sm:pb-20">
          <div className="fade-up mb-5">
            <Image
              src="/media/logo.jpg"
              alt="School of Social Development"
              width={96}
              height={96}
              className="h-20 w-20 rounded-full bg-white shadow-lg sm:h-24 sm:w-24"
              priority
            />
          </div>
          <p className="fade-up text-sm font-semibold uppercase tracking-[0.22em] text-mustard">
            Village project · Indrawati-11, Bodgaun
          </p>
          <h1 className="fade-up-delay font-display mt-3 max-w-3xl text-4xl leading-[1.05] sm:text-6xl md:text-7xl">
            School of Social Development
          </h1>
          <p className="fade-up-late mt-5 max-w-lg text-base text-white/90 sm:text-lg">
            Open this page to see live students, teachers, programs, and
            activities from our campus in Sindhupalchowk.
          </p>
          <div className="fade-up-late mt-8 flex flex-wrap gap-3">
            <a href="#students" className="btn btn-primary pulse-soft text-base">
              View school details
            </a>
            <a
              href={DONATE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-ghost border-white/50 text-white"
            >
              Donate now
            </a>
          </div>
          <div className="fade-up-late mt-10 grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { n: students, l: "Students" },
              { n: teachers, l: "Teachers" },
              { n: programs, l: "Programs" },
              { n: activities, l: "Activities" },
            ].map((x) => (
              <div
                key={x.l}
                className="rounded-lg border border-white/20 bg-white/10 px-3 py-2 backdrop-blur-sm"
              >
                <p className="font-display text-2xl">{x.n}</p>
                <p className="text-xs text-white/75">{x.l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Live portal data — dashboard-style public view */}
      <PublicSchoolOverview db={db} />

      {/* Short story + donate */}
      <section className="relative overflow-hidden bg-brand py-16 text-white">
        <div className="mx-auto max-w-6xl px-5">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="font-display text-3xl sm:text-4xl">
                A school that belongs to the village
              </h2>
              <p className="mt-4 text-white/85 leading-relaxed">
                {(db.school.about || "").slice(0, 280)}
                {(db.school.about || "").length > 280 ? "…" : ""}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/about" className="btn btn-ghost border-white/40 text-white">
                  Our story
                </Link>
                <a
                  href={DONATE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary"
                >
                  Donate
                </a>
              </div>
            </div>
            <div className="relative aspect-[4/3] overflow-hidden">
              <Image
                src="/media/village-aerial.jpg"
                alt="Aerial view of Bodgaun village and the blue school buildings"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
