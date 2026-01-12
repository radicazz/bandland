import Image from "next/image";

import { Container } from "@/components/Container";
import { site } from "@/config/site";

const heroSlides = [
  { src: "/hero-1.svg" },
  { src: "/hero-2.svg" },
  { src: "/hero-3.svg" },
] as const;

export default function Home() {
  return (
    <section className="relative min-h-[80svh] overflow-hidden border-b border-border/60">
      <div aria-hidden className="absolute inset-0">
        {heroSlides.map((slide, index) => (
          <div
            key={slide.src}
            className={`absolute inset-0 hero-slide ${index === 1 ? "hero-slide--2" : ""} ${
              index === 2 ? "hero-slide--3" : ""
            }`}
          >
            <Image
              src={slide.src}
              alt=""
              fill
              sizes="100vw"
              priority={index === 0}
              className="object-cover"
            />
          </div>
        ))}
        <div className="absolute inset-0 bg-bg/70" />
        <div className="absolute inset-0 bg-highlight/15 mix-blend-screen" />
        <div className="absolute inset-0 hero-vignette" />
        <div className="absolute inset-0 hero-grain" />
      </div>

      <Container className="relative flex min-h-[80svh] items-center">
        <h1 className="sr-only">{site.name}</h1>
      </Container>
    </section>
  );
}
