import "../mocks/next-cache";
import "../mocks/dal";
import "../mocks/encryption";

import { mockPrisma, mockRequireAdmin } from "../mocks";
import { referralCharlie } from "../mocks/referrals";
import { AppError } from "@/utils/errors";

import { toggleRedeemed } from "@/actions/referral";

describe("toggleRedeemed", () => {
  beforeEach(() => {
    mockRequireAdmin.mockReset();
  });

  it("toggles redeemed status when authenticated", async () => {
    mockRequireAdmin.mockResolvedValue({ ownerid: 100184, isAdmin: true });
    mockPrisma.referral.findUnique.mockResolvedValue(referralCharlie);
    mockPrisma.referral.update.mockResolvedValue({ ...referralCharlie, redeemed: true });

    const result = await toggleRedeemed(1);

    expect(result.success).toBe(true);
    expect(mockPrisma.referral.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { redeemed: true },
    });
  });

  it("returns error when not authenticated", async () => {
    mockRequireAdmin.mockRejectedValue(new AppError("FORBIDDEN", "Admin access required"));

    const result = await toggleRedeemed(1);

    expect(result.success).toBe(false);
    expect(result.error).toContain("Admin access required");
  });

  it("returns error for non-existent referral", async () => {
    mockRequireAdmin.mockResolvedValue({ ownerid: 100184, isAdmin: true });
    mockPrisma.referral.findUnique.mockResolvedValue(null);

    const result = await toggleRedeemed(999);

    expect(result.success).toBe(false);
  });
});
