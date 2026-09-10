import Image from "next/image";
import { PublicShell } from "@/components/layout/SiteChrome";
import { readDb } from "@/lib/db";

export const dynamic = "force-dynamic";
export const metadata = { title: "Programs" };

export default async function ProgramsPage() {
  const { programs } = await readDb();
  const sorted = [...programs].sort((a, b) =>
    (b.date || b.createdAt).localeCompare(a.date || a.createdAt),
  );

  return (
    <PublicShell>
      <section className="relative min-h-[45vh] overflow-hidden text-white">
        <Image
          src="/media/welcome-celebration.jpg"
          alt="SOSD students and community"
          fill
          className="object-cover"
          sizes="100vw"
          priority
        />
        <div className="absolute inset-0 bg-brand-ink/70" />
        <div className="relative mx-auto flex min-h-[45vh] max-w-6xl flex-col justify-end px-5 pb-12 pt-28">
          <h1 className="font-display text-4xl sm:text-5xl">Programs</h1>
          <p className="mt-3 max-w-xl text-white/85">
            Kindergarten, elementary learning, IT literacy and community training
            — funded by people who believe in Bodgaun’s children.
          </p>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-5 py-14">
        <div className="grid gap-10 md:grid-cols-2">
          {sorted.map((p) => (
            <article key={p.id} className="overflow-hidden border border-stone bg-white">
              {p.imageUrl ? (
                <div className="relative h-48 w-full">
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
                <div className="flex flex-wrap items-center gap-2">
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
                <h2 className="font-display mt-3 text-2xl text-brand-ink">
                  {p.title}
                </h2>
                {p.date ? (
                  <p className="mt-1 text-xs text-muted">{p.date}</p>
                ) : null}
                <p className="mt-3 text-muted leading-relaxed whitespace-pre-wrap">
                  {p.description}
                </p>
                <p className="mt-4 text-sm text-ink/70">
                  Duration: {p.duration || "—"}
                  {p.capacity ? ` · Capacity ~${p.capacity}` : ""}
                </p>
              </div>
            </article>
          ))}
          {sorted.length === 0 && (
            <p className="text-muted">No programs published yet.</p>
          )}
        </div>
      </section>
    </PublicShell>
  );
}
