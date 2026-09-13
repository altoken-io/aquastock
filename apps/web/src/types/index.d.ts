type ResponseTypes =
  | 'OK'
  | 'CREATED'
  | 'ACCEPTED'
  | 'NO_CONTENT'
  | 'BAD_REQUEST'
  | 'INVALID_CREDENTIALS'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'CONFLICT'
  | 'RATE_LIMITED'
  | 'DEPENDENCY_FAILURE'
  | 'SERVICE_UNAVAILABLE'
  | 'INTERNAL_ERROR'
  | 'UNKNOWN_ERROR'
  | 'EMAIL_NOT_VERIFIED'
  | 'SESSION_EXPIRED'
  | 'MFA_REQUIRED'
  | 'CSRF_INVALID'
  | 'REQUEST_TIMEOUT'
  | 'PAYLOAD_TOO_LARGE'
  | 'UNSUPPORTED_MEDIA_TYPE'
  | 'HEADER_TOO_LARGE'
  | 'TOO_EARLY'
  | 'PRECONDITION_FAILED'
  | 'GONE'
  | 'GATEWAY_TIMEOUT'
  | 'PAYMENT_REQUIRED'
  | 'LOCKED'
  | 'USER_ALREADY_EXISTS'
  | 'BOT_ACTIVITY'
  | 'ALREADY_SUBMITTING'
  | 'FORM_NOT_FOUND';

type DefaultParams = Readonly<{
  sort?: string;
  page?: string;
  order?: string;
  limit?: string;
  search?: string;
  // Additional filters
  type?: string | string[];
  status?: string | string[];
  category?: string | string[];
  location?: string | string[];
  workplace?: string | string[];
}>;

type DefaultSearchParams = Readonly<{
  sort?: string;
  page?: string;
  limit?: string;
  search?: string;
  order?: 'desc' | 'asc';
  type?: string | string[];
  status?: string | string[];
  category?: string | string[];
  location?: string | string[];
  workplace?: string | string[];
}>;

type SuccessResponse<T = unknown> = {
  ok: true;
  status: number;
  message: string;
  type: ResponseTypes;
  data?: T;
};

type ErrorResponse = {
  ok: false;
  status?: number;
  type: ResponseTypes;
  message: string;
  error?: string;
  stack?: string;
  details?: Record<string, string[]>;
};

type NavLink = {
  href: string;
  title: string;
  category?: string;
  description?: string;
  onClick?: () => void;
  dropdown?: {
    categories: {
      title?: string;
      links: {
        href: string;
        title: string;
        description?: string;
        onClick?: () => void;
      }[];
    }[];
  };
  rotation?: number;
  hoverStyles?: { bgColor: string; textColor: string };
};
