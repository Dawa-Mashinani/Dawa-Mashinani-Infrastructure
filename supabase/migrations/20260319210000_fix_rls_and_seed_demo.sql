-- ============================================================
-- FIX: RLS Policies + Seed Demo Alerts + AT Simulator Phones
-- Run this in Supabase SQL Editor
-- ============================================================

-- ============================
-- 1. FIX RLS: Allow anon reads on patients & health_records
-- (The app uses anon key without auth)
-- ============================
CREATE POLICY "Patients readable by anon" ON public.patients FOR SELECT TO anon USING (true);
CREATE POLICY "Patients insertable by anon" ON public.patients FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Patients updatable by anon" ON public.patients FOR UPDATE TO anon USING (true);

CREATE POLICY "Health records readable by anon" ON public.health_records FOR SELECT TO anon USING (true);
CREATE POLICY "Health records insertable by anon" ON public.health_records FOR INSERT TO anon WITH CHECK (true);

-- Allow anon updates on alerts (for respond button in dashboards)
CREATE POLICY "Alerts updatable by anon" ON public.alerts FOR UPDATE TO anon USING (true);

-- ============================
-- 2. SEED: 3 Demo Alerts (so dashboards show data immediately)
-- ============================

-- Alert 1: Critical emergency from Amina via USSD (pending)
INSERT INTO public.alerts (patient_name, phone, symptom, severity, location, status, source, alert_type, patient_id)
SELECT 'Amina Wanjiku', '+254712345678', 'Medical Emergency (USSD) - Severe chest pain and difficulty breathing', 'critical', 'Kibera, Nairobi', 'pending', 'ussd', 'emergency', p.id
FROM public.patients p WHERE p.upi = 'UPI-99999';

-- Alert 2: High severity Rafiki triage from Mary (pending)
INSERT INTO public.alerts (patient_name, phone, symptom, severity, location, status, source, alert_type, patient_id)
SELECT 'Mary Akinyi', '+254711223344', 'Malaria (Rafiki USSD) - High fever, chills, sweating for 3 days', 'high', 'Kibera, Nairobi', 'pending', 'ussd', 'medical', p.id
FROM public.patients p WHERE p.upi = 'UPI-12345';

-- Alert 3: Medium severity from app (acknowledged)
INSERT INTO public.alerts (patient_name, phone, symptom, severity, location, status, source, alert_type, responded_by, response_notes, responded_at, patient_id)
SELECT 'John Kamau', '+254722334455', 'Persistent cough and mild fever', 'medium', 'Mathare, Nairobi', 'acknowledged', 'app', 'medical', 'Joseph Ochieng (CHP)', 'Patient advised to visit clinic. Follow-up scheduled.', now() - interval '2 hours', p.id
FROM public.patients p WHERE p.upi = 'UPI-67890';

-- ============================
-- 3. SEED: Notification Logs for Alert 1 (Amina's emergency)
-- So dashboard shows SMS/Voice sent to neighbors
-- ============================

-- Get Amina's emergency alert ID
DO $$
DECLARE
  v_alert_id UUID;
BEGIN
  SELECT id INTO v_alert_id FROM public.alerts 
  WHERE patient_name = 'Amina Wanjiku' AND alert_type = 'emergency' AND symptom LIKE '%chest pain%'
  ORDER BY created_at DESC LIMIT 1;

  IF v_alert_id IS NOT NULL THEN
    -- SMS to Neighbor 1
    INSERT INTO public.notification_log (alert_id, recipient_phone, recipient_name, notification_type, message_content, status)
    VALUES (v_alert_id, '+254700444001', 'Mama Fatuma', 'sms', 'EMERGENCY! Your neighbor Amina Wanjiku needs help NOW at Kibera, Nairobi. Please respond immediately! - Dawa Mashinani Jirani Network', 'sent');

    -- SMS to Neighbor 2
    INSERT INTO public.notification_log (alert_id, recipient_phone, recipient_name, notification_type, message_content, status)
    VALUES (v_alert_id, '+254700444002', 'Baba Onyango', 'sms', 'EMERGENCY! Your neighbor Amina Wanjiku needs help NOW at Kibera, Nairobi. Please respond immediately! - Dawa Mashinani Jirani Network', 'sent');

    -- SMS to Neighbor 3
    INSERT INTO public.notification_log (alert_id, recipient_phone, recipient_name, notification_type, message_content, status)
    VALUES (v_alert_id, '+254700444003', 'Nyokabi Muthoni', 'sms', 'EMERGENCY! Your neighbor Amina Wanjiku needs help NOW at Kibera, Nairobi. Please respond immediately! - Dawa Mashinani Jirani Network', 'sent');

    -- SMS to CHP
    INSERT INTO public.notification_log (alert_id, recipient_phone, recipient_name, notification_type, message_content, status)
    VALUES (v_alert_id, '+254723456789', 'Joseph Ochieng (CHP)', 'sms', 'EMERGENCY ALERT: Patient Amina Wanjiku (+254712345678) at Kibera, Nairobi has triggered a medical emergency via USSD. Respond IMMEDIATELY. - Dawa Mashinani', 'sent');

    -- Voice call to CHP
    INSERT INTO public.notification_log (alert_id, recipient_phone, recipient_name, notification_type, message_content, status)
    VALUES (v_alert_id, '+254723456789', 'Joseph Ochieng (CHP)', 'voice', 'Emergency voice call initiated', 'sent');

    -- Confirmation SMS to patient
    INSERT INTO public.notification_log (alert_id, recipient_phone, recipient_name, notification_type, message_content, status)
    VALUES (v_alert_id, '+254712345678', 'Amina Wanjiku', 'sms', 'Your emergency alert has been received. 3 neighbors and CHP Joseph Ochieng have been notified. Help is on the way. Stay calm.', 'sent');
  END IF;
END $$;

-- ============================
-- DONE! Dashboards will now show 3 alerts with full notification logs
-- ============================
