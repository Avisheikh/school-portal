import Image from "next/image";
import { PublicShell } from "@/components/layout/SiteChrome";
import { DONATE_URL } from "@/lib/donate";

export const metadata = { title: "Impact" };

const stories = [
  {
    src: "/media/campus-mustard.jpg",
    title: "A beacon in the mustard fields",
    text: "The sky-blue campus stands where opportunity once felt far away — a permanent home for learning in Bodgaun.",
  },
  {
    src: "/media/welcome-celebration.jpg",
    title: "Children celebrated, not forgotten",
    text: "School uniforms, shared cakes, and open arms — volunteers and villagers building joy together.",
  },
  {
    src: "/media/tika-blessing.jpg",
    title: "Rooted in culture",
    text: "Blessings, care, and community wrap around every child who walks through our courtyard.",
  },
  {
    src: "/media/playground-friends.jpg",
    title: "Social development in small acts",
    text: "Helping a friend tie a shoe. Playing as a team. Growing kindness alongside literacy.",
  },
];

export default function ImpactPage() {
  return (
    <PublicShell>
      <section className="relative min-h-[60vh] overflow-hidden text-white">
        <Image
          src="/media/village-aerial.jpg"
          alt="Bodgaun village from above"
          fill
          priority
          className="object-cover ken-burns"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-brand-ink/65" />
        <div className="relative mx-auto flex min-h-[60vh] max-w-6xl flex-col justify-end px-5 pb-14 pt-32">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-mustard">
            Our impact
          </p>
          <h1 className="font-display mt-3 max-w-3xl text-4xl sm:text-6xl">
            From a remote hillside to a living classroom
          </h1>
          <p className="mt-4 max-w-xl text-white/90">
            SOSD is not a distant charity story — it is a village project you can
            see, visit, and strengthen with your gift.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16">
        <div className="grid gap-12">
          {stories.map((s, i) => (
            <article
              key={s.title}
              className={`grid items-center gap-8 lg:grid-cols-2 ${
                i % 2 === 1 ? "lg:[&>div:first-child]:order-2" : ""
              }`}
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                <Image
                  src={s.src}
                  alt={s.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </div>
              <div>
                <h2 className="font-display text-3xl text-brand-ink">{s.title}</h2>
                <p className="mt-4 text-muted leading-relaxed">{s.text}</p>
              </div>
            </article>
          ))}
        </div>
        <div className="mt-16 text-center">
          <a
            href={DONATE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary pulse-soft text-base"
          >
            Donate to continue this impact
          </a>
        </div>
      </section>
    </PublicShell>
  );
}
