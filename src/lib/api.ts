// API client for Dawa Mashinani backend (Edge Functions)
import { supabase } from '@/integrations/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

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

export async function respondToAlert(
  alertId: string,
  status: 'acknowledged' | 'resolved',
  respondedBy: string,
  responseNotes?: string
) {
  const { data, error } = await supabase
    .from('alerts')
    .update({
      status,
      responded_by: respondedBy,
      response_notes: responseNotes || null,
      responded_at: new Date().toISOString(),
    })
    .eq('id', alertId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function fetchAlertNotifications(alertId: string) {
  const { data, error } = await supabase
    .from('notification_log')
    .select('*')
    .eq('alert_id', alertId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function createAlert(alert: {
  patient_name: string;
  phone: string;
  symptom: string;
  severity: string;
  location: string;
  source?: string;
  alert_type?: string;
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

// ============================================
// GEMINI AI — Rafiki Health Advice (App)
// ============================================
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

interface RafikiAIResponse {
  reply: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
}

export async function askRafikiAI(
  userMessage: string,
  conversationHistory: { from: string; text: string }[]
): Promise<RafikiAIResponse> {
  if (!GEMINI_API_KEY) {
    console.warn('[RAFIKI] No VITE_GEMINI_API_KEY — using fallback');
    return { reply: getFallbackResponse(userMessage), severity: 'low' };
  }

  // Build conversation context (last 10 messages max for better context)
  const recent = conversationHistory.slice(-10).map(m =>
    m.from === 'user' ? `Patient: ${m.text}` : `Rafiki: ${m.text}`
  ).join('\n');

  const prompt = `You are Rafiki, a warm and knowledgeable AI health assistant for Dawa Mashinani, a rural Kenya health platform.

${recent ? `Conversation context:\n${recent}\n` : ''}Patient: ${userMessage}

IMPORTANT: Respond naturally to what the patient said. If they're not describing health symptoms, acknowledge their concern and gently guide them back to health topics.

Your response MUST:
1. Be empathetic, warm, and conversational
2. Address EXACTLY what the patient said (don't repeat generic text)
3. Be 2-4 sentences max (keep it natural for mobile chat)
4. If health symptoms are mentioned, assess severity and recommend next steps
5. Never diagnose — only advise, assess, and triage
6. Always be helpful even for non-health topics
7. End with SEVERITY tag on new line: SEVERITY:critical OR SEVERITY:high OR SEVERITY:medium OR SEVERITY:low

Respond in English. Do NOT include "Rafiki:" prefix. Be genuinely helpful and responsive.`;

  try {
    const resp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { 
            maxOutputTokens: 250,
            temperature: 0.7,  // Increased from 0.4 for more natural responses
            topP: 0.95,
            topK: 40,
          },
        }),
      }
    );

    if (!resp.ok) {
      const errData = await resp.text();
      console.error('[RAFIKI] Gemini API error:', resp.status, errData);
      return { reply: getFallbackResponse(userMessage), severity: 'low' };
    }

    const data = await resp.json();
    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    console.log('[RAFIKI] Gemini response:', raw);

    if (!raw) {
      console.warn('[RAFIKI] Empty Gemini response, using fallback');
      return { reply: getFallbackResponse(userMessage), severity: 'low' };
    }

    // Extract severity
    let severity: RafikiAIResponse['severity'] = 'low';
    const sevMatch = raw.match(/SEVERITY:(critical|high|medium|low)/i);
    if (sevMatch) severity = sevMatch[1].toLowerCase() as RafikiAIResponse['severity'];

    // Clean the reply
    let reply = raw.replace(/\n?SEVERITY:\w+/gi, '').trim();
    if (!reply) {
      console.warn('[RAFIKI] Reply empty after cleaning, using fallback');
      reply = getFallbackResponse(userMessage);
    }

    console.log(`[RAFIKI] Replying with severity: ${severity}`);
    return { reply, severity };
  } catch (err) {
    console.error('[RAFIKI] Gemini fetch error:', err);
    return { reply: getFallbackResponse(userMessage), severity: 'low' };
  }
}

function getFallbackResponse(input: string): string {
  const lower = input.toLowerCase();
  
  // Emotional/personal concerns
  if (lower.includes('sad') || lower.includes('upset') || lower.includes('dad') || lower.includes('mom') || lower.includes('family')) {
    return 'I\'m sorry to hear that. It\'s important to take care of your emotional health too. If your family member needs medical help, I can assist with health advice or connecting you to a healthcare provider. What specific health concerns do you have?';
  }
  
  // Specific symptom responses
  if (lower.includes('fever')) return 'Stay hydrated and monitor your temperature. If it exceeds 38.5°C or persists over 2 days, please visit your nearest health facility. Would you like me to alert your CHP?';
  if (lower.includes('headache')) return 'For persistent headaches, rest in a quiet dark room and stay hydrated. If headaches last more than 48 hours or come with vision changes, please visit a clinic.';
  if (lower.includes('cough')) return 'A persistent cough may indicate a respiratory infection. Monitor for difficulty breathing or chest pain. If symptoms worsen, I can help connect you to a Community Health Promoter.';
  if (lower.includes('malaria')) return 'Malaria symptoms include fever, chills, and sweating. Please get tested at a clinic as soon as possible. Take paracetamol for fever and stay hydrated.';
  if (lower.includes('pregnan')) return 'Prenatal care is important! Please ensure regular check-ups with your healthcare provider. If you experience any unusual symptoms, visit a facility immediately.';
  if (lower.includes('stomach') || lower.includes('diarr')) return 'Stay hydrated with clean water and ORS if available. Avoid heavy foods. If symptoms persist beyond 24 hours or you see blood, seek medical help immediately.';
  if (lower.includes('pain')) return 'Pain can be caused by many things. Can you tell me more about where the pain is, when it started, and how severe it is? This will help me better assist you.';
  if (lower.includes('covid') || lower.includes('corona')) return 'If you have respiratory symptoms or fever, please get tested at a clinic. Stay isolated if you suspect COVID-19. Practice hand hygiene and wear a mask around others.';
  
  // Greetings
  if (lower.includes('hi') || lower.includes('hello') || lower.includes('hey')) {
    return 'Hello! I\'m Rafiki, your health assistant. I\'m here to help with any health concerns or questions. What can I assist you with today?';
  }
  
  // Default - be empathetic but ask for clarity
  return 'I hear you. While I want to help, I\'m here specifically for health advice and symptom assessment. Could you tell me more about any health concerns or symptoms you or your family member are experiencing? I\'m here to help.';
}

// ============================================
// REALTIME SUBSCRIPTION — Alerts
// ============================================
export function subscribeToAlerts(
  onInsert: (alert: Record<string, unknown>) => void,
  onUpdate?: (alert: Record<string, unknown>) => void
): RealtimeChannel {
  const channel = supabase
    .channel('alerts-realtime')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'alerts' },
      (payload) => {
        console.log('[REALTIME] New alert:', payload.new);
        onInsert(payload.new as Record<string, unknown>);
      }
    );

  if (onUpdate) {
    channel.on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'alerts' },
      (payload) => {
        console.log('[REALTIME] Alert updated:', payload.new);
        onUpdate(payload.new as Record<string, unknown>);
      }
    );
  }

  channel.subscribe();
  return channel;
}
