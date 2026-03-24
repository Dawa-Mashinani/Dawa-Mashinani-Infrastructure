-- ============================================================
-- No-login app bootstrap data for Dawa Mashinani demo
-- Ensures direct-entry app always has core pillar data.
-- ============================================================

-- 1) Ensure demo patient exists (used by no-login experience)
INSERT INTO public.patients (
  upi,
  name,
  phone,
  age,
  gender,
  location,
  last_visit,
  sha_no,
  ward,
  nid,
  language_pref
)
VALUES (
  'UPI-99999',
  'Amina Wanjiku',
  '+254712345678',
  35,
  'Female',
  'Kibera, Nairobi',
  CURRENT_DATE,
  'SHA-2026-0004',
  'Kibera',
  '98765432',
  'en'
)
ON CONFLICT (phone) DO UPDATE
SET
  name = EXCLUDED.name,
  location = EXCLUDED.location,
  ward = EXCLUDED.ward,
  language_pref = EXCLUDED.language_pref,
  updated_at = now();

-- 2) Seed basic health records for Jirani ledger (idempotent)
INSERT INTO public.health_records (patient_id, resource_type, code, value, sha256_hash, recorded_at)
SELECT p.id, 'Observation', 'Blood Pressure', '122/78 mmHg', md5('UPI-99999-BP-122-78'), now()
FROM public.patients p
WHERE p.phone = '+254712345678'
  AND NOT EXISTS (
    SELECT 1
    FROM public.health_records hr
    WHERE hr.patient_id = p.id
      AND hr.code = 'Blood Pressure'
      AND hr.value = '122/78 mmHg'
  );

INSERT INTO public.health_records (patient_id, resource_type, code, value, sha256_hash, recorded_at)
SELECT p.id, 'Observation', 'Temperature', '36.8°C', md5('UPI-99999-TEMP-36.8'), now()
FROM public.patients p
WHERE p.phone = '+254712345678'
  AND NOT EXISTS (
    SELECT 1
    FROM public.health_records hr
    WHERE hr.patient_id = p.id
      AND hr.code = 'Temperature'
      AND hr.value = '36.8°C'
  );

-- 3) Seed vital baseline for Mlinzi (idempotent)
INSERT INTO public.clinical_vitals (
  patient_id,
  pulse,
  temperature,
  bp_systolic,
  bp_diastolic,
  oxygen_saturation,
  recorded_by,
  notes
)
SELECT
  p.id,
  74,
  36.8,
  122,
  78,
  98,
  'Dawa Demo Bootstrap',
  'Initial baseline vitals for no-login demo app'
FROM public.patients p
WHERE p.phone = '+254712345678'
  AND NOT EXISTS (
    SELECT 1
    FROM public.clinical_vitals cv
    WHERE cv.patient_id = p.id
      AND cv.recorded_by = 'Dawa Demo Bootstrap'
  );

-- 4) Seed one welcome notification for Messages tab (idempotent)
INSERT INTO public.notification_log (
  recipient_phone,
  recipient_name,
  notification_type,
  message_content,
  status
)
SELECT
  '+254712345678',
  'Amina Wanjiku',
  'sms',
  'Karibu Dawa Mashinani! Open Rafiki AI, Jirani Ledger, and Mlinzi Vitals directly from Home.',
  'sent'
WHERE NOT EXISTS (
  SELECT 1
  FROM public.notification_log nl
  WHERE nl.recipient_phone = '+254712345678'
    AND nl.message_content LIKE 'Karibu Dawa Mashinani!%'
);
