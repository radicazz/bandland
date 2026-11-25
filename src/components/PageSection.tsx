import Image from "next/image";
import type { ReactNode } from "react";

import { Container } from "@/components/Container";
import { Slanted } from "@/components/Slanted";

export function PageSection({ children }: { children: ReactNode }) {
  return (
    <section>
      <Container className="py-12 sm:py-16 lg:py-20">{children}</Container>
    </section>
  );
}

/** Page heading: optional kicker, heavy headline with a red marker stroke, short intro, taped photo. */
export function PageIntro({
  label,
  title,
  description,
  photo,
}: {
  label?: string;
  title: string;
  description: string;
  /** Decorative band photo (3:2) taped beside the heading on md+. */
  photo?: string;
}) {
  return (
    <header className="grid items-center gap-10 md:grid-cols-[minmax(0,1fr)_auto]">
      <div className="max-w-3xl">
        {label ? <p className="kicker">{label}</p> : null}
        <h1 className={`headline text-6xl sm:text-7xl lg:text-8xl ${label ? "mt-4" : ""}`}>
          {title}
        </h1>
        <span aria-hidden="true" className="mt-4 block h-2 w-28 -rotate-1 bg-highlight sm:w-36" />
        {description ? (
          <p className="mt-6 max-w-2xl break-words text-lg font-medium leading-8 text-text-muted">
            {description}
          </p>
        ) : null}
      </div>
      {photo ? (
        <div className="photo-frame tilt-right hidden w-72 md:block lg:w-96">
          <Image
            src={photo}
            alt=""
            width={1200}
            height={800}
            sizes="384px"
            className="aspect-[3/2] object-cover"
            loading="eager"
          />
        </div>
      ) : null}
    </header>
  );
}

/** Empty list state: a torn ink slip with the message beside a taped band photo. */
export function EmptyNotice({ message, photo }: { message: string; photo: string }) {
  return (
    <div className="mt-12 grid items-center gap-10 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
      <div className="panel-ink torn-bottom paper-grain px-6 pt-8 pb-12 sm:px-10 sm:pt-10 sm:pb-14">
        <p className="headline headline-italic text-4xl sm:text-5xl">
          <Slanted text={message} />
        </p>
        <span aria-hidden="true" className="mt-5 block h-1.5 w-24 -rotate-1 bg-red" />
      </div>
      <div className="photo-frame tilt-right mx-auto w-full max-w-md">
        <Image
          src={photo}
          alt=""
          width={1200}
          height={800}
          sizes="(max-width: 767px) 100vw, 448px"
          className="aspect-[3/2] object-cover"
        />
      </div>
    </div>
  );
}
