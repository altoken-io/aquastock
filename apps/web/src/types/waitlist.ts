export interface WaitlistRequest {
  phone: string;
  email?: string;
  referredByCode?: string;
}

export interface WaitlistResponse {
  success: boolean;
  referralCode: string;
  shareUrl: string;
  alreadyRegistered?: boolean;
}

export type WaitlistFormValues = {
  phone: string;
  email?: string;
};
