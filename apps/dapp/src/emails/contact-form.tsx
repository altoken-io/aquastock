import {
  Body,
  Button,
  Container,
  Font,
  Head,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Tailwind,
  Text,
} from '@react-email/components';
import { Locale } from 'next-intl';

type ContactFormEmailProps = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  message: string;
  locale?: Locale;
};

const copy = {
  en: {
    preview: 'New contact form submission',
    badge: 'Contact form',
    heading: 'New contact request',
    subtitle: 'A new message was submitted',
    body: 'Review the details below and reply to the sender when you are ready.',
    fields: {
      name: 'Name',
      email: 'Email',
      phone: 'Phone',
      message: 'Message',
    },
    reply: 'Reply to sender',
    footer: 'AquaStock · {year} · All rights reserved.',
  },
  es: {
    preview: 'Nuevo mensaje del formulario',
    badge: 'Formulario de contacto',
    heading: 'Nueva solicitud de contacto',
    subtitle: 'Se ha recibido un nuevo mensaje',
    body: 'Revisa los datos y responde al remitente cuando estés listo.',
    fields: {
      name: 'Nombre',
      email: 'Email',
      phone: 'Teléfono',
      message: 'Mensaje',
    },
    reply: 'Responder al remitente',
    footer: 'AquaStock · {year} · Todos los derechos reservados.',
  },
};

const ContactFormEmail = ({
  firstName,
  lastName,
  email,
  phone,
  message,
  locale = 'en',
}: ContactFormEmailProps) => {
  const t = locale === 'en' ? copy.en : copy.es;
  const currentYear = new Date().getFullYear();
  const fullName = `${firstName} ${lastName}`.trim();

  return (
    <Html>
      <Head>
        <Font
          fontFamily="Inter"
          fallbackFontFamily="Arial"
          webFont={{
            url: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTcviYw.ttf',
            format: 'truetype',
          }}
          fontWeight={400}
          fontStyle="normal"
        />
      </Head>
      <Preview>{t.preview}</Preview>
      <Tailwind>
        <Body
          className="m-0 bg-slate-50 px-4 py-8 text-slate-900"
          style={{ fontFamily: '"Inter", Arial, sans-serif' }}
        >
          <Container className="mx-auto max-w-lg w-full">
            <Container className="rounded-2xl border border-neutral-300/75 bg-white p-8 shadow-sm">
              <Section className="mx-auto">
                <Img
                  src="https://aquastock.io/assets/favicon/android-chrome-192x192.png"
                  alt="AquaStock"
                  width="64"
                  className="mx-auto"
                  style={{
                    border: '0',
                    display: 'block',
                    objectFit: 'contain',
                  }}
                />
                <Text className="my-2 rounded-lg bg-red-200/75 w-fit mx-auto text-center px-4 py-2 text-xs font-semibold uppercase tracking-widest text-red-700">
                  {t.badge}
                </Text>
              </Section>

              <Section className="my-6">
                <Text className="text-xl font-semibold leading-tight text-neutral-800">
                  {t.heading}
                </Text>
                <Text className="text-sm font-semibold uppercase tracking-widest text-red-700">
                  {t.subtitle}
                </Text>
                <Text className="text-base leading-relaxed text-neutral-600/75">
                  {t.body}
                </Text>
              </Section>

              <Section className="my-6 rounded-xl border border-neutral-200 bg-slate-50 px-5 py-4">
                <Text className="m-0 text-xs font-semibold uppercase tracking-[0.18em] text-red-700">
                  {t.fields.name}
                </Text>
                <Text className="m-0 mt-2 text-base font-semibold text-slate-900">
                  {fullName || '-'}
                </Text>
              </Section>

              <Section className="space-y-3">
                <Text className="m-0 text-sm text-neutral-700">
                  <span className="font-semibold text-neutral-800">
                    {t.fields.email}:
                  </span>{' '}
                  {email}
                </Text>
                <Text className="m-0 text-sm text-neutral-700">
                  <span className="font-semibold text-neutral-800">
                    {t.fields.phone}:
                  </span>{' '}
                  {phone}
                </Text>
                <Text className="m-0 text-sm font-semibold text-neutral-800">
                  {t.fields.message}:
                </Text>
                <Text className="m-0 whitespace-pre-wrap text-sm leading-relaxed text-neutral-700">
                  {message}
                </Text>
              </Section>

              <Section className="my-6 text-center">
                <Button
                  href={`mailto:${email}`}
                  style={{
                    display: 'inline-block',
                    backgroundColor: '#e6153b',
                    color: '#ffffff',
                    padding: '12px 20px',
                    borderRadius: '9999px',
                    fontSize: '14px',
                    fontWeight: 600,
                    textDecoration: 'none',
                    textAlign: 'center',
                    border: 'none',
                  }}
                >
                  {t.reply}
                </Button>
              </Section>

              <Hr className="my-8 border-neutral-300/75" />
            </Container>
            <Text className="my-4 text-xs leading-5 text-neutral-600/75 text-center">
              {t.footer.replace('{year}', currentYear.toString())}
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default ContactFormEmail;
