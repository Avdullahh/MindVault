-- The initial grants only revoked from the PUBLIC pseudo-role, which does
-- not undo Supabase's default per-role EXECUTE grants to `anon` on new
-- public-schema functions -- the security advisor flagged all 3 as
-- anon-callable. Revoke from anon (and authenticated, to be re-granted
-- cleanly) explicitly, matching the pattern already documented for this
-- kind of function (see the supabase-postgres-best-practices skill's
-- security-rls-performance guidance).
revoke execute on function public.check_ai_usage() from public, anon, authenticated;
revoke execute on function public.reserve_ai_usage() from public, anon, authenticated;
revoke execute on function public.refund_ai_usage() from public, anon, authenticated;

grant execute on function public.check_ai_usage() to authenticated;
grant execute on function public.reserve_ai_usage() to authenticated;
grant execute on function public.refund_ai_usage() to authenticated;
