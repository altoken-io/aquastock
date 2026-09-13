import ButtonLink from '@/components/ui/button-link';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export type LegalSubsection = {
  id: string;
  number: string;
  heading: string;
  jurisdiction?: string;
  paragraphs: string[];
  list?: string[];
};

export type LegalSection = {
  id: string;
  number: string;
  title: string;
  paragraphs: string[];
  list?: string[];
  subsections?: LegalSubsection[];
};

export type LegalPageContent = {
  eyebrow: string;
  title: string;
  description: string;
  summary: {
    effectiveLabel: string;
    effectiveValue: string;
    appliesLabel: string;
    appliesValue: string;
    statusLabel: string;
    statusValue: string;
    contactLabel: string;
    contactValue: string;
  };
  tocLabel: string;
  sections: LegalSection[];
  contact: {
    title: string;
    body: string;
    email: string;
    buttonLabel: string;
  };
};

/**
 * Shared reading layout for public legal documents (Terms, Privacy).
 *
 * Structure is modeled on a AquaStock payment receipt rather than a generic
 * legal template: a dashed-edge summary card up top surfaces the
 * document's own "metadata" (effective date, status, contact) the same
 * way a transfer receipt surfaces amount, fee, and status. A numbered
 * table of contents mirrors the sections below it because the document
 * itself has a fixed reading order.
 *
 * `subsections` (e.g. 2.1, 9.2) nest under their parent section rather
 * than appearing in the top-level table of contents, so a deeply
 * structured document doesn't turn the nav into a second document.
 * `jurisdiction` on a subsection is only for content that genuinely
 * splits by country (e.g. Peru's ARCO rights vs. U.S. state rights) —
 * it's informative, not decorative.
 */
export function LegalPage({ content }: { content: LegalPageContent }) {
  const { eyebrow, title, description, summary, tocLabel, sections, contact } =
    content;

  const summaryRows = [
    { label: summary.effectiveLabel, value: summary.effectiveValue },
    { label: summary.appliesLabel, value: summary.appliesValue },
    { label: summary.statusLabel, value: summary.statusValue },
    { label: summary.contactLabel, value: summary.contactValue },
  ];

  return (
    <div className="w-full px-6 py-16 sm:px-12 lg:px-24 lg:py-24">
      <div className="mx-auto max-w-7xl">
        <p className="mb-4 text-xs font-medium tracking-[0.14em] text-primary uppercase">
          {eyebrow}
        </p>
        <h1 className="mb-5 text-4xl sm:text-5xl lg:text-6xl">{title}</h1>
        <p className="mb-10 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          {description}
        </p>

        <div className="mb-12 rounded-2xl border border-border bg-muted px-6 py-5 sm:px-8 sm:py-6">
          <div className="grid grid-cols-2 gap-x-8 gap-y-5 border-t border-dashed border-border pt-5 sm:grid-cols-4">
            {summaryRows.map((row) => (
              <div key={row.label} className="flex flex-col gap-1">
                <span className="text-[11px] tracking-[0.1em] text-muted-foreground uppercase">
                  {row.label}
                </span>
                <span className="text-sm font-medium text-foreground">
                  {row.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        <Separator className="mb-12" />

        <nav
          aria-label={tocLabel}
          className="mb-10 -mx-6 flex gap-2 overflow-x-auto px-6 pb-2 lg:hidden"
        >
          {sections.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              className="shrink-0 rounded-full border border-border px-3 py-1.5 text-xs whitespace-nowrap text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
            >
              {section.number} · {section.title}
            </a>
          ))}
        </nav>

        <div className="lg:grid lg:grid-cols-[220px_minmax(0,1fr)] lg:items-start lg:gap-16">
          <nav
            aria-label={tocLabel}
            className="sticky top-28 hidden max-h-[calc(100vh-8rem)] overflow-y-auto lg:block"
          >
            <p className="mb-4 text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
              {tocLabel}
            </p>
            <ol className="flex flex-col border-l border-border">
              {sections.map((section) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    className="-ml-px flex gap-3 border-l-2 border-transparent py-1.5 pl-4 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
                  >
                    <span className="font-headline text-[11px] text-primary/70 tabular-nums">
                      {section.number}
                    </span>
                    <span>{section.title}</span>
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <div>
            <div className="flex flex-col divide-y divide-border">
              {sections.map((section) => (
                <section
                  key={section.id}
                  id={section.id}
                  className="py-8 first:pt-0 sm:py-10"
                >
                  <div className="mb-4 flex items-baseline gap-3">
                    <span className="font-headline text-sm text-primary tabular-nums">
                      {section.number}
                    </span>
                    <h2 className="text-2xl sm:text-3xl">{section.title}</h2>
                  </div>
                  <div className="flex flex-col gap-4 text-[15px] leading-relaxed text-foreground/90 sm:text-base">
                    {section.paragraphs.map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                    {section.list && (
                      <ul className="flex flex-col gap-2 pl-1">
                        {section.list.map((item) => (
                          <li key={item} className="flex gap-3">
                            <span
                              aria-hidden="true"
                              className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-primary"
                            />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {section.subsections && (
                    <div className="mt-8 flex flex-col gap-7 border-l border-border pl-5 sm:pl-6">
                      {section.subsections.map((sub) => (
                        <div key={sub.id} id={sub.id} className="scroll-mt-28">
                          <div className="mb-3 flex flex-wrap items-baseline gap-x-3 gap-y-1.5">
                            <span className="font-headline text-xs text-primary/70 tabular-nums">
                              {sub.number}
                            </span>
                            <h3 className="text-lg sm:text-xl">
                              {sub.heading}
                            </h3>
                            {sub.jurisdiction && (
                              <Badge variant="outline" className="sm:ml-1">
                                {sub.jurisdiction}
                              </Badge>
                            )}
                          </div>
                          <div className="flex flex-col gap-3 text-[15px] leading-relaxed text-foreground/90 sm:text-base">
                            {sub.paragraphs.map((paragraph) => (
                              <p key={paragraph}>{paragraph}</p>
                            ))}
                            {sub.list && (
                              <ul className="flex flex-col gap-2 pl-1">
                                {sub.list.map((item) => (
                                  <li key={item} className="flex gap-3">
                                    <span
                                      aria-hidden="true"
                                      className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-primary/60"
                                    />
                                    <span>{item}</span>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              ))}
            </div>

            <div className="mt-12 rounded-3xl border border-border bg-secondary/40 px-6 py-8 sm:px-10 sm:py-10">
              <h2 className="mb-2 text-2xl sm:text-3xl">{contact.title}</h2>
              <p className="mb-6 max-w-prose text-foreground/80">
                {contact.body}
              </p>
              <ButtonLink
                href={`mailto:${contact.email}`}
                variant="primary"
                rounded="full"
                padding="lg"
                shadow="sm"
                animation="grow"
              >
                {contact.buttonLabel}
              </ButtonLink>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
