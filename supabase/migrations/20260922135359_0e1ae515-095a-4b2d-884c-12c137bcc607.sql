CREATE TABLE public.match_abandonments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  session_key text NOT NULL,
  match_type text NOT NULL DEFAULT 'battle',
  progress_percent integer NOT NULL DEFAULT 0,
  tokens_deducted integer NOT NULL DEFAULT 0,
  reason text NOT NULL DEFAULT 'force_exit',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, session_key)
);

GRANT SELECT ON public.match_abandonments TO authenticated;
GRANT ALL ON public.match_abandonments TO service_role;

ALTER TABLE public.match_abandonments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own abandonments"
ON public.match_abandonments FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.apply_abandon_penalty(
  p_session_key text,
  p_progress integer,
  p_match_type text DEFAULT 'battle'
)
RETURNS TABLE (tokens_deducted integer, remaining_tokens integer, progress_percent integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_progress integer := GREATEST(0, LEAST(100, COALESCE(p_progress, 0)));
  v_penalty integer;
  v_existing public.match_abandonments%ROWTYPE;
  v_balance integer;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO v_existing FROM public.match_abandonments
  WHERE user_id = v_user AND session_key = p_session_key;

  IF FOUND THEN
    SELECT xp INTO v_balance FROM public.profiles WHERE user_id = v_user;
    RETURN QUERY SELECT v_existing.tokens_deducted, COALESCE(v_balance, 0), v_existing.progress_percent;
    RETURN;
  END IF;

  v_penalty := CASE
    WHEN v_progress >= 100 THEN 0
    WHEN v_progress >= 75 THEN 10
    WHEN v_progress >= 50 THEN 15
    WHEN v_progress >= 25 THEN 20
    ELSE 30
  END;

  SELECT xp INTO v_balance FROM public.profiles WHERE user_id = v_user;
  v_balance := COALESCE(v_balance, 0);
  v_penalty := LEAST(v_penalty, v_balance);

  UPDATE public.profiles
  SET xp = GREATEST(0, xp - v_penalty), streak = 0
  WHERE user_id = v_user
  RETURNING xp INTO v_balance;

  INSERT INTO public.match_abandonments (user_id, session_key, match_type, progress_percent, tokens_deducted)
  VALUES (v_user, p_session_key, COALESCE(p_match_type, 'battle'), v_progress, v_penalty);

  RETURN QUERY SELECT v_penalty, COALESCE(v_balance, 0), v_progress;
END;
$$;

GRANT EXECUTE ON FUNCTION public.apply_abandon_penalty(text, integer, text) TO authenticated;