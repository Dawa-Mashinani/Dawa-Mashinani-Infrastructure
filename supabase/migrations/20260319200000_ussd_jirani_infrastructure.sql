-- ============================================================
-- Dawa Mashinani: USSD + Jirani Emergency Infrastructure
-- Run this in Supabase SQL Editor or via CLI migration
-- ============================================================

-- ============================
-- 1. EXTEND PATIENTS TABLE
-- ============================
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS sha_no TEXT;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS ward TEXT;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS nid TEXT; -- National ID
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS language_pref TEXT DEFAULT 'en';

-- Update existing seed patients with SHA/NID/Ward
UPDATE public.patients SET sha_no = 'SHA-2026-0001', ward = 'Kibera', nid = '12345678' WHERE upi = 'UPI-12345';
UPDATE public.patients SET sha_no = 'SHA-2026-0002', ward = 'Mathare', nid = '23456789' WHERE upi = 'UPI-67890';
UPDATE public.patients SET sha_no = 'SHA-2026-0003', ward = 'Dandora', nid = '34567890' WHERE upi = 'UPI-11111';

-- Add Amina Wanjiku (the demo app patient) to DB
INSERT INTO public.patients (upi, name, phone, age, gender, location, last_visit, sha_no, ward, nid)
VALUES ('UPI-99999', 'Amina Wanjiku', '+254712345678', 35, 'Female', 'Kibera, Nairobi', '2026-03-18', 'SHA-2026-0004', 'Kibera', '98765432')
ON CONFLICT (phone) DO UPDATE SET sha_no = EXCLUDED.sha_no, ward = EXCLUDED.ward, nid = EXCLUDED.nid;

-- ============================
-- 2. EXTEND ALERTS TABLE
-- ============================
ALTER TABLE public.alerts ADD COLUMN IF NOT EXISTS alert_type TEXT DEFAULT 'medical';
ALTER TABLE public.alerts ADD COLUMN IF NOT EXISTS patient_id UUID REFERENCES public.patients(id);
ALTER TABLE public.alerts ADD COLUMN IF NOT EXISTS responded_by TEXT;
ALTER TABLE public.alerts ADD COLUMN IF NOT EXISTS response_notes TEXT;
ALTER TABLE public.alerts ADD COLUMN IF NOT EXISTS responded_at TIMESTAMPTZ;

-- Add check constraint for alert_type (drop first if exists)
DO $$ BEGIN
  ALTER TABLE public.alerts DROP CONSTRAINT IF EXISTS alerts_alert_type_check;
  ALTER TABLE public.alerts ADD CONSTRAINT alerts_alert_type_check
    CHECK (alert_type IN ('medical', 'emergency', 'security'));
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- ============================
-- 3. JIRANI NETWORK TABLE
-- Maps patients to their neighbors and assigned CHP
-- ============================
CREATE TABLE IF NOT EXISTS public.jirani_network (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  contact_name TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  contact_type TEXT NOT NULL CHECK (contact_type IN ('neighbor', 'chp', 'family')),
  priority INTEGER DEFAULT 1,
  location TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.jirani_network ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Jirani network readable by all" ON public.jirani_network FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Jirani network insertable by all" ON public.jirani_network FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Jirani network updatable by authenticated" ON public.jirani_network FOR UPDATE TO authenticated USING (true);

CREATE TRIGGER update_jirani_network_updated_at
  BEFORE UPDATE ON public.jirani_network
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================
-- 4. AFYA ID TOKENS TABLE
-- Temporary OTP-based doctor access
-- ============================
CREATE TABLE IF NOT EXISTS public.afya_id_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  pin_code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  is_revoked BOOLEAN DEFAULT false,
  used_by_doctor TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.afya_id_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Afya tokens readable by all" ON public.afya_id_tokens FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Afya tokens insertable by all" ON public.afya_id_tokens FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Afya tokens updatable by all" ON public.afya_id_tokens FOR UPDATE TO anon, authenticated USING (true);

-- ============================
-- 5. NOTIFICATION LOG TABLE
-- Tracks SMS, Voice calls, and other notifications
-- ============================
CREATE TABLE IF NOT EXISTS public.notification_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  alert_id UUID REFERENCES public.alerts(id) ON DELETE CASCADE,
  recipient_phone TEXT NOT NULL,
  recipient_name TEXT,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('sms', 'voice', 'ussd_push')),
  message_content TEXT,
  status TEXT DEFAULT 'sent' CHECK (status IN ('pending', 'sent', 'delivered', 'failed')),
  provider_response JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.notification_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Notification log readable by all" ON public.notification_log FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Notification log insertable by all" ON public.notification_log FOR INSERT TO anon, authenticated WITH CHECK (true);

-- ============================
-- 6. CLINICAL VITALS TABLE
-- Structured patient vitals recorded by CHPs
-- ============================
CREATE TABLE IF NOT EXISTS public.clinical_vitals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  bp_systolic INTEGER,
  bp_diastolic INTEGER,
  weight_kg DECIMAL(5,2),
  height_cm DECIMAL(5,1),
  pulse INTEGER,
  temperature DECIMAL(4,1),
  blood_sugar DECIMAL(5,2),
  oxygen_saturation INTEGER,
  recorded_by TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.clinical_vitals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clinical vitals readable by all" ON public.clinical_vitals FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Clinical vitals insertable by all" ON public.clinical_vitals FOR INSERT TO anon, authenticated WITH CHECK (true);

-- ============================
-- 7. ENABLE SUPABASE REALTIME ON ALERTS
-- This powers instant dashboard updates
-- ============================
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.alerts;
EXCEPTION WHEN duplicate_object THEN
  -- Table already in publication, ignore
  NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.notification_log;
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

-- ============================
-- 8. SEED: JIRANI NETWORK
-- ============================

-- Mary Akinyi's network (3 neighbors + 1 CHP)
INSERT INTO public.jirani_network (patient_id, contact_name, contact_phone, contact_type, priority, location)
SELECT p.id, 'Eunice Wambui', '+254700111001', 'neighbor', 1, 'Kibera, Nairobi'
FROM public.patients p WHERE p.upi = 'UPI-12345';

INSERT INTO public.jirani_network (patient_id, contact_name, contact_phone, contact_type, priority, location)
SELECT p.id, 'Peter Otieno', '+254700111002', 'neighbor', 2, 'Kibera, Nairobi'
FROM public.patients p WHERE p.upi = 'UPI-12345';

INSERT INTO public.jirani_network (patient_id, contact_name, contact_phone, contact_type, priority, location)
SELECT p.id, 'Agnes Mwangi', '+254700111003', 'neighbor', 3, 'Kibera, Nairobi'
FROM public.patients p WHERE p.upi = 'UPI-12345';

INSERT INTO public.jirani_network (patient_id, contact_name, contact_phone, contact_type, priority, location)
SELECT p.id, 'Joseph Ochieng', '+254723456789', 'chp', 1, 'Kibera, Nairobi'
FROM public.patients p WHERE p.upi = 'UPI-12345';

-- John Kamau's network
INSERT INTO public.jirani_network (patient_id, contact_name, contact_phone, contact_type, priority, location)
SELECT p.id, 'David Maina', '+254700222001', 'neighbor', 1, 'Mathare, Nairobi'
FROM public.patients p WHERE p.upi = 'UPI-67890';

INSERT INTO public.jirani_network (patient_id, contact_name, contact_phone, contact_type, priority, location)
SELECT p.id, 'Joseph Ochieng', '+254723456789', 'chp', 1, 'Mathare, Nairobi'
FROM public.patients p WHERE p.upi = 'UPI-67890';

-- Grace Njeri's network
INSERT INTO public.jirani_network (patient_id, contact_name, contact_phone, contact_type, priority, location)
SELECT p.id, 'Jane Wanjiru', '+254700333001', 'neighbor', 1, 'Dandora, Nairobi'
FROM public.patients p WHERE p.upi = 'UPI-11111';

INSERT INTO public.jirani_network (patient_id, contact_name, contact_phone, contact_type, priority, location)
SELECT p.id, 'Joseph Ochieng', '+254723456789', 'chp', 1, 'Dandora, Nairobi'
FROM public.patients p WHERE p.upi = 'UPI-11111';

-- Amina Wanjiku's network (demo app patient)
INSERT INTO public.jirani_network (patient_id, contact_name, contact_phone, contact_type, priority, location)
SELECT p.id, 'Mama Fatuma', '+254700444001', 'neighbor', 1, 'Kibera, Nairobi'
FROM public.patients p WHERE p.upi = 'UPI-99999';

INSERT INTO public.jirani_network (patient_id, contact_name, contact_phone, contact_type, priority, location)
SELECT p.id, 'Baba Onyango', '+254700444002', 'neighbor', 2, 'Kibera, Nairobi'
FROM public.patients p WHERE p.upi = 'UPI-99999';

INSERT INTO public.jirani_network (patient_id, contact_name, contact_phone, contact_type, priority, location)
SELECT p.id, 'Nyokabi Muthoni', '+254700444003', 'neighbor', 3, 'Kibera, Nairobi'
FROM public.patients p WHERE p.upi = 'UPI-99999';

INSERT INTO public.jirani_network (patient_id, contact_name, contact_phone, contact_type, priority, location)
SELECT p.id, 'Joseph Ochieng', '+254723456789', 'chp', 1, 'Kibera, Nairobi'
FROM public.patients p WHERE p.upi = 'UPI-99999';

-- ============================
-- 9. SEED: CLINICAL VITALS
-- ============================

-- Mary Akinyi - slightly elevated BP
INSERT INTO public.clinical_vitals (patient_id, bp_systolic, bp_diastolic, weight_kg, height_cm, pulse, temperature, blood_sugar, oxygen_saturation, recorded_by, notes)
SELECT p.id, 130, 85, 62.5, 165.0, 78, 37.2, 5.4, 97, 'CHP Joseph Ochieng', 'Routine checkup. BP slightly elevated. Advised diet changes.'
FROM public.patients p WHERE p.upi = 'UPI-12345';

-- John Kamau - hypertensive
INSERT INTO public.clinical_vitals (patient_id, bp_systolic, bp_diastolic, weight_kg, height_cm, pulse, temperature, blood_sugar, oxygen_saturation, recorded_by, notes)
SELECT p.id, 145, 92, 78.0, 172.0, 82, 37.0, 6.8, 96, 'CHP Joseph Ochieng', 'BP high. Referred for hypertension management. Follow-up in 2 weeks.'
FROM public.patients p WHERE p.upi = 'UPI-67890';

-- Grace Njeri - healthy
INSERT INTO public.clinical_vitals (patient_id, bp_systolic, bp_diastolic, weight_kg, height_cm, pulse, temperature, blood_sugar, oxygen_saturation, recorded_by, notes)
SELECT p.id, 118, 76, 55.0, 160.0, 72, 37.1, 5.1, 98, 'CHP Joseph Ochieng', 'Vitals normal. Advised to schedule annual screening.'
FROM public.patients p WHERE p.upi = 'UPI-11111';

-- Amina Wanjiku (app demo patient)
INSERT INTO public.clinical_vitals (patient_id, bp_systolic, bp_diastolic, weight_kg, height_cm, pulse, temperature, blood_sugar, oxygen_saturation, recorded_by, notes)
SELECT p.id, 122, 78, 58.0, 162.0, 74, 36.8, 5.2, 98, 'CHP Joseph Ochieng', 'All vitals normal. Patient in good health. Next visit in 3 months.'
FROM public.patients p WHERE p.upi = 'UPI-99999';

-- Add health records for Amina too
INSERT INTO public.health_records (patient_id, resource_type, code, value, sha256_hash, recorded_at)
SELECT p.id, 'Observation', 'Blood Pressure', '122/78 mmHg', 'aa11bb22cc33dd44ee55ff6677889900', '2026-03-18'
FROM public.patients p WHERE p.upi = 'UPI-99999';

INSERT INTO public.health_records (patient_id, resource_type, code, value, sha256_hash, recorded_at)
SELECT p.id, 'Observation', 'Weight', '58.0 kg', 'bb22cc33dd44ee55ff66778899001122', '2026-03-18'
FROM public.patients p WHERE p.upi = 'UPI-99999';

INSERT INTO public.health_records (patient_id, resource_type, code, value, sha256_hash, recorded_at)
SELECT p.id, 'Observation', 'Temperature', '36.8°C', 'cc33dd44ee55ff6677889900112233bb', '2026-03-18'
FROM public.patients p WHERE p.upi = 'UPI-99999';

INSERT INTO public.health_records (patient_id, resource_type, code, value, sha256_hash, recorded_at)
SELECT p.id, 'Immunization', 'COVID-19 Booster', 'Administered', 'dd44ee55ff66778899001122334455cc', '2026-02-15'
FROM public.patients p WHERE p.upi = 'UPI-99999';

-- ============================
-- 10. UPDATE EXISTING ALERTS WITH alert_type
-- ============================
UPDATE public.alerts SET alert_type = 'emergency' WHERE severity = 'critical';
UPDATE public.alerts SET alert_type = 'medical' WHERE alert_type IS NULL OR alert_type = 'medical';

-- Link existing alerts to patients by phone
UPDATE public.alerts a SET patient_id = p.id
FROM public.patients p WHERE a.phone = p.phone AND a.patient_id IS NULL;

-- ============================
-- DONE! Tables ready for USSD + App integration
-- ============================
