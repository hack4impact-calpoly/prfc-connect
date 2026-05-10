export interface TokenVerificationResult {
  valid: boolean;
  error?: string;
  memberId?: number;
  groupId?: number;
  timestamp?: number;
}

export interface EmailTokenVerificationResult {
  valid: boolean;
  error?: string;
  email?: string;
  timestamp?: number;
}
