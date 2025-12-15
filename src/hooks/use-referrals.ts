"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { z } from "zod";
import { ApiReferralSchema, type ApiReferral } from "@/schema/api";
import { toggleRedeemed as toggleRedeemedAction } from "@/actions/referral";

interface UseReferralsReturn {
  data: ApiReferral[];
  error: Error | null;
  isLoading: boolean;
  isFetching: boolean;
  refetch: () => Promise<void>;
  toggleRedeemed: (id: number, currentValue: boolean) => Promise<void>;
}

export function useReferrals(): UseReferralsReturn {
  const [data, setData] = useState<ApiReferral[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [isFetching, setIsFetching] = useState(true);
  const hasFetched = useRef(false);

  const isLoading = isFetching && !hasFetched.current;

  const fetchReferrals = useCallback(async () => {
    setIsFetching(true);
    setError(null);
    try {
      const response = await fetch("/api/referral");
      if (!response.ok) {
        throw new Error(`Failed to fetch referrals: ${response.status}`);
      }
      const json = await response.json();
      const validated = z.array(ApiReferralSchema).parse(json);
      setData(validated);
      hasFetched.current = true;
    } catch (caughtError) {
      const error = caughtError instanceof Error ? caughtError : new Error("Unknown error");
      setError(error);
      console.error("[useReferrals] Fetch error:", error);
    } finally {
      setIsFetching(false);
    }
  }, []);

  useEffect(() => {
    fetchReferrals();
  }, [fetchReferrals]);

  const toggleRedeemed = useCallback(async (id: number, currentValue: boolean) => {
    setData((prev) =>
      prev.map((referral) => (referral.id === id ? { ...referral, redeemed: !currentValue } : referral)),
    );

    const result = await toggleRedeemedAction(id);

    if (!result.success) {
      setData((prev) =>
        prev.map((referral) => (referral.id === id ? { ...referral, redeemed: currentValue } : referral)),
      );
      console.error("[useReferrals] Toggle error:", result.error);
    }
  }, []);

  return {
    data,
    error,
    isLoading,
    isFetching,
    refetch: fetchReferrals,
    toggleRedeemed,
  };
}
