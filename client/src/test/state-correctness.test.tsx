import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MatchScore } from "@/components/recommendation/MatchScore";
import { formatCurrencyAmount } from "@/lib/currency";
import {
  comparisonStorageKey,
  readComparisonIds,
} from "@/lib/comparisonStorage";
import { loadComparisonData } from "@/lib/comparisonData";
import { upsertNotification } from "@/lib/notifications";
import { isLatestRequest } from "@/lib/latestRequest";
import type { Notification } from "@/types/notification";
import type { University } from "@/types/university";

const notification: Notification = {
  id: 1,
  type: "recommendation_ready",
  title: "Ready",
  message: "Recommendations are ready.",
  is_read: false,
  created_at: "2026-01-01T00:00:00Z",
  read_at: null,
};

describe("frontend stabilization state", () => {
  it("does not invent USD when a cost currency is unknown", () => {
    expect(formatCurrencyAmount(20000, null)).toBe("20,000 (currency unavailable)");
    expect(formatCurrencyAmount(20000, null)).not.toContain("USD");
  });
  it("does not duplicate realtime notification IDs or inflate derived unread state", () => {
    const state = upsertNotification([notification], notification);
    expect(state).toHaveLength(1);
    expect(state.filter((item) => !item.is_read)).toHaveLength(1);
  });

  it("does not let a stale realtime event make a persisted read item unread", () => {
    const persisted = {
      ...notification,
      is_read: true,
      read_at: "2026-01-01T00:01:00Z",
    };
    const state = upsertNotification([persisted], notification);
    expect(state[0].is_read).toBe(true);
    expect(state.filter((item) => !item.is_read)).toHaveLength(0);
  });

  it("isolates comparison IDs by authenticated user key and rejects stale snapshots", () => {
    sessionStorage.setItem(comparisonStorageKey(10), JSON.stringify([1, 2]));
    sessionStorage.setItem(comparisonStorageKey(20), JSON.stringify([3]));
    expect(readComparisonIds(10)).toEqual([1, 2]);
    expect(readComparisonIds(20)).toEqual([3]);
  });

  it("refetches current comparison data from stored university IDs", async () => {
    const calls: number[] = [];
    const university = { id: 1, name: "Current name" };
    const result = await loadComparisonData(
      [1],
      undefined,
      async (id) => { calls.push(id); return university as University; },
      async () => ({ generation_id: null, model_version: null, generated_at: null, recommendations: [] }),
    );
    expect(calls).toEqual([1]);
    expect(result.universities[0].name).toBe("Current name");
  });

  it("allows only the latest simulator request to update results", () => {
    expect(isLatestRequest(3, 3)).toBe(true);
    expect(isLatestRequest(1, 3)).toBe(false);
    expect(isLatestRequest(2, 3)).toBe(false);
  });

  it("renders an explicit missing-data match state", () => {
    render(<MatchScore score={null} coverage={0} available={0} total={4} />);
    expect(screen.getByText("Profile match unavailable")).toBeInTheDocument();
  });

  it("renders match coverage separately from the score", () => {
    render(<MatchScore score={87} coverage={0.75} available={3} total={4} />);
    expect(screen.getByText("87%")).toBeInTheDocument();
    expect(screen.getByText(/Based on 3 of 4 criteria/)).toBeInTheDocument();
  });
});
