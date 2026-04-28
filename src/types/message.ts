export interface MessageResult {
  messageId: number;
  emailCount: number;
  smsCount: number;
  failedCount: number;
}

export interface MessageSummary {
  id: number;
  subject: string;
  body: string;
  sentAt: Date;
  senderId: number;
  emailCount: number;
  smsCount: number;
  failedCount: number;
}

export interface MessageHistoryItem {
  id: number;
  subject: string;
  body: string;
  sentAt: Date;
  emailCount: number;
  smsCount: number;
  failedCount: number;
  isBlast: boolean;
  groupNames: string[];
}

export interface MessageDetail extends MessageSummary {
  isBlast: boolean;
  groupNames: string[];
}

export interface RecipientStatus {
  memberId: number;
  memberName: string;
  channel: string;
  status: string;
  sentAt: Date | null;
}

export interface RecipientCounts {
  emailEligible: number;
  smsEligible: number;
  smsIneligible: number;
}
