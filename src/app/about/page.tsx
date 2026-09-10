import Image from "next/image";
import { PublicShell } from "@/components/layout/SiteChrome";
import { DONATE_URL } from "@/lib/donate";
import { readDb } from "@/lib/db";

export const dynamic = "force-dynamic";
export const metadata = { title: "Our Story" };

export default async function AboutPage() {
  const { school } = await readDb();

  return (
    <PublicShell>
      <section className="relative min-h-[55vh] overflow-hidden text-white">
        <Image
          src="/media/campus-mustard.jpg"
          alt="SOSD campus in Bodgaun"
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-brand-ink/70" />
        <div className="relative mx-auto flex min-h-[55vh] max-w-6xl flex-col justify-end px-5 pb-12 pt-32">
          <div className="mb-4">
            <Image
              src="/media/logo.jpg"
              alt="SOSD logo"
              width={80}
              height={80}
              className="h-16 w-16 rounded-full bg-white"
            />
          </div>
          <h1 className="font-display text-4xl sm:text-5xl">Our story</h1>
          <p className="mt-3 max-w-2xl text-white/85">
            School of Social Development · Estd. 2021 · {school.ward}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-5 py-14">
        <p className="text-lg leading-relaxed text-ink">{school.about}</p>
        <p className="mt-6 text-muted leading-relaxed">{school.mission}</p>
        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          <div>
            <h2 className="font-display text-xl text-brand-ink">Where we are</h2>
            <p className="mt-2 text-muted">
              {school.location}, {school.municipality}
              <br />
              {school.district}, Nepal
            </p>
          </div>
          <div>
            <h2 className="font-display text-xl text-brand-ink">Campus</h2>
            <p className="mt-2 text-muted">
              Established {school.established}. Blue campus buildings around a
              shared courtyard — school, youth space, training, and community
              gatherings.
            </p>
          </div>
        </div>
        <a
          href={DONATE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-primary mt-10 pulse-soft"
        >
          Support this village project
        </a>
      </section>
    </PublicShell>
  );
}
