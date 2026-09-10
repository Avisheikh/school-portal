import Image from "next/image";
import { PublicShell } from "@/components/layout/SiteChrome";
import { readDb } from "@/lib/db";

export const dynamic = "force-dynamic";
export const metadata = { title: "Activities" };

export default async function ActivitiesPage() {
  const { activities } = await readDb();
  const published = activities
    .filter((a) => a.published)
    .sort((a, b) => b.date.localeCompare(a.date));

  const fallbacks = [
    "/media/welcome-celebration.jpg",
    "/media/tika-blessing.jpg",
    "/media/children-courtyard.jpg",
    "/media/playground-friends.jpg",
  ];

  return (
    <PublicShell>
      <section className="relative min-h-[45vh] overflow-hidden text-white">
        <Image
          src="/media/tika-blessing.jpg"
          alt="School community moment"
          fill
          className="object-cover"
          sizes="100vw"
          priority
        />
        <div className="absolute inset-0 bg-brand-ink/70" />
        <div className="relative mx-auto flex min-h-[45vh] max-w-6xl flex-col justify-end px-5 pb-12 pt-28">
          <h1 className="font-display text-4xl sm:text-5xl">School activities</h1>
          <p className="mt-3 max-w-xl text-white/85">
            Celebrations, blessings and everyday learning — life on campus in
            Bodgaun.
          </p>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-5 py-14">
        <div className="grid gap-8 md:grid-cols-2">
          {published.length === 0 && (
            <p className="text-muted">No activities yet. Check back soon.</p>
          )}
          {published.map((a, i) => (
            <article key={a.id} className="overflow-hidden bg-white">
              <div className="relative h-56 w-full">
                <Image
                  src={a.imageUrl || fallbacks[i % fallbacks.length]}
                  alt={a.title}
                  fill
                  className="object-cover"
                  unoptimized={Boolean(a.imageUrl?.startsWith("/uploads"))}
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
              <div className="border-t-4 border-mustard p-6">
                <p className="text-xs uppercase tracking-wide text-muted">
                  {a.category} · {a.date}
                </p>
                <h2 className="font-display mt-2 text-2xl text-brand-ink">
                  {a.title}
                </h2>
                <p className="mt-3 text-muted leading-relaxed">{a.description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </PublicShell>
  );
}
