export const RESPONSE_TYPES = {
  USER_ALREADY_EXISTS: {
    ok: false,
    status: 409,
    type: 'USER_ALREADY_EXISTS',
    message: 'User already exists. Please use another email.',
  },
  BOT_ACTIVITY: {
    ok: false,
    status: 429,
    type: 'BOT_ACTIVITY',
    message: 'We detected unsual activity. Please try again later.',
  },
  OK: {
    ok: true,
    status: 200,
    type: 'OK',
    message: 'Request completed successfully.',
  },
  CREATED: {
    ok: true,
    status: 201,
    type: 'CREATED',
    message: 'Resource created successfully.',
  },
  ALREADY_SUBMITTING: {
    ok: false,
    status: 409,
    type: 'ALREADY_SUBMITTING',
    message: 'We’re already processing this request.',
  },
  FORM_NOT_FOUND: {
    ok: false,
    status: 404,
    type: 'FORM_NOT_FOUND',
    message: 'We couldn’t find the form. Please refresh and try again.',
  },
  ACCEPTED: {
    ok: true,
    status: 202,
    type: 'ACCEPTED',
    message: 'Request accepted. We will keep you posted as it completes.',
  },
  NO_CONTENT: {
    ok: true,
    status: 204,
    type: 'NO_CONTENT',
    message: 'Action completed. There’s nothing else to return right now.',
  },
  BAD_REQUEST: {
    ok: false,
    status: 400,
    type: 'BAD_REQUEST',
    message:
      'We couldn’t process that request. Please double-check and try again.',
  },
  INVALID_CREDENTIALS: {
    ok: false,
    status: 401,
    type: 'INVALID_CREDENTIALS',
    message: 'The email or password you entered is incorrect.',
  },
  UNAUTHORIZED: {
    ok: false,
    status: 401,
    type: 'UNAUTHORIZED',
    message: 'Please sign in to continue.',
  },
  FORBIDDEN: {
    ok: false,
    status: 403,
    type: 'FORBIDDEN',
    message: 'You don’t have permission to perform this action.',
  },
  NOT_FOUND: {
    ok: false,
    status: 404,
    type: 'NOT_FOUND',
    message: 'We couldn’t find the data you requested.',
  },
  VALIDATION_ERROR: {
    ok: false,
    status: 422,
    type: 'VALIDATION_ERROR',
    message: 'Some fields need attention. Check the highlighted inputs.',
  },
  CONFLICT: {
    ok: false,
    status: 409,
    type: 'CONFLICT',
    message: 'This record already exists. Try updating it instead.',
  },
  RATE_LIMITED: {
    ok: false,
    status: 429,
    type: 'RATE_LIMITED',
    message: 'Too many requests right now. Please try again in a moment.',
  },
  DEPENDENCY_FAILURE: {
    ok: false,
    status: 502,
    type: 'DEPENDENCY_FAILURE',
    message: 'One of our partner services is unavailable. We’re on it.',
  },
  SERVICE_UNAVAILABLE: {
    ok: false,
    status: 503,
    type: 'SERVICE_UNAVAILABLE',
    message:
      'We’re momentarily offline for maintenance. Please try again soon.',
  },
  INTERNAL_ERROR: {
    ok: false,
    status: 500,
    type: 'INTERNAL_ERROR',
    message: 'Something unexpected happened. Please try again.',
  },
  UNKNOWN_ERROR: {
    ok: false,
    status: 500,
    type: 'UNKNOWN_ERROR',
    message: 'An unexpected error occurred. Please try again later.',
  },
  EMAIL_NOT_VERIFIED: {
    ok: false,
    status: 403,
    type: 'EMAIL_NOT_VERIFIED',
    message: 'Please verify your email to continue.',
  },
  SESSION_EXPIRED: {
    ok: false,
    status: 401,
    type: 'SESSION_EXPIRED',
    message: 'Your session expired. Please sign in again.',
  },
  MFA_REQUIRED: {
    ok: false,
    status: 401,
    type: 'MFA_REQUIRED',
    message: 'Additional verification is required. Please complete MFA.',
  },
  CSRF_INVALID: {
    ok: false,
    status: 403,
    type: 'CSRF_INVALID',
    message:
      'Your session couldn’t be validated. Please refresh and try again.',
  },
  REQUEST_TIMEOUT: {
    ok: false,
    status: 408,
    type: 'REQUEST_TIMEOUT',
    message: 'The request timed out. Please try again.',
  },
  PAYLOAD_TOO_LARGE: {
    ok: false,
    status: 413,
    type: 'PAYLOAD_TOO_LARGE',
    message: 'The upload is too large. Try a smaller file.',
  },
  UNSUPPORTED_MEDIA_TYPE: {
    ok: false,
    status: 415,
    type: 'UNSUPPORTED_MEDIA_TYPE',
    message: 'This file type isn’t supported.',
  },
  HEADER_TOO_LARGE: {
    ok: false,
    status: 431,
    type: 'HEADER_TOO_LARGE',
    message: 'The request headers are too large.',
  },
  TOO_EARLY: {
    ok: false,
    status: 425,
    type: 'TOO_EARLY',
    message: 'Please wait a moment and try again.',
  },
  PRECONDITION_FAILED: {
    ok: false,
    status: 412,
    type: 'PRECONDITION_FAILED',
    message: 'The request conditions weren’t met. Please refresh.',
  },
  GONE: {
    ok: false,
    status: 410,
    type: 'GONE',
    message: 'This resource is no longer available.',
  },
  GATEWAY_TIMEOUT: {
    ok: false,
    status: 504,
    type: 'GATEWAY_TIMEOUT',
    message: 'Upstream timed out. Please try again.',
  },
  PAYMENT_REQUIRED: {
    ok: false,
    status: 402,
    type: 'PAYMENT_REQUIRED',
    message: 'A payment is required to proceed.',
  },
  LOCKED: {
    ok: false,
    status: 423,
    type: 'LOCKED',
    message: 'This item is temporarily locked. Please try again later.',
  },
} as const;

export const response = ({
  type,
  message,
}: {
  type: ResponseTypes;
  message?: string;
}) => {
  return {
    ...RESPONSE_TYPES[type],
    message: message ?? RESPONSE_TYPES[type].message,
  };
};

export type ResponseTypes = keyof typeof RESPONSE_TYPES;
export type ResponseDescriptor = (typeof RESPONSE_TYPES)[ResponseTypes];

// ============================================
// MOCK NOTIFICATIONS
// ============================================

export const MOCK_NOTIFICATIONS = [
  {
    id: 'notif-001',
    userId: 'user-investor-123',

    type: 'IN_APP',
    channel: 'DASHBOARD',

    title: 'Investment Confirmed',
    message:
      'Your investment of $2,500 in Lima Office Complex has been successfully processed. Your tokens have been allocated to your wallet.',

    sentAt: new Date('2024-12-20T10:30:00Z'),
    readAt: null,

    metadata: {
      propertyId: 'lima-office-complex',
      amount: 2500,
      tokens: 25,
      transactionHash: '0x1234567890abcdef',
      type: 'investment_success',
    },

    createdAt: new Date('2024-12-20T10:30:00Z'),
  },
  {
    id: 'notif-002',
    userId: 'user-investor-123',

    type: 'EMAIL',
    channel: 'TRANSACTIONAL',

    title: 'Monthly Distribution Available',
    message:
      'Your monthly rental distribution of $127.50 from your portfolio holdings is now available in your wallet. This represents a 8.5% annual yield.',

    sentAt: new Date('2024-12-15T09:00:00Z'),
    readAt: new Date('2024-12-15T09:15:00Z'),

    metadata: {
      distributionId: 'dist-2024-12',
      amount: 127.5,
      currency: 'USDC',
      periodStart: '2024-11-01',
      periodEnd: '2024-11-30',
      type: 'monthly_distribution',
    },

    createdAt: new Date('2024-12-15T09:00:00Z'),
  },
  {
    id: 'notif-003',
    userId: 'user-investor-123',

    type: 'IN_APP',
    channel: 'MARKETPLACE',

    title: 'New Property Available',
    message:
      'A new investment opportunity is now available: Panama City Waterfront Condos. Minimum investment: $800. Expected return: 11.5% annually.',

    sentAt: new Date('2024-12-18T14:20:00Z'),
    readAt: null,

    metadata: {
      propertyId: 'panama-city-waterfront-condos',
      minInvestment: 800,
      expectedReturn: 11.5,
      fundingDeadline: '2026-01-15',
      type: 'new_property',
    },

    createdAt: new Date('2024-12-18T14:20:00Z'),
  },
  {
    id: 'notif-004',
    userId: 'user-investor-456',

    type: 'WHATSAPP',
    channel: 'MARKETING',

    title: 'Portfolio Performance Update',
    message:
      'Great news! Your portfolio is up 12.3% this month. Your total holdings are now valued at $45,230. Keep up the excellent investing!',

    sentAt: new Date('2024-12-22T16:45:00Z'),
    readAt: new Date('2024-12-22T17:00:00Z'),

    metadata: {
      portfolioValue: 45230,
      monthlyChange: 12.3,
      totalProperties: 5,
      type: 'portfolio_update',
    },

    createdAt: new Date('2024-12-22T16:45:00Z'),
  },
  {
    id: 'notif-005',
    userId: 'user-investor-789',

    type: 'IN_APP',
    channel: 'SECURITY',

    title: 'KYC Verification Required',
    message:
      'To comply with regulations, please complete your KYC verification. This is required to maintain active investments.',

    sentAt: new Date('2024-12-19T11:10:00Z'),
    readAt: null,

    metadata: {
      kycStatus: 'PENDING',
      requiredDocuments: ['ID', 'Proof of Address'],
      deadline: '2024-12-31',
      type: 'kyc_reminder',
    },

    createdAt: new Date('2024-12-19T11:10:00Z'),
  },
  {
    id: 'notif-006',
    userId: 'user-investor-123',

    type: 'EMAIL',
    channel: 'SYSTEM',

    title: 'Maintenance Window Scheduled',
    message:
      'We will be performing system maintenance on December 25th from 2:00 AM to 4:00 AM UTC. During this time, the platform will be temporarily unavailable.',

    sentAt: new Date('2024-12-20T08:00:00Z'),
    readAt: new Date('2024-12-20T08:30:00Z'),

    metadata: {
      maintenanceStart: '2024-12-25T02:00:00Z',
      maintenanceEnd: '2024-12-25T04:00:00Z',
      affectedServices: ['Trading', 'Deposits', 'Withdrawals'],
      type: 'maintenance_notice',
    },

    createdAt: new Date('2024-12-20T08:00:00Z'),
  },
  {
    id: 'notif-007',
    userId: 'user-investor-123',

    type: 'IN_APP',
    channel: 'PAYMENT',

    title: 'Payment Method Updated',
    message:
      'Your default payment method has been successfully updated to ****4532 (ending in 4532).',

    sentAt: new Date('2024-12-21T13:25:00Z'),
    readAt: new Date('2024-12-21T13:30:00Z'),

    metadata: {
      paymentMethod: 'card',
      lastFour: '4532',
      cardType: 'Visa',
      type: 'payment_method_update',
    },

    createdAt: new Date('2024-12-21T13:25:00Z'),
  },
  {
    id: 'notif-008',
    userId: 'user-investor-456',

    type: 'IN_APP',
    channel: 'TRANSACTIONAL',

    title: 'Investment Milestone Reached',
    message:
      "Congratulations! You've reached $10,000 in total investments. You now qualify for our premium investor benefits.",

    sentAt: new Date('2024-12-17T12:00:00Z'),
    readAt: new Date('2024-12-17T12:15:00Z'),

    metadata: {
      milestone: '10000_invested',
      totalInvested: 10000,
      benefits: ['Priority Support', 'Exclusive Properties', 'Reduced Fees'],
      type: 'milestone_achievement',
    },

    createdAt: new Date('2024-12-17T12:00:00Z'),
  },
];

export const countries = [
  // --- North America (NANP) ---
  {
    name: 'United States',
    code: 'US',
    phoneCode: '+1',
    format: '+1 (XXX) XXX-XXXX',
  },
  { name: 'Canada', code: 'CA', phoneCode: '+1', format: '+1 (XXX) XXX-XXXX' },
  { name: 'Mexico', code: 'MX', phoneCode: '+52', format: '+52 XXX XXX XXXX' },
  { name: 'Jamaica', code: 'JM', phoneCode: '+1', format: '+1 (876) XXX-XXXX' },
  {
    name: 'Dominican Republic',
    code: 'DO',
    phoneCode: '+1',
    format: '+1 (809) XXX-XXXX',
  },

  // --- South America ---
  { name: 'Brazil', code: 'BR', phoneCode: '+55', format: '+55 XX XXXXX XXXX' },
  {
    name: 'Argentina',
    code: 'AR',
    phoneCode: '+54',
    format: '+54 XXX XXX XXXX',
  },
  { name: 'Chile', code: 'CL', phoneCode: '+56', format: '+56 X XXXX XXXX' },
  {
    name: 'Colombia',
    code: 'CO',
    phoneCode: '+57',
    format: '+57 XXX XXX XXXX',
  },
  { name: 'Peru', code: 'PE', phoneCode: '+51', format: '+51 XXX XXX XXX' },
  {
    name: 'Ecuador',
    code: 'EC',
    phoneCode: '+593',
    format: '+593 XX XXX XXXX',
  },
  { name: 'Uruguay', code: 'UY', phoneCode: '+598', format: '+598 XX XXX XXX' },
  {
    name: 'Paraguay',
    code: 'PY',
    phoneCode: '+595',
    format: '+595 XXX XXX XXX',
  },
  { name: 'Bolivia', code: 'BO', phoneCode: '+591', format: '+591 X XXX XXXX' },
  {
    name: 'Venezuela',
    code: 'VE',
    phoneCode: '+58',
    format: '+58 XXX XXX XXXX',
  },

  // --- Europe (EU/EEA & neighbors) ---
  {
    name: 'United Kingdom',
    code: 'GB',
    phoneCode: '+44',
    format: '+44 XXXX XXXXXX',
  },
  {
    name: 'Ireland',
    code: 'IE',
    phoneCode: '+353',
    format: '+353 XX XXX XXXX',
  },
  { name: 'France', code: 'FR', phoneCode: '+33', format: '+33 X XX XX XX XX' },
  { name: 'Germany', code: 'DE', phoneCode: '+49', format: '+49 XXX XXXXXXXX' },
  {
    name: 'Netherlands',
    code: 'NL',
    phoneCode: '+31',
    format: '+31 XX XXX XXXX',
  },
  { name: 'Belgium', code: 'BE', phoneCode: '+32', format: '+32 XXX XX XX XX' },
  {
    name: 'Luxembourg',
    code: 'LU',
    phoneCode: '+352',
    format: '+352 XXX XXX XXX',
  },
  {
    name: 'Switzerland',
    code: 'CH',
    phoneCode: '+41',
    format: '+41 XX XXX XXXX',
  },
  { name: 'Austria', code: 'AT', phoneCode: '+43', format: '+43 XXX XXXXXX' },
  { name: 'Spain', code: 'ES', phoneCode: '+34', format: '+34 XXX XXX XXX' },
  {
    name: 'Portugal',
    code: 'PT',
    phoneCode: '+351',
    format: '+351 XXX XXX XXX',
  },
  { name: 'Italy', code: 'IT', phoneCode: '+39', format: '+39 XXX XXX XXXX' },
  { name: 'Denmark', code: 'DK', phoneCode: '+45', format: '+45 XXXX XXXX' },
  { name: 'Norway', code: 'NO', phoneCode: '+47', format: '+47 XX XX XX XX' },
  { name: 'Sweden', code: 'SE', phoneCode: '+46', format: '+46 XX XXX XXXX' },
  {
    name: 'Finland',
    code: 'FI',
    phoneCode: '+358',
    format: '+358 XX XXX XXXX',
  },
  { name: 'Iceland', code: 'IS', phoneCode: '+354', format: '+354 XXX XXXX' },
  { name: 'Poland', code: 'PL', phoneCode: '+48', format: '+48 XXX XXX XXX' },
  {
    name: 'Czechia',
    code: 'CZ',
    phoneCode: '+420',
    format: '+420 XXX XXX XXX',
  },
  {
    name: 'Slovakia',
    code: 'SK',
    phoneCode: '+421',
    format: '+421 XXX XXX XXX',
  },
  { name: 'Hungary', code: 'HU', phoneCode: '+36', format: '+36 XX XXX XXXX' },
  {
    name: 'Slovenia',
    code: 'SI',
    phoneCode: '+386',
    format: '+386 XX XXX XXX',
  },
  { name: 'Croatia', code: 'HR', phoneCode: '+385', format: '+385 XX XXX XXX' },
  {
    name: 'Bosnia and Herzegovina',
    code: 'BA',
    phoneCode: '+387',
    format: '+387 XX XXX XXX',
  },
  { name: 'Serbia', code: 'RS', phoneCode: '+381', format: '+381 XX XXX XXXX' },
  {
    name: 'Montenegro',
    code: 'ME',
    phoneCode: '+382',
    format: '+382 XX XXX XXX',
  },
  {
    name: 'North Macedonia',
    code: 'MK',
    phoneCode: '+389',
    format: '+389 XX XXX XXX',
  },
  {
    name: 'Albania',
    code: 'AL',
    phoneCode: '+355',
    format: '+355 XX XXX XXXX',
  },
  { name: 'Greece', code: 'GR', phoneCode: '+30', format: '+30 XXX XXX XXXX' },
  { name: 'Romania', code: 'RO', phoneCode: '+40', format: '+40 XXX XXX XXX' },
  {
    name: 'Bulgaria',
    code: 'BG',
    phoneCode: '+359',
    format: '+359 XX XXX XXXX',
  },
  {
    name: 'Lithuania',
    code: 'LT',
    phoneCode: '+370',
    format: '+370 XXX XXXXX',
  },
  { name: 'Latvia', code: 'LV', phoneCode: '+371', format: '+371 XXXX XXXX' },
  { name: 'Estonia', code: 'EE', phoneCode: '+372', format: '+372 XXXX XXXX' },
  {
    name: 'Ukraine',
    code: 'UA',
    phoneCode: '+380',
    format: '+380 XX XXX XXXX',
  },
  {
    name: 'Belarus',
    code: 'BY',
    phoneCode: '+375',
    format: '+375 XX XXX XXXX',
  },
  { name: 'Moldova', code: 'MD', phoneCode: '+373', format: '+373 XX XXX XXX' },
  { name: 'Turkey', code: 'TR', phoneCode: '+90', format: '+90 XXX XXX XXXX' },

  // --- Middle East & Central Asia ---
  { name: 'Israel', code: 'IL', phoneCode: '+972', format: '+972 XX XXX XXXX' },
  {
    name: 'United Arab Emirates',
    code: 'AE',
    phoneCode: '+971',
    format: '+971 XX XXX XXXX',
  },
  {
    name: 'Saudi Arabia',
    code: 'SA',
    phoneCode: '+966',
    format: '+966 XX XXX XXXX',
  },
  { name: 'Qatar', code: 'QA', phoneCode: '+974', format: '+974 XXXX XXXX' },
  { name: 'Kuwait', code: 'KW', phoneCode: '+965', format: '+965 XXXX XXXX' },
  { name: 'Bahrain', code: 'BH', phoneCode: '+973', format: '+973 XXXX XXXX' },
  { name: 'Oman', code: 'OM', phoneCode: '+968', format: '+968 XXXX XXXX' },
  { name: 'Jordan', code: 'JO', phoneCode: '+962', format: '+962 X XXXX XXXX' },
  { name: 'Lebanon', code: 'LB', phoneCode: '+961', format: '+961 X XXX XXX' },
  { name: 'Iraq', code: 'IQ', phoneCode: '+964', format: '+964 XXX XXX XXXX' },
  { name: 'Iran', code: 'IR', phoneCode: '+98', format: '+98 XXX XXX XXXX' },
  {
    name: 'Pakistan',
    code: 'PK',
    phoneCode: '+92',
    format: '+92 XXX XXX XXXX',
  },
  {
    name: 'Kazakhstan',
    code: 'KZ',
    phoneCode: '+7',
    format: '+7 XXX XXX XXXX',
  },
  {
    name: 'Azerbaijan',
    code: 'AZ',
    phoneCode: '+994',
    format: '+994 XX XXX XXXX',
  },
  { name: 'Armenia', code: 'AM', phoneCode: '+374', format: '+374 XX XXX XXX' },
  {
    name: 'Georgia',
    code: 'GE',
    phoneCode: '+995',
    format: '+995 XXX XXX XXX',
  },
  {
    name: 'Uzbekistan',
    code: 'UZ',
    phoneCode: '+998',
    format: '+998 XX XXX XXXX',
  },
  {
    name: 'Kyrgyzstan',
    code: 'KG',
    phoneCode: '+996',
    format: '+996 XXX XXX XXX',
  },
  {
    name: 'Tajikistan',
    code: 'TJ',
    phoneCode: '+992',
    format: '+992 XX XXX XXXX',
  },
  {
    name: 'Turkmenistan',
    code: 'TM',
    phoneCode: '+993',
    format: '+993 X XXX XXXX',
  },

  // --- Africa ---
  {
    name: 'South Africa',
    code: 'ZA',
    phoneCode: '+27',
    format: '+27 XX XXX XXXX',
  },
  { name: 'Egypt', code: 'EG', phoneCode: '+20', format: '+20 XX XXXX XXXX' },
  {
    name: 'Morocco',
    code: 'MA',
    phoneCode: '+212',
    format: '+212 XXX XXX XXX',
  },
  {
    name: 'Algeria',
    code: 'DZ',
    phoneCode: '+213',
    format: '+213 XX XXX XXXX',
  },
  { name: 'Tunisia', code: 'TN', phoneCode: '+216', format: '+216 XX XXX XXX' },
  {
    name: 'Nigeria',
    code: 'NG',
    phoneCode: '+234',
    format: '+234 XXX XXX XXXX',
  },
  { name: 'Ghana', code: 'GH', phoneCode: '+233', format: '+233 XX XXX XXXX' },
  { name: 'Kenya', code: 'KE', phoneCode: '+254', format: '+254 XXX XXX XXX' },
  {
    name: 'Tanzania',
    code: 'TZ',
    phoneCode: '+255',
    format: '+255 XXX XXX XXX',
  },
  { name: 'Uganda', code: 'UG', phoneCode: '+256', format: '+256 XXX XXX XXX' },
  { name: 'Rwanda', code: 'RW', phoneCode: '+250', format: '+250 XXX XXX XXX' },
  {
    name: 'Ethiopia',
    code: 'ET',
    phoneCode: '+251',
    format: '+251 XX XXX XXXX',
  },
  {
    name: 'Senegal',
    code: 'SN',
    phoneCode: '+221',
    format: '+221 XXX XXX XXX',
  },
  {
    name: 'Côte d’Ivoire',
    code: 'CI',
    phoneCode: '+225',
    format: '+225 XX XX XX XX XX',
  },
  { name: 'Cameroon', code: 'CM', phoneCode: '+237', format: '+237 XXXX XXXX' },
  {
    name: 'São Tomé and Príncipe',
    code: 'ST',
    phoneCode: '+239',
    format: '+239 XXX XXXX',
  },
  { name: 'Angola', code: 'AO', phoneCode: '+244', format: '+244 XXX XXX XXX' },
  {
    name: 'Mozambique',
    code: 'MZ',
    phoneCode: '+258',
    format: '+258 XX XXX XXX',
  },
  { name: 'Comoros', code: 'KM', phoneCode: '+269', format: '+269 XX XXXX' },
  { name: 'Zambia', code: 'ZM', phoneCode: '+260', format: '+260 XXX XXX XXX' },

  // --- Asia-Pacific ---
  {
    name: 'Australia',
    code: 'AU',
    phoneCode: '+61',
    format: '+61 XXX XXX XXX',
  },
  {
    name: 'New Zealand',
    code: 'NZ',
    phoneCode: '+64',
    format: '+64 XXX XXX XXXX',
  },
  { name: 'Japan', code: 'JP', phoneCode: '+81', format: '+81 XX XXXX XXXX' },
  {
    name: 'South Korea',
    code: 'KR',
    phoneCode: '+82',
    format: '+82 XX XXXX XXXX',
  },
  {
    name: 'North Korea',
    code: 'KP',
    phoneCode: '+850',
    format: '+850 XXX XXXX',
  },
  { name: 'China', code: 'CN', phoneCode: '+86', format: '+86 XXX XXXX XXXX' },
  { name: 'Taiwan', code: 'TW', phoneCode: '+886', format: '+886 9XX XXX XXX' },
  { name: 'Singapore', code: 'SG', phoneCode: '+65', format: '+65 XXXX XXXX' },
  { name: 'Malaysia', code: 'MY', phoneCode: '+60', format: '+60 X XXX XXXX' },
  {
    name: 'Indonesia',
    code: 'ID',
    phoneCode: '+62',
    format: '+62 8XX XXXX XXXX',
  },
  {
    name: 'Timor-Leste',
    code: 'TL',
    phoneCode: '+670',
    format: '+670 XXX XXXX',
  },
  {
    name: 'Philippines',
    code: 'PH',
    phoneCode: '+63',
    format: '+63 XXX XXX XXXX',
  },
  { name: 'Thailand', code: 'TH', phoneCode: '+66', format: '+66 XX XXX XXXX' },
  { name: 'Vietnam', code: 'VN', phoneCode: '+84', format: '+84 XX XXXX XXXX' },
  {
    name: 'Cambodia',
    code: 'KH',
    phoneCode: '+855',
    format: '+855 XX XXX XXX',
  },
  { name: 'Laos', code: 'LA', phoneCode: '+856', format: '+856 XX XXX XXX' },
  {
    name: 'Myanmar (Burma)',
    code: 'MM',
    phoneCode: '+95',
    format: '+95 XX XXX XXX',
  },
  {
    name: 'Mongolia',
    code: 'MN',
    phoneCode: '+976',
    format: '+976 XX XX XXXX',
  },
  { name: 'India', code: 'IN', phoneCode: '+91', format: '+91 XXXXX XXXXX' },
  {
    name: 'Sri Lanka',
    code: 'LK',
    phoneCode: '+94',
    format: '+94 XX XXX XXXX',
  },
  {
    name: 'Bangladesh',
    code: 'BD',
    phoneCode: '+880',
    format: '+880 XXX XXX XXXX',
  },
  { name: 'Nepal', code: 'NP', phoneCode: '+977', format: '+977 XXX XXX XXX' },

  // --- Others/Eurasia ---
  { name: 'Russia', code: 'RU', phoneCode: '+7', format: '+7 XXX XXX XXXX' },
  { name: 'Benin', code: 'BJ', phoneCode: '+229', format: '+229 XX XX XX XX' },
  {
    name: 'Botswana',
    code: 'BW',
    phoneCode: '+267',
    format: '+267 XX XXX XXX',
  },
  {
    name: 'Burkina Faso',
    code: 'BF',
    phoneCode: '+226',
    format: '+226 XX XX XX XX',
  },
  { name: 'Burundi', code: 'BI', phoneCode: '+257', format: '+257 XX XX XXXX' },
  {
    name: 'Cape Verde',
    code: 'CV',
    phoneCode: '+238',
    format: '+238 XXX XXXX',
  },
  {
    name: 'Central African Republic',
    code: 'CF',
    phoneCode: '+236',
    format: '+236 XX XX XX XX',
  },
  { name: 'Chad', code: 'TD', phoneCode: '+235', format: '+235 XX XX XX XX' },
  { name: 'Congo', code: 'CG', phoneCode: '+242', format: '+242 XX XXX XXXX' },
  {
    name: 'Congo, Democratic Republic',
    code: 'CD',
    phoneCode: '+243',
    format: '+243 XX XXX XXXX',
  },
  {
    name: 'Djibouti',
    code: 'DJ',
    phoneCode: '+253',
    format: '+253 XX XX XX XX',
  },
  {
    name: 'Equatorial Guinea',
    code: 'GQ',
    phoneCode: '+240',
    format: '+240 XXX XXXX',
  },
  { name: 'Eritrea', code: 'ER', phoneCode: '+291', format: '+291 X XXX XXX' },
  { name: 'Eswatini', code: 'SZ', phoneCode: '+268', format: '+268 XXXX XXXX' },
  { name: 'Gabon', code: 'GA', phoneCode: '+241', format: '+241 X XX XX XX' },
  { name: 'Gambia', code: 'GM', phoneCode: '+220', format: '+220 XXX XXXX' },
  { name: 'Guinea', code: 'GN', phoneCode: '+224', format: '+224 XXX XX XX' },
  {
    name: 'Guinea-Bissau',
    code: 'GW',
    phoneCode: '+245',
    format: '+245 XXX XXXX',
  },
  { name: 'Lesotho', code: 'LS', phoneCode: '+266', format: '+266 XXXX XXXX' },
  { name: 'Liberia', code: 'LR', phoneCode: '+231', format: '+231 XX XXX XXX' },
  { name: 'Libya', code: 'LY', phoneCode: '+218', format: '+218 XX XXX XXXX' },
  {
    name: 'Madagascar',
    code: 'MG',
    phoneCode: '+261',
    format: '+261 XX XX XXX XX',
  },
  { name: 'Malawi', code: 'MW', phoneCode: '+265', format: '+265 X XXX XXXX' },
  { name: 'Mali', code: 'ML', phoneCode: '+223', format: '+223 XX XX XX XX' },
  {
    name: 'Mauritania',
    code: 'MR',
    phoneCode: '+222',
    format: '+222 XX XX XX XX',
  },
  {
    name: 'Mauritius',
    code: 'MU',
    phoneCode: '+230',
    format: '+230 XXXX XXXX',
  },
  {
    name: 'Namibia',
    code: 'NA',
    phoneCode: '+264',
    format: '+264 XX XXX XXXX',
  },
  { name: 'Niger', code: 'NE', phoneCode: '+227', format: '+227 XX XX XX XX' },
  {
    name: 'Seychelles',
    code: 'SC',
    phoneCode: '+248',
    format: '+248 X XXX XXX',
  },
  {
    name: 'Sierra Leone',
    code: 'SL',
    phoneCode: '+232',
    format: '+232 XX XXX XXX',
  },
  { name: 'Somalia', code: 'SO', phoneCode: '+252', format: '+252 X XXX XXXX' },
  {
    name: 'South Sudan',
    code: 'SS',
    phoneCode: '+211',
    format: '+211 XX XXX XXXX',
  },
  { name: 'Sudan', code: 'SD', phoneCode: '+249', format: '+249 XX XXX XXXX' },
  { name: 'Togo', code: 'TG', phoneCode: '+228', format: '+228 XX XX XX XX' },
  {
    name: 'Zimbabwe',
    code: 'ZW',
    phoneCode: '+263',
    format: '+263 XX XXX XXXX',
  },

  // --- Americas (Caribbean & Central America) ---
  { name: 'Bahamas', code: 'BS', phoneCode: '+1', format: '+1 (242) XXX-XXXX' },
  {
    name: 'Barbados',
    code: 'BB',
    phoneCode: '+1',
    format: '+1 (246) XXX-XXXX',
  },
  { name: 'Belize', code: 'BZ', phoneCode: '+501', format: '+501 XXX XXXX' },
  {
    name: 'Costa Rica',
    code: 'CR',
    phoneCode: '+506',
    format: '+506 XXXX XXXX',
  },
  { name: 'Cuba', code: 'CU', phoneCode: '+53', format: '+53 X XXX XXXX' },
  {
    name: 'Dominica',
    code: 'DM',
    phoneCode: '+1',
    format: '+1 (767) XXX-XXXX',
  },
  {
    name: 'El Salvador',
    code: 'SV',
    phoneCode: '+503',
    format: '+503 XXXX XXXX',
  },
  { name: 'Grenada', code: 'GD', phoneCode: '+1', format: '+1 (473) XXX-XXXX' },
  {
    name: 'Guatemala',
    code: 'GT',
    phoneCode: '+502',
    format: '+502 XXXX XXXX',
  },
  { name: 'Guyana', code: 'GY', phoneCode: '+592', format: '+592 XXX XXXX' },
  { name: 'Haiti', code: 'HT', phoneCode: '+509', format: '+509 XXXX XXXX' },
  { name: 'Honduras', code: 'HN', phoneCode: '+504', format: '+504 XXXX XXXX' },
  {
    name: 'Nicaragua',
    code: 'NI',
    phoneCode: '+505',
    format: '+505 XXXX XXXX',
  },
  { name: 'Panama', code: 'PA', phoneCode: '+507', format: '+507 XXX XXXX' },
  {
    name: 'Saint Kitts and Nevis',
    code: 'KN',
    phoneCode: '+1',
    format: '+1 (869) XXX-XXXX',
  },
  {
    name: 'Saint Lucia',
    code: 'LC',
    phoneCode: '+1',
    format: '+1 (758) XXX-XXXX',
  },
  {
    name: 'Saint Vincent and the Grenadines',
    code: 'VC',
    phoneCode: '+1',
    format: '+1 (784) XXX-XXXX',
  },
  { name: 'Suriname', code: 'SR', phoneCode: '+597', format: '+597 XXX XXXX' },
  {
    name: 'Trinidad and Tobago',
    code: 'TT',
    phoneCode: '+1',
    format: '+1 (868) XXX-XXXX',
  },
  {
    name: 'Antigua and Barbuda',
    code: 'AG',
    phoneCode: '+1',
    format: '+1 (268) XXX-XXXX',
  },

  // --- Europe (microstates & additions) ---
  { name: 'Andorra', code: 'AD', phoneCode: '+376', format: '+376 XXX XXX' },
  { name: 'Cyprus', code: 'CY', phoneCode: '+357', format: '+357 XX XXX XXX' },
  { name: 'Kosovo', code: 'XK', phoneCode: '+383', format: '+383 XX XXX XXX' },
  {
    name: 'Liechtenstein',
    code: 'LI',
    phoneCode: '+423',
    format: '+423 XXX XXXX',
  },
  { name: 'Monaco', code: 'MC', phoneCode: '+377', format: '+377 XX XX XX XX' },
  { name: 'Malta', code: 'MT', phoneCode: '+356', format: '+356 XXXX XXXX' },
  {
    name: 'San Marino',
    code: 'SM',
    phoneCode: '+378',
    format: '+378 XXXX XXXX',
  },
  {
    name: 'Vatican City',
    code: 'VA',
    phoneCode: '+39',
    format: '+39 06 XXXXXXXX',
  },

  // --- Middle East & Central Asia (additional) ---
  {
    name: 'Afghanistan',
    code: 'AF',
    phoneCode: '+93',
    format: '+93 XX XXX XXXX',
  },
  { name: 'Syria', code: 'SY', phoneCode: '+963', format: '+963 XX XXX XXX' },
  { name: 'Yemen', code: 'YE', phoneCode: '+967', format: '+967 XXX XXX XXX' },
  {
    name: 'Palestine',
    code: 'PS',
    phoneCode: '+970',
    format: '+970 XX XXX XXXX',
  },

  // --- Asia-Pacific (additional) ---
  { name: 'Bhutan', code: 'BT', phoneCode: '+975', format: '+975 X XXX XXX' },
  { name: 'Brunei', code: 'BN', phoneCode: '+673', format: '+673 XXX XXXX' },
  { name: 'Maldives', code: 'MV', phoneCode: '+960', format: '+960 XXX XXXX' },

  // --- Oceania / Pacific nations ---
  { name: 'Fiji', code: 'FJ', phoneCode: '+679', format: '+679 XXX XXXX' },
  { name: 'Kiribati', code: 'KI', phoneCode: '+686', format: '+686 XX XXX' },
  {
    name: 'Marshall Islands',
    code: 'MH',
    phoneCode: '+692',
    format: '+692 XXX XXXX',
  },
  {
    name: 'Micronesia (Federated States)',
    code: 'FM',
    phoneCode: '+691',
    format: '+691 XXX XXXX',
  },
  { name: 'Nauru', code: 'NR', phoneCode: '+674', format: '+674 XXX XXXX' },
  { name: 'Palau', code: 'PW', phoneCode: '+680', format: '+680 XXX XXXX' },
  {
    name: 'Papua New Guinea',
    code: 'PG',
    phoneCode: '+675',
    format: '+675 XXX XXXX',
  },
  { name: 'Samoa', code: 'WS', phoneCode: '+685', format: '+685 XX XXXX' },
  {
    name: 'Solomon Islands',
    code: 'SB',
    phoneCode: '+677',
    format: '+677 XXX XXX',
  },
  { name: 'Tonga', code: 'TO', phoneCode: '+676', format: '+676 XXX XXX' },
  { name: 'Tuvalu', code: 'TV', phoneCode: '+688', format: '+688 XXXXX' },
  { name: 'Vanuatu', code: 'VU', phoneCode: '+678', format: '+678 XXXXX' },
];
