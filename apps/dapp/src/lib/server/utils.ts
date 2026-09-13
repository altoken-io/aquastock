import { request } from '@arcjet/next';
import { headers as nextHeaders } from 'next/headers';

import { aj } from '@/lib/arcjet';
import { RESPONSE_TYPES } from '@/lib/constant';
import { rateLimit } from '@/lib/rate-limit';

import { getIpFromHeaders } from '@/utils/ip';

const MIN_SUBMISSION_TIME = 2000;

export const validateForm = async (formData: FormData) => {
  const renderTimeRaw = formData.get('renderTime');
  const blankRaw = formData.get('blank');

  const renderTime = Number(renderTimeRaw);

  // Reject missing or invalid renderTime
  if (!Number.isFinite(renderTime)) {
    return RESPONSE_TYPES.BOT_ACTIVITY;
  }

  const now = Date.now();
  if (now - renderTime < MIN_SUBMISSION_TIME) {
    return RESPONSE_TYPES.BOT_ACTIVITY;
  }

  if (blankRaw !== '') {
    return RESPONSE_TYPES.BOT_ACTIVITY;
  }

  // Build a scoped rate-limit key per form
  const req = await request();
  const headers = await nextHeaders();
  const ip = getIpFromHeaders(headers) ?? 'auth-form';

  const rateLimitKey = `${ip}:auth-form`;
  const decision = await rateLimit.limit(rateLimitKey);

  if (!decision.success) {
    return { ...RESPONSE_TYPES.RATE_LIMITED };
  }

  // Arcjet bot/abuse protection as a separate check
  const arcjet = await aj.protect(req, { requested: 1 });
  if (!arcjet.isAllowed()) {
    return { ...RESPONSE_TYPES.RATE_LIMITED };
  }

  return { ...RESPONSE_TYPES.OK };
};

export const rateLimitForm = async () => {
  // Build a scoped rate-limit key per form
  const req = await request();
  const headers = await nextHeaders();
  const ip = getIpFromHeaders(headers) ?? 'auth-form';

  const rateLimitKey = `${ip}:auth-form`;
  const decision = await rateLimit.limit(rateLimitKey);

  if (!decision.success) {
    return { ...RESPONSE_TYPES.RATE_LIMITED };
  }

  // Arcjet bot/abuse protection as a separate check
  const arcjet = await aj.protect(req, { requested: 1 });
  if (!arcjet.isAllowed()) {
    return { ...RESPONSE_TYPES.RATE_LIMITED };
  }

  return { ...RESPONSE_TYPES.OK };
};

export const tryCatch = async <T = unknown>(
  fn: Promise<T>,
): Promise<SuccessResponse<T> | ErrorResponse> => {
  try {
    const result = await fn;

    if (!result) {
      return {
        ok: false,
        status: 404,
        type: 'NOT_FOUND',
        message: 'No data found',
      };
    }

    return {
      ok: true,
      type: 'OK',
      status: 200,
      data: result,
      message: 'Request completed successfully.',
    };
  } catch (error) {
    console.error(
      `Error trying to execute function: ${fn.toString()} ${error}`,
    );
    return {
      ok: false,
      status: 500,
      type: 'INTERNAL_ERROR',
      message: 'If error persists, please contact support',
    };
  }
};

export const getPagination = ({
  totalCount,
  currentPage,
  limit = 20,
}: {
  totalCount: number;
  currentPage: number;
  limit?: number;
}) => {
  const safeLimit = Number.isFinite(limit)
    ? Math.max(1, Math.floor(limit))
    : 20;
  const totalPages = Math.ceil(totalCount / safeLimit);
  const safeCurrentPage = Number.isFinite(currentPage)
    ? Math.max(1, Math.floor(currentPage))
    : 1;
  const clampedCurrentPage =
    totalPages > 0 ? Math.min(safeCurrentPage, totalPages) : safeCurrentPage;
  const hasNextPage = clampedCurrentPage < totalPages;
  const hasPrevPage = 1 < clampedCurrentPage;
  const nextPage =
    totalPages > clampedCurrentPage ? clampedCurrentPage + 1 : null;
  const prevPage = clampedCurrentPage > 1 ? clampedCurrentPage - 1 : null;
  const offset = (clampedCurrentPage - 1) * safeLimit;
  return {
    limit: safeLimit,
    totalPages,
    totalCount,
    hasPrevPage,
    hasNextPage,
    currentPage: clampedCurrentPage,
    nextPage,
    prevPage,
    offset,
  };
};
