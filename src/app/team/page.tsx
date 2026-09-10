import Image from "next/image";
import { PublicShell } from "@/components/layout/SiteChrome";
import { DONATE_URL } from "@/lib/donate";
import { readDb } from "@/lib/db";

export const dynamic = "force-dynamic";
export const metadata = { title: "Teachers" };

export default async function TeamPage() {
  const { teachers } = await readDb();
  const activeTeachers = teachers.filter((t) => t.status === "active");

  return (
    <PublicShell>
      <section className="relative min-h-[40vh] overflow-hidden text-white">
        <Image
          src="/media/welcome-celebration.jpg"
          alt="SOSD community"
          fill
          className="object-cover"
          sizes="100vw"
          priority
        />
        <div className="absolute inset-0 bg-brand-ink/70" />
        <div className="relative mx-auto flex min-h-[40vh] max-w-6xl flex-col justify-end px-5 pb-12 pt-28">
          <h1 className="font-display text-4xl sm:text-5xl">Our teachers</h1>
          <p className="mt-3 max-w-xl text-white/85">
            Local educators who keep Bodgaun’s campus alive every day.
          </p>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-5 py-14">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {activeTeachers.map((t) => (
            <div key={t.id} className="border-t-4 border-brand bg-white p-5">
              <div className="flex gap-4">
                {t.photoUrl ? (
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full bg-mist">
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
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-mist text-xs text-muted">
                    Photo
                  </div>
                )}
                <div>
                  <h3 className="font-display text-xl text-brand-ink">{t.name}</h3>
                  <p className="mt-1 text-sm font-medium text-brand">{t.role}</p>
                  {t.qualification && (
                    <p className="mt-1 text-sm text-ink/80">
                      Qualification: {t.qualification}
                    </p>
                  )}
                  <p className="mt-2 text-sm text-muted">{t.subjects || t.bio}</p>
                </div>
              </div>
            </div>
          ))}
          {activeTeachers.length === 0 && (
            <p className="text-muted">Teacher profiles will appear here.</p>
          )}
        </div>
        <a
          href={DONATE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-primary mt-12 pulse-soft"
        >
          Support our teachers’ work
        </a>
      </section>
    </PublicShell>
  );
}
