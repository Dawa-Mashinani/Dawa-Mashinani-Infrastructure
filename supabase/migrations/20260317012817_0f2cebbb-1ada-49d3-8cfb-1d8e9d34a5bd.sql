
-- Timestamp update function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Patients table (maps to National Client Registry)
CREATE TABLE public.patients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  upi TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT UNIQUE NOT NULL,
  age INTEGER,
  gender TEXT,
  location TEXT,
  last_visit TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Patients are readable by all authenticated" ON public.patients FOR SELECT TO authenticated USING (true);
CREATE POLICY "Patients are insertable by all authenticated" ON public.patients FOR INSERT TO authenticated WITH CHECK (true);
CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON public.patients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Health records table (FHIR-lite)
CREATE TABLE public.health_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  resource_type TEXT NOT NULL,
  code TEXT NOT NULL,
  value TEXT NOT NULL,
  sha256_hash TEXT NOT NULL,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.health_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Health records readable by authenticated" ON public.health_records FOR SELECT TO authenticated USING (true);
CREATE POLICY "Health records insertable by authenticated" ON public.health_records FOR INSERT TO authenticated WITH CHECK (true);

-- Alerts table (Mlinzi)
CREATE TABLE public.alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  symptom TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low')),
  location TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'acknowledged', 'resolved')),
  source TEXT NOT NULL DEFAULT 'app' CHECK (source IN ('ussd', 'app')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Alerts readable by all" ON public.alerts FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Alerts insertable by all" ON public.alerts FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Alerts updatable by authenticated" ON public.alerts FOR UPDATE TO authenticated USING (true);
CREATE TRIGGER update_alerts_updated_at BEFORE UPDATE ON public.alerts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- USSD sessions table
CREATE TABLE public.ussd_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT UNIQUE NOT NULL,
  phone_number TEXT NOT NULL,
  service_code TEXT,
  current_menu TEXT NOT NULL DEFAULT 'main',
  conversation_log JSONB DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'timeout')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.ussd_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "USSD sessions insertable by anon" ON public.ussd_sessions FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "USSD sessions readable by authenticated" ON public.ussd_sessions FOR SELECT TO authenticated USING (true);
CREATE POLICY "USSD sessions updatable by anon" ON public.ussd_sessions FOR UPDATE TO anon, authenticated USING (true);
CREATE TRIGGER update_ussd_sessions_updated_at BEFORE UPDATE ON public.ussd_sessions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed demo patients
INSERT INTO public.patients (upi, name, phone, age, gender, location, last_visit) VALUES
  ('UPI-12345', 'Mary Akinyi', '+254711223344', 28, 'Female', 'Kibera, Nairobi', '2026-03-15'),
  ('UPI-67890', 'John Kamau', '+254722334455', 45, 'Male', 'Mathare, Nairobi', '2026-03-14'),
  ('UPI-11111', 'Grace Njeri', '+254733445566', 32, 'Female', 'Dandora, Nairobi', '2026-03-10');

-- Seed health records
INSERT INTO public.health_records (patient_id, resource_type, code, value, sha256_hash, recorded_at)
SELECT p.id, 'Observation', 'Blood Pressure', '130/85 mmHg', 'a3f2b1c4d5e6f7a8b9c0d1e2f3a4b5c6', '2026-03-15' FROM public.patients p WHERE p.upi = 'UPI-12345';
INSERT INTO public.health_records (patient_id, resource_type, code, value, sha256_hash, recorded_at)
SELECT p.id, 'Observation', 'Temperature', '37.2°C', 'c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2', '2026-03-10' FROM public.patients p WHERE p.upi = 'UPI-12345';
INSERT INTO public.health_records (patient_id, resource_type, code, value, sha256_hash, recorded_at)
SELECT p.id, 'Immunization', 'Tetanus Booster', 'Administered', 'f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6', '2026-02-28' FROM public.patients p WHERE p.upi = 'UPI-12345';
INSERT INTO public.health_records (patient_id, resource_type, code, value, sha256_hash, recorded_at)
SELECT p.id, 'Observation', 'Blood Sugar', '6.8 mmol/L', 'b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9', '2026-03-14' FROM public.patients p WHERE p.upi = 'UPI-67890';
INSERT INTO public.health_records (patient_id, resource_type, code, value, sha256_hash, recorded_at)
SELECT p.id, 'Encounter', 'General Checkup', 'Normal', 'e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2', '2026-03-01' FROM public.patients p WHERE p.upi = 'UPI-67890';

-- Seed alerts
INSERT INTO public.alerts (patient_name, phone, symptom, severity, location, status, source) VALUES
  ('Mary Akinyi', '+254711223344', 'Severe bleeding', 'critical', 'Kibera, Nairobi', 'pending', 'ussd'),
  ('John Kamau', '+254722334455', 'High fever (39.5°C) for 3 days', 'high', 'Mathare, Nairobi', 'acknowledged', 'app'),
  ('Grace Njeri', '+254733445566', 'Persistent cough, difficulty breathing', 'medium', 'Dandora, Nairobi', 'pending', 'ussd');
