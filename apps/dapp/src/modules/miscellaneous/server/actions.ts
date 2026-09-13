'use server';

import { getLocale, getTranslations } from 'next-intl/server';
import { headers } from 'next/headers';
import z from 'zod';

import { RESPONSE_TYPES } from '@/lib/constant';
import { env } from '@/lib/env/server';
import { rateLimit } from '@/lib/rate-limit';
import { resend } from '@/lib/resend';
import { makeFormErrorMap } from '@/lib/zod/error-map';

import { getIpFromHeaders } from '@/utils/ip';
import ContactFormEmail from '@/emails/contact-form';

const MIN_SUBMISSION_TIME = 2000;
const FALLBACK_EMAIL = 'olivermiguel1129@gmail.com';
const ADMIN_EMAIL = 'admin@aquastock.io';
const NO_REPLY_EMAIL = 'no-reply@aquastock.io';

const getAdminRecipient = () =>
  process.env.NODE_ENV === 'production' ? ADMIN_EMAIL : FALLBACK_EMAIL;

const botSchema = z.object({
  blank: z.string().optional(),
  renderTime: z.string().optional(),
});

const emailSchema = z.string().email();

export const submitNewsletterForm = async (formData: FormData) => {
  const req = await headers();

  const now = Date.now();

  const renderTime = formData.get('renderTime');

  if (now - Number(renderTime) < MIN_SUBMISSION_TIME) {
    return {
      ok: false,
      status: 400,
      error: 'There was an error submitting the form. Please try again later.',
    };
  }

  const blank = formData.get('blank');

  if (blank !== '') {
    return {
      ok: false,
      status: 400,
      error: 'There was an error submitting the form. Please try again later.',
    };
  }

  const ip = getIpFromHeaders(req);

  // Add rate limit based on IP
  const decision = await rateLimit.limit(ip ?? 'newsletter-form');

  if (!decision.success) {
    return {
      ...RESPONSE_TYPES.RATE_LIMITED,
    };
  }

  // Extract form data
  const values = Object.fromEntries(formData);

  const validatedValues = botSchema.extend({
    email: emailSchema,
  });

  // Validate form data
  const validation = validatedValues.safeParse(values);

  if (!validation.success) {
    return {
      ok: false,
      status: 400,
      error: 'Invalid form data. Please try again.',
      ...validation.error.flatten(),
    };
  }
  try {
    const { data, error } = await resend.contacts.create({
      email: validation.data.email,
    });

    if (error) {
      console.error(error);
      return {
        ok: false,
        status: 400,
        error:
          'There was an error creating the contact. Please try again later.',
      };
    }

    const newsletter = await resend.contacts.segments.add({
      contactId: data.id,
      segmentId: env('RESEND_NEWSLETTER_AUDIENCE_ID') ?? '',
    });

    if (newsletter.error) {
      console.error(newsletter.error);
      return {
        ok: false,
        status: 400,
        error:
          'There was an error adding the contact to the newsletter segment.',
      };
    }

    // // Check if contact is already in the newsletter segment
    // const isInNewsletterSegment = await resend.contacts.get({
    //   audienceId: env('RESEND_NEWSLETTER_AUDIENCE_ID'),
    //   email: validation.data.email,
    // })

    // if (newsletter.error) {
    //   return {
    //     ok: false,
    //     status: 400,
    //     error:
    //       'There was an error submitting the form. Please try again later.',
    //   };

    return {
      ok: true,
      status: 200,
      message: 'You are now subscribed to the newsletter.',
    };
  } catch (err) {
    console.error(err);

    return {
      ok: false,
      status: 500,
      error: 'An unexpected error occurred. Please try again later.',
    };
  }
};

export const submitContactForm = async (formData: FormData) => {
  const locale = await getLocale();
  const t = await getTranslations({
    locale,
    namespace: 'validation',
  });

  const req = await headers();

  const now = Date.now();

  const renderTime = formData.get('renderTime');

  if (now - Number(renderTime) < MIN_SUBMISSION_TIME) {
    return {
      ...RESPONSE_TYPES.TOO_EARLY,
    };
  }

  const blank = formData.get('blank');

  if (blank !== '') {
    return {
      ok: false,
      status: 400,
      error: 'There was an error submitting the form. Please try again later.',
    };
  }

  const ip = getIpFromHeaders(req);

  // Add rate limit based on IP
  const decision = await rateLimit.limit(ip ?? 'contact-form');

  if (!decision.success) {
    return {
      ok: false,
      status: 429,
      error: 'Too many requests. Please try again later.',
    };
  }

  // Extract form data
  const values = Object.fromEntries(formData);

  const validatedValues = botSchema.extend({
    email: emailSchema,
    lastName: z.string().min(1),
    firstName: z.string().min(1),
    phone: z.string().min(1).max(10),
    message: z.string().min(1).max(1000),
  });

  // Validate form data
  const validation = validatedValues.safeParse(values, {
    error: makeFormErrorMap(t),
  });

  if (!validation.success) {
    return {
      ...RESPONSE_TYPES.VALIDATION_ERROR,
      ...validation.error.flatten(),
    };
  }

  try {
    const { error } = await resend.batch.send([
      {
        from: NO_REPLY_EMAIL,
        to: getAdminRecipient(),
        subject: t('emailSubjects.contact'),
        react: ContactFormEmail({
          firstName: validation.data.firstName,
          lastName: validation.data.lastName,
          email: validation.data.email,
          phone: validation.data.phone,
          message: validation.data.message,
          locale,
        }),
      },
    ]);

    if (error) {
      console.error(error);
      return {
        ok: false,
        status: 400,
        error: 'There was an error sending the email. Please try again later.',
      };
    }

    return {
      ok: true,
      status: 200,
      message: 'Email sent successfully.',
    };
  } catch (err) {
    console.error(err);

    return {
      ok: false,
      status: 500,
      error: 'An unexpected error occurred. Please try again later.',
    };
  }
};
