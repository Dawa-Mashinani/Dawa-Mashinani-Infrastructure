-- ============================================================
-- FIX: Grant table-level permissions to anon role
-- RLS policies control WHICH rows are visible, but GRANT 
-- controls WHETHER the role can access the table at all.
-- ============================================================

-- Core tables
GRANT SELECT, INSERT, UPDATE ON public.patients TO anon;
GRANT SELECT, INSERT ON public.health_records TO anon;
GRANT SELECT, INSERT, UPDATE ON public.alerts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ussd_sessions TO anon;

-- Jirani / USSD infrastructure tables
GRANT SELECT, INSERT ON public.jirani_network TO anon;
GRANT SELECT, INSERT ON public.notification_log TO anon;
GRANT SELECT, INSERT ON public.afya_id_tokens TO anon;
GRANT SELECT, INSERT ON public.clinical_vitals TO anon;

-- Also grant to authenticated role for completeness
GRANT SELECT, INSERT, UPDATE ON public.patients TO authenticated;
GRANT SELECT, INSERT ON public.health_records TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.alerts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ussd_sessions TO authenticated;
GRANT SELECT, INSERT ON public.jirani_network TO authenticated;
GRANT SELECT, INSERT ON public.notification_log TO authenticated;
GRANT SELECT, INSERT ON public.afya_id_tokens TO authenticated;
GRANT SELECT, INSERT ON public.clinical_vitals TO authenticated;

-- Grant usage on sequences (for auto-generated IDs)
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
