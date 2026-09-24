import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { PlusIcon } from 'lucide-react';

export default function FaqMenu({
  faqs,
}: {
  faqs: { question: string; answer: string }[];
}) {
  return (
    <Accordion type="single" collapsible className="flex flex-col gap-3">
      {faqs.map((faq, index) => (
        <AccordionItem
          key={`item-${index}`}
          value={`item-${index}`}
          className="rounded-2xl border border-border bg-card px-5 shadow-xs transition-colors duration-200 not-last:border-b data-open:border-foreground/15 sm:px-6"
        >
          <AccordionTrigger className="w-full cursor-pointer items-center gap-6 py-5 text-left hover:no-underline [&_[data-slot=accordion-trigger-icon]]:hidden">
            <span className="text-base leading-snug font-medium text-pretty sm:text-lg">
              {faq.question}
            </span>
            {/* Plus turns into a cross as the answer opens: it names what the click will do. */}
            <span className="ml-auto flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors group-hover/accordion-trigger:text-foreground group-aria-expanded/accordion-trigger:bg-foreground group-aria-expanded/accordion-trigger:text-background">
              <PlusIcon className="size-4 transition-transform duration-300 ease-out-strong group-aria-expanded/accordion-trigger:rotate-45 motion-reduce:transition-none" />
            </span>
          </AccordionTrigger>
          <AccordionContent className="max-w-xl pr-14 pb-6 text-base leading-relaxed text-pretty text-muted-foreground">
            {faq.answer}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
