import { supabase } from '@/integrations/supabase/client';

/** Configurable abandonment penalty model (CC Tokens). */
export const ABANDON_PENALTIES: { minProgress: number; tokens: number }[] = [
  { minProgress: 100, tokens: 0 },
  { minProgress: 75, tokens: 10 },
  { minProgress: 50, tokens: 15 },
  { minProgress: 25, tokens: 20 },
  { minProgress: 0, tokens: 30 },
];

/** Grace period (ms) before a disconnect counts as an abandonment. */
export const ABANDON_GRACE_MS = 25_000;

const PENDING_KEY = 'cc_pending_abandon';

export interface PendingAbandon {
  sessionKey: string;
  progress: number;
  matchType: string;
  at: number;
}

export const penaltyFor = (progress: number) =>
  ABANDON_PENALTIES.find(p => progress >= p.minProgress)?.tokens ?? 0;

/** Remember an in-progress match so a refresh/tab close can be settled later. */
export const markPendingAbandon = (p: Omit<PendingAbandon, 'at'>) => {
  try {
    localStorage.setItem(PENDING_KEY, JSON.stringify({ ...p, at: Date.now() }));
  } catch {
    /* storage unavailable — ignore */
  }
};

export const clearPendingAbandon = () => {
  try {
    localStorage.removeItem(PENDING_KEY);
  } catch {
    /* ignore */
  }
};

export const readPendingAbandon = (): PendingAbandon | null => {
  try {
    const raw = localStorage.getItem(PENDING_KEY);
    return raw ? (JSON.parse(raw) as PendingAbandon) : null;
  } catch {
    return null;
  }
};

export interface AbandonResult {
  tokensDeducted: number;
  remainingTokens: number;
  progressPercent: number;
}

/**
 * Applies the abandonment penalty server-side. Idempotent per session key,
 * never drops the balance below zero and never changes ELO.
 */
export const applyAbandonPenalty = async (
  sessionKey: string,
  progress: number,
  matchType = 'battle'
): Promise<AbandonResult | null> => {
  try {
    const { data, error } = await supabase.rpc('apply_abandon_penalty', {
      p_session_key: sessionKey,
      p_progress: Math.round(progress),
      p_match_type: matchType,
    });
    if (error) throw error;
    const row: any = Array.isArray(data) ? data[0] : data;
    if (!row) return null;
    return {
      tokensDeducted: row.tokens_deducted ?? 0,
      remainingTokens: row.remaining_tokens ?? 0,
      progressPercent: row.progress_percent ?? Math.round(progress),
    };
  } catch {
    return null;
  }
};

/**
 * Settles a match left behind by a refresh or tab close, after the grace period.
 * Returns the applied penalty, or null if the user reconnected in time.
 */
export const settlePendingAbandon = async (): Promise<AbandonResult | null> => {
  const pending = readPendingAbandon();
  if (!pending) return null;
  clearPendingAbandon();
  if (Date.now() - pending.at < ABANDON_GRACE_MS) return null; // reconnected in time
  return applyAbandonPenalty(pending.sessionKey, pending.progress, pending.matchType);
};
