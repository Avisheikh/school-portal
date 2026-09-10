import Image from "next/image";
import Link from "next/link";
import { STUDENT_CLASSES } from "@/lib/studentClasses";
import type { Database } from "@/lib/types";

/** Public-safe school overview (no finance, progress report, or staff PII). */
export function PublicSchoolOverview({ db }: { db: Database }) {
  const activeStudents = db.students
    .filter((s) => s.status === "active")
    .sort((a, b) => {
      const c = a.classLevel.localeCompare(b.classLevel);
      return c !== 0 ? c : a.name.localeCompare(b.name);
    });
  const teachers = db.teachers
    .filter((t) => t.status === "active")
    .sort((a, b) => a.name.localeCompare(b.name));
  const programs = [...db.programs].sort((a, b) =>
    (b.date || b.createdAt).localeCompare(a.date || a.createdAt),
  );
  const activities = db.activities
    .filter((a) => a.published)
    .sort((a, b) => b.date.localeCompare(a.date));

  const byClass = STUDENT_CLASSES.map((classLevel) => ({
    classLevel,
    count: activeStudents.filter((s) => s.classLevel === classLevel).length,
  })).filter((c) => c.count > 0);

  const stats = [
    { label: "Active students", value: activeStudents.length, href: "#students" },
    { label: "Teachers", value: teachers.length, href: "#teachers" },
    { label: "Programs", value: programs.length, href: "#programs" },
    { label: "Activities", value: activities.length, href: "#activities" },
  ];

  return (
    <div className="bg-mist">
      {/* Dashboard-style stats */}
      <section className="border-b border-stone bg-white py-10">
        <div className="mx-auto max-w-6xl px-5">
          <p className="text-sm font-semibold uppercase tracking-widest text-brand">
            Live school data
          </p>
          <h2 className="font-display mt-2 text-3xl text-brand-ink sm:text-4xl">
            SOSD Bodgaun — at a glance
          </h2>
          <p className="mt-2 max-w-2xl text-muted">
            Students, teachers, programs, and activities from the school portal —
            updated as staff save records.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((s) => (
              <a
                key={s.label}
                href={s.href}
                className="rounded-xl border border-stone bg-mist p-5 transition hover:border-brand"
              >
                <p className="text-sm text-muted">{s.label}</p>
                <p className="font-display mt-2 text-4xl text-brand-ink">
                  {s.value}
                </p>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Students */}
      <section id="students" className="scroll-mt-24 py-14">
        <div className="mx-auto max-w-6xl px-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-3xl text-brand-ink">Students</h2>
              <p className="mt-1 text-sm text-muted">
                Active enrollment by class · {activeStudents.length} children
              </p>
            </div>
          </div>

          {byClass.length > 0 ? (
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
              {byClass.map((c) => (
                <div
                  key={c.classLevel}
                  className="rounded-lg border border-stone bg-white px-3 py-3 text-center"
                >
                  <p className="font-display text-2xl text-brand-ink">{c.count}</p>
                  <p className="mt-1 text-xs text-muted">{c.classLevel}</p>
                </div>
              ))}
            </div>
          ) : null}

          {activeStudents.length === 0 ? (
            <p className="mt-6 text-muted">Student records will appear here.</p>
          ) : (
            <div className="table-wrap mt-8 bg-white">
              <table className="data">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Name</th>
                    <th>Class</th>
                    <th>Gender</th>
                    <th>Enrolled</th>
                  </tr>
                </thead>
                <tbody>
                  {activeStudents.map((s, i) => (
                    <tr key={s.id}>
                      <td>{i + 1}</td>
                      <td>
                        <strong>{s.name}</strong>
                      </td>
                      <td>{s.classLevel}</td>
                      <td className="capitalize">{s.gender}</td>
                      <td className="whitespace-nowrap text-xs">
                        {s.enrollmentDate || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* Teachers */}
      <section id="teachers" className="scroll-mt-24 border-t border-stone bg-white py-14">
        <div className="mx-auto max-w-6xl px-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-3xl text-brand-ink">Teachers</h2>
              <p className="mt-1 text-sm text-muted">
                Educators serving SOSD Bodgaun
              </p>
            </div>
            <Link href="/team" className="text-sm font-semibold text-brand">
              View full team →
            </Link>
          </div>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {teachers.length === 0 && (
              <p className="text-muted">Teacher profiles will appear here.</p>
            )}
            {teachers.map((t) => (
              <article
                key={t.id}
                className="flex gap-4 border-t-4 border-brand bg-mist p-5"
              >
                {t.photoUrl ? (
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full bg-white">
                    <Image
                      src={t.photoUrl}
                      alt={t.name}
                      fill
                      className="object-cover"
                      unoptimized
                      sizes="80px"
                    />
                  </div>
                ) : (
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-white text-xs text-muted">
                    Photo
                  </div>
                )}
                <div className="min-w-0">
                  <h3 className="font-display text-xl text-brand-ink">{t.name}</h3>
                  <p className="text-sm font-medium text-brand">{t.role}</p>
                  {t.qualification ? (
                    <p className="mt-1 text-xs text-muted">{t.qualification}</p>
                  ) : null}
                  {t.subjects ? (
                    <p className="mt-1 text-sm text-ink/80">{t.subjects}</p>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Programs */}
      <section id="programs" className="scroll-mt-24 py-14">
        <div className="mx-auto max-w-6xl px-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-3xl text-brand-ink">Programs</h2>
              <p className="mt-1 text-sm text-muted">
                Learning and community programmes
              </p>
            </div>
            <Link href="/programs" className="text-sm font-semibold text-brand">
              All programs →
            </Link>
          </div>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {programs.length === 0 && (
              <p className="text-muted">Programs will appear here.</p>
            )}
            {programs.map((p) => (
              <article
                key={p.id}
                className="overflow-hidden border border-stone bg-white"
              >
                {p.imageUrl ? (
                  <div className="relative h-44 w-full">
                    <Image
                      src={p.imageUrl}
                      alt={p.title}
                      fill
                      className="object-cover"
                      unoptimized={p.imageUrl.startsWith("/uploads")}
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  </div>
                ) : null}
                <div className="border-t-4 border-brand p-5">
                  <div className="flex flex-wrap gap-2">
                    <span className="badge badge-blue">{p.level || "Program"}</span>
                    <span
                      className={`badge ${
                        p.status === "active"
                          ? "badge-green"
                          : p.status === "upcoming"
                            ? "badge-amber"
                            : "badge-red"
                      }`}
                    >
                      {p.status}
                    </span>
                  </div>
                  <h3 className="font-display mt-3 text-2xl text-brand-ink">
                    {p.title}
                  </h3>
                  {p.date ? (
                    <p className="mt-1 text-xs text-muted">{p.date}</p>
                  ) : null}
                  <p className="mt-3 text-sm leading-relaxed text-muted whitespace-pre-wrap">
                    {p.description}
                  </p>
                  <p className="mt-3 text-xs text-ink/70">
                    Duration: {p.duration || "—"}
                    {p.capacity ? ` · Capacity ~${p.capacity}` : ""}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Activities */}
      <section id="activities" className="scroll-mt-24 border-t border-stone bg-white py-14">
        <div className="mx-auto max-w-6xl px-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-3xl text-brand-ink">Activities</h2>
              <p className="mt-1 text-sm text-muted">
                Date-wise school life — photos and stories
              </p>
            </div>
            <Link href="/activities" className="text-sm font-semibold text-brand">
              All activities →
            </Link>
          </div>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {activities.length === 0 && (
              <p className="text-muted">Published activities will appear here.</p>
            )}
            {activities.map((a) => (
              <article key={a.id} className="overflow-hidden border border-stone">
                {a.imageUrl ? (
                  <div className="relative h-52 w-full">
                    <Image
                      src={a.imageUrl}
                      alt={a.title}
                      fill
                      className="object-cover"
                      unoptimized={a.imageUrl.startsWith("/uploads")}
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  </div>
                ) : null}
                <div className="border-t-4 border-mustard bg-mist p-5">
                  <p className="text-xs uppercase tracking-wide text-muted">
                    {a.category} · {a.date}
                  </p>
                  <h3 className="font-display mt-2 text-2xl text-brand-ink">
                    {a.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted whitespace-pre-wrap">
                    {a.description}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
