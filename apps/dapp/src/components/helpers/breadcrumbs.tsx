import { Link } from '@/lib/i18n/navigation';

type BreadcrumbItem = {
  label: string;
  href?: string;
  current?: boolean;
};

type BreadcrumbsProps = {
  items: BreadcrumbItem[];
  className?: string;
};

const Breadcrumbs = ({ items, className }: BreadcrumbsProps) => {
  return (
    <nav
      aria-label="Breadcrumb"
      className={`flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400 ${
        className ?? ''
      }`}
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        const content = item.href ? (
          <Link
            href={item.href}
            className={`transition hover:text-neutral-700 dark:hover:text-neutral-200 ${
              item.current || isLast
                ? 'font-medium text-neutral-900 dark:text-neutral-100'
                : ''
            }`}
            aria-current={item.current || isLast ? 'page' : undefined}
          >
            {item.label}
          </Link>
        ) : (
          <span
            className={`${
              item.current || isLast
                ? 'font-medium text-neutral-900 dark:text-neutral-100'
                : ''
            }`}
            aria-current={item.current || isLast ? 'page' : undefined}
          >
            {item.label}
          </span>
        );

        return (
          <span
            key={`${item.label}-${index}`}
            className="flex items-center gap-2"
          >
            {content}
            {!isLast ? (
              <span className="text-neutral-300 dark:text-neutral-600">/</span>
            ) : null}
          </span>
        );
      })}
    </nav>
  );
};

export default Breadcrumbs;
