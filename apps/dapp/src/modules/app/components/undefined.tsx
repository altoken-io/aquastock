import { Metadata } from 'next';

import ButtonLink from '@/components/ui/button-link';

export const metadata: Metadata = {
  title: 'Page Not Found',
  description: 'The requested page was not found.',
  robots: { index: false, follow: false },
};

const Undefined = ({ label = 'Data' }: { label: string }) => {
  return (
    <main className="flex min-h-screen bg-linear-to-b bg-gradient-secondary">
      <section className="container mx-auto grow px-8 py-24 max-sm:px-4">
        <div className="flex h-full flex-col items-center justify-center gap-6 text-center">
          <div className="mx-auto max-w-lg space-y-2">
            <h1 className="text-9xl max-sm:text-7xl">{label}</h1>
            <p className="text-muted-normal text-lg">
              No {label.toLowerCase()} were found. For any questions, please
              contact us or try again later.
            </p>
          </div>
          <ButtonLink href="/" variant="transparent">
            Go to Home
          </ButtonLink>

          {/* <div className="flex flex-col items-center gap-4">
            <p>— Contact Us —</p>
            <div className="flex w-full items-center justify-evenly gap-6">
              {socialLinks.map((social) => (
                <Link key={social.href} href={social.href}>
                  <Icon
                    icon={social.icon}
                    className="size-6"
                    width={24}
                    height={24}
                  />
                </Link>
              ))}
            </div>
          </div> */}
        </div>
      </section>
    </main>
  );
};

export default Undefined;
