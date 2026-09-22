REVOKE EXECUTE ON FUNCTION public.apply_abandon_penalty(text, integer, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.apply_abandon_penalty(text, integer, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.apply_abandon_penalty(text, integer, text) TO authenticated;