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
    <Accordion
      type="single"
      collapsible
      className="w-full border-t border-border"
    >
      {faqs.map((faq, index) => (
        <AccordionItem
          key={`item-${index}`}
          value={`item-${index}`}
          className="group/item border-b border-border py-1"
        >
          <AccordionTrigger className="w-full cursor-pointer gap-6 py-6 text-left text-lg leading-snug font-semibold hover:no-underline sm:text-xl [&_[data-slot=accordion-trigger-icon]]:hidden">
            <span>{faq.question}</span>
            <span className="ml-auto flex size-9 shrink-0 items-center justify-center rounded-full border border-border bg-muted/60 transition-colors group-hover/item:border-primary/30 group-hover/item:bg-primary/8">
              <PlusIcon className="size-4 transition-transform duration-200 group-aria-expanded/accordion-trigger:rotate-45" />
            </span>
          </AccordionTrigger>
          <AccordionContent className="max-w-2xl pr-12 pb-6 text-base leading-relaxed text-muted-foreground">
            {faq.answer}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
