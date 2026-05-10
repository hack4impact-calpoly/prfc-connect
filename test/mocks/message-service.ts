import { vi } from "vitest";

vi.mock("@/services/message", () => ({
  sendGroupMessage: vi.fn(),
  sendBlastMessage: vi.fn(),
  getMessageHistoryPage: vi.fn(),
  getMessageById: vi.fn(),
  isMessageRecipient: vi.fn(),
  getMessageRecipients: vi.fn(),
  previewRecipientCounts: vi.fn(),
  processEmailQueue: vi.fn(),
}));

import {
  sendGroupMessage,
  sendBlastMessage,
  getMessageHistoryPage,
  getMessageById,
  isMessageRecipient,
  getMessageRecipients,
  previewRecipientCounts,
  processEmailQueue,
} from "@/services/message";

export const mockSendGroupMessage = vi.mocked(sendGroupMessage);
export const mockSendBlastMessage = vi.mocked(sendBlastMessage);
export const mockGetMessageHistoryPage = vi.mocked(getMessageHistoryPage);
export const mockGetMessageById = vi.mocked(getMessageById);
export const mockIsMessageRecipient = vi.mocked(isMessageRecipient);
export const mockGetMessageRecipients = vi.mocked(getMessageRecipients);
export const mockPreviewRecipientCounts = vi.mocked(previewRecipientCounts);
export const mockProcessEmailQueue = vi.mocked(processEmailQueue);
