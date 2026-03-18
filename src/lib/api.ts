// API client for Dawa Mashinani backend (Edge Functions)
import { supabase } from '@/integrations/supabase/client';

async function invokeFunction(functionName: string, path: string, options?: { method?: string; body?: unknown }) {
  const { data, error } = await supabase.functions.invoke(functionName, {
    method: (options?.method as 'GET' | 'POST' | 'PATCH') || 'GET',
    headers: { 'x-path': path },
    body: options?.body ? options.body : undefined,
  });
  if (error) throw error;
  return data;
}

// We'll use direct supabase client for reads (simpler, works with anon key)
// and edge functions for writes/complex operations

export async function fetchPatients(search?: string) {
  let query = supabase.from('patients').select('*');
  if (search) {
    query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%,upi.ilike.%${search}%`);
  }
  const { data, error } = await query.order('last_visit', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function fetchPatientRecords(patientId: string) {
  const { data, error } = await supabase
    .from('health_records')
    .select('*')
    .eq('patient_id', patientId)
    .order('recorded_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function fetchAlerts(status?: string) {
  let query = supabase.from('alerts').select('*');
  if (status) query = query.eq('status', status);
  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function acknowledgeAlertAPI(alertId: string) {
  const { data, error } = await supabase
    .from('alerts')
    .update({ status: 'acknowledged' })
    .eq('id', alertId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function createAlert(alert: {
  patient_name: string;
  phone: string;
  symptom: string;
  severity: string;
  location: string;
  source?: string;
}) {
  const { data, error } = await supabase.from('alerts').insert(alert).select().single();
  if (error) throw error;
  return data;
}

export async function fetchStats() {
  const [patients, alerts, sessions, criticalAlerts, pendingAlerts] = await Promise.all([
    supabase.from('patients').select('id', { count: 'exact', head: true }),
    supabase.from('alerts').select('id', { count: 'exact', head: true }),
    supabase.from('ussd_sessions').select('id', { count: 'exact', head: true }),
    supabase.from('alerts').select('id', { count: 'exact', head: true }).eq('severity', 'critical'),
    supabase.from('alerts').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
  ]);
  return {
    patients: patients.count || 0,
    total_alerts: alerts.count || 0,
    ussd_sessions: sessions.count || 0,
    critical_alerts: criticalAlerts.count || 0,
    pending_alerts: pendingAlerts.count || 0,
  };
}

export async function fetchUSSDSessions() {
  const { data, error } = await supabase
    .from('ussd_sessions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20);
  if (error) throw error;
  return data || [];
}
