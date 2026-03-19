import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ============================================================
// TYPES
// ============================================================
type Lang = "en" | "sw";
interface Patient {
  id: string;
  name: string;
  phone: string;
  upi: string;
  location: string;
  ward: string;
  sha_no: string;
}

// ============================================================
// I18N — Bilingual messages (English / Kiswahili)
// ============================================================
const i18n: Record<Lang, Record<string, string | ((...args: string[]) => string)>> = {
  en: {
    welcome:
      "Welcome to Dawa Mashinani.\nSelect Language:\n1. English\n2. Kiswahili",
    mainMenu:
      "Dawa Mashinani ({phone})\n1. EMERGENCY (Jirani)\n2. Ask Rafiki (Health Advice)\n3. Health Alerts & Mlinzi\n4. Unlock Afya ID for Doctor\n5. Request Voice Call",
    notRegistered:
      "Phone not registered.\nPlease visit your nearest CHP to register your Afya ID.\n\nContact: Joseph Ochieng (CHP)\n+254723456789",
    emergencyMenu:
      "Trigger Jirani Alert:\n1. Medical Emergency (Send to CHPs/Neighbors)\n2. Security Threat\n0. Cancel",
    emergencySent:
      "JIRANI ALERT ACTIVATED!\n\nAlert sent to {neighbors} neighbors and your CHP {chp}.\nHelp is on the way.\n\nStay calm. Keep your phone on.\n- Dawa Mashinani",
    securitySent:
      "SECURITY ALERT sent to your community network.\nStay safe and move to a secure location.\n\n- Dawa Mashinani",
    emergencyCancelled:
      "Emergency cancelled.\nDial *433# if you need help.\n- Dawa Mashinani",
    rafikiPrompt:
      "Describe your symptom briefly:\n(e.g., 'Headache' or 'Stomach pain')\n\nOr select:\n1. Fever\n2. Headache\n3. Cough\n4. Stomach pain\n5. Malaria symptoms\n6. Pregnancy concern\n7. Diarrhea\n8. Other - Speak to CHP",
    rafikiFollowUp:
      "\nAre you also experiencing:\n1. Nausea/Vomiting\n2. Dizziness/Weakness\n3. Neither\n0. Speak to a human CHP",
    chpAlerted:
      "Your nearest CHP has been alerted and will contact you shortly.\nStay safe.\n- Dawa Mashinani",
    mlinziMenu:
      "Mlinzi Insights for You:\n! ALERT: {areaAlert}\n\n1. My Health Insights (sent via SMS)\n00. Home",
    healthSmsSent:
      "Your health summary has been sent to your phone via SMS.\nCheck your messages.\n- Dawa Mashinani",
    afyaIdMenu:
      "Grant Doctor Access:\nYour One-Time PIN is: {pin}\n\nGive this PIN to your doctor to unlock your Afya ID for 30 minutes.\n\n1. Revoke Access Now\n00. Home",
    afyaRevoked:
      "Your Afya ID access has been revoked.\nNo one can access your records.\n- Dawa Mashinani",
    voiceCall:
      "You have requested a voice session.\nPlease hang up. Rafiki will call you in 10 seconds.\n\n- Dawa Mashinani",
    invalidOption: "Invalid option. Dial *433# to start over.",
    error: "An error occurred. Dial *433# to try again.",
    noHealthData:
      "No health data found.\nVisit your nearest CHP for a checkup.\n- Dawa Mashinani",
    rafikiAdviceEnd:
      "Thank you. If symptoms persist for more than 48 hours, visit your nearest health facility.\n- Dawa Mashinani",
  },
  sw: {
    welcome:
      "Karibu Dawa Mashinani.\nChagua Lugha:\n1. English\n2. Kiswahili",
    mainMenu:
      "Dawa Mashinani ({phone})\n1. DHARURA (Jirani)\n2. Uliza Rafiki (Ushauri wa Afya)\n3. Arifa za Afya & Mlinzi\n4. Fungua Afya ID kwa Daktari\n5. Omba Simu ya Sauti",
    notRegistered:
      "Simu haijasajiliwa.\nTafadhali tembelea CHP wako kusajili Afya ID.\n\nWasiliana: Joseph Ochieng (CHP)\n+254723456789",
    emergencyMenu:
      "Tuma Arifa ya Jirani:\n1. Dharura ya Kimatibabu (Kwa CHP/Majirani)\n2. Tishio la Usalama\n0. Ghairi",
    emergencySent:
      "ARIFA YA JIRANI IMEWASHWA!\n\nArifa imetumwa kwa majirani {neighbors} na CHP wako {chp}.\nMsaada unakuja.\n\nTulia. Weka simu yako wazi.\n- Dawa Mashinani",
    securitySent:
      "ARIFA YA USALAMA imetumwa kwa mtandao wa jamii.\nKaa salama.\n\n- Dawa Mashinani",
    emergencyCancelled:
      "Dharura imesitishwa.\nPiga *433# ukihitaji msaada.\n- Dawa Mashinani",
    rafikiPrompt:
      "Eleza dalili yako kwa ufupi:\n(mfano, 'Kuumwa kichwa' au 'Maumivu ya tumbo')\n\nAu chagua:\n1. Homa\n2. Kuumwa kichwa\n3. Kikohozi\n4. Maumivu ya tumbo\n5. Dalili za malaria\n6. Wasiwasi wa mimba\n7. Kuharisha\n8. Nyingine - Ongea na CHP",
    rafikiFollowUp:
      "\nJe, pia unapata:\n1. Kutapika/Kichefuchefu\n2. Kizunguzungu/Udhaifu\n3. Hakuna\n0. Ongea na CHP",
    chpAlerted:
      "CHP wako amearifiwa na atawasiliana nawe.\nKaa salama.\n- Dawa Mashinani",
    mlinziMenu:
      "Maarifa ya Mlinzi Kwako:\n! TAHADHARI: {areaAlert}\n\n1. Maarifa Yangu ya Afya (SMS)\n00. Nyumbani",
    healthSmsSent:
      "Muhtasari wako umetumwa kwa SMS.\nAngalia ujumbe wako.\n- Dawa Mashinani",
    afyaIdMenu:
      "Toa Ufikiaji wa Daktari:\nPIN yako: {pin}\n\nMpe daktari wako PIN hii kufungua Afya ID yako kwa dakika 30.\n\n1. Sitisha Ufikiaji\n00. Nyumbani",
    afyaRevoked:
      "Ufikiaji wa Afya ID umesitishwa.\nHakuna anayeweza kupata rekodi zako.\n- Dawa Mashinani",
    voiceCall:
      "Umeomba kikao cha sauti.\nKata simu. Rafiki atakupigia baada ya sekunde 10.\n\n- Dawa Mashinani",
    invalidOption: "Chaguo batili. Piga *433# kuanza upya.",
    error: "Hitilafu imetokea. Piga *433# tena.",
    noHealthData:
      "Hakuna data ya afya.\nTembelea CHP wako.\n- Dawa Mashinani",
    rafikiAdviceEnd:
      "Asante. Dalili zikiendelea zaidi ya saa 48, tembelea kituo cha afya.\n- Dawa Mashinani",
  },
};

// Area health alerts per ward (simulated Mlinzi intelligence)
const AREA_ALERTS: Record<string, Record<Lang, string>> = {
  Kibera: {
    en: "High Malaria cases reported in Kibera this week. Use treated nets.",
    sw: "Visa vingi vya malaria vimeripotiwa Kibera wiki hii. Tumia neti.",
  },
  Mathare: {
    en: "Cholera outbreak warning in Mathare. Boil drinking water.",
    sw: "Onyo la mlipuko wa kipindupindu Mathare. Chemsha maji.",
  },
  Dandora: {
    en: "Respiratory infections rising in Dandora. Wear masks in crowded areas.",
    sw: "Maambukizi ya kupumua yanaongezeka Dandora. Vaa barakoa.",
  },
  default: {
    en: "Stay hydrated. Wash hands regularly.",
    sw: "Kunywa maji. Osha mikono mara kwa mara.",
  },
};

// ============================================================
// SYMPTOM KNOWLEDGE BASE (Rafiki AI)
// ============================================================
interface SymptomInfo {
  en: string;
  sw: string;
  severity: "critical" | "high" | "medium" | "low";
}

const SYMPTOM_KB: Record<string, SymptomInfo> = {
  fever: {
    en: "Rafiki: Fever detected.\nAdvice: Stay hydrated. Monitor temperature.\nIf >38.5C for >2 days, visit a clinic immediately.",
    sw: "Rafiki: Homa imegunduliwa.\nUshauri: Kunywa maji. Fuatilia joto.\nIkiwa >38.5C siku 2+, tembelea kliniki.",
    severity: "high",
  },
  headache: {
    en: "Rafiki: Headache reported.\nAdvice: Rest in a dark, quiet room. Stay hydrated.\nIf pain persists over 48hrs, seek medical help.",
    sw: "Rafiki: Maumivu ya kichwa.\nUshauri: Pumzika mahali pa giza na utulivu.\nIkiendelea saa 48, tafuta msaada.",
    severity: "medium",
  },
  cough: {
    en: "Rafiki: Persistent cough.\nAdvice: Stay warm, drink warm fluids.\nMonitor for difficulty breathing or chest pain.",
    sw: "Rafiki: Kikohozi kinachoendelea.\nUshauri: Kaa mahali pa joto.\nFuatilia ugumu wa kupumua au maumivu ya kifua.",
    severity: "medium",
  },
  stomach: {
    en: "Rafiki: Stomach pain & possible fever.\nAdvice: Avoid heavy meals. Drink ORS.\nIf severe or persisting, seek medical help.",
    sw: "Rafiki: Maumivu ya tumbo.\nUshauri: Epuka vyakula vizito. Kunywa ORS.\nIkiwa makali, tafuta msaada.",
    severity: "medium",
  },
  malaria: {
    en: "Rafiki: Malaria symptoms detected.\nAdvice: Get tested IMMEDIATELY at nearest facility.\nUse treated mosquito nets. Stay hydrated.",
    sw: "Rafiki: Dalili za malaria.\nUshauri: Pima MARA MOJA kwenye kituo kilicho karibu.\nTumia neti za mbu. Kunywa maji.",
    severity: "high",
  },
  pregnancy: {
    en: "Rafiki: Pregnancy concern.\nAdvice: Regular antenatal visits are essential.\nReport any bleeding, severe headaches, or swelling.",
    sw: "Rafiki: Wasiwasi wa mimba.\nUshauri: Ziara za kliniki ya wajawazito ni muhimu.\nRipoti kutoka damu, maumivu, au uvimbe.",
    severity: "high",
  },
  diarrhea: {
    en: "Rafiki: Diarrhea reported.\nAdvice: Stay hydrated with ORS.\nIf persists >48hrs or contains blood, seek help.",
    sw: "Rafiki: Kuharisha.\nUshauri: Kunywa ORS.\nIkiendelea saa 48+ au ina damu, tafuta msaada.",
    severity: "medium",
  },
  bleeding: {
    en: "Rafiki: CRITICAL - Bleeding reported.\nApply pressure to wound. Stay calm.\nEmergency services being contacted NOW.",
    sw: "Rafiki: HATARI - Kutoka damu.\nBana jeraha. Tulia.\nHuduma za dharura zinawasilianwa SASA.",
    severity: "critical",
  },
};

// Keyword → symptom mapping (supports EN + SW input)
function detectSymptom(input: string): string {
  const lower = input.toLowerCase();
  const map: Record<string, string[]> = {
    fever: ["fever", "hot", "temperature", "homa", "joto", "1"],
    headache: ["headache", "head", "kichwa", "migraine", "2"],
    cough: ["cough", "cold", "flu", "kikohozi", "mafua", "3"],
    stomach: ["stomach", "tumbo", "belly", "abdominal", "nausea", "pain", "4"],
    malaria: ["malaria", "chills", "sweating", "baridi", "5"],
    pregnancy: ["pregnant", "pregnancy", "mimba", "antenatal", "6"],
    diarrhea: ["diarrhea", "diarrhoea", "kuharisha", "loose", "7"],
    bleeding: ["bleeding", "blood", "damu", "kutoka"],
  };
  for (const [symptom, keywords] of Object.entries(map)) {
    if (keywords.some((k) => lower.includes(k))) return symptom;
  }
  return "fever"; // Default fallback
}

// ============================================================
// UTILITY FUNCTIONS
// ============================================================
function maskPhone(phone: string): string {
  if (phone.length < 6) return phone;
  return phone.substring(0, 4) + "***" + phone.substring(phone.length - 2);
}

function generatePIN(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

function msg(lang: Lang, key: string): string {
  return (i18n[lang]?.[key] as string) || (i18n.en[key] as string) || "";
}

// ============================================================
// AUTO-REGISTER: Any phone becomes a patient instantly
// ============================================================
async function getOrCreatePatient(
  supabase: ReturnType<typeof createClient>,
  phoneNumber: string,
  lang: Lang
): Promise<Patient> {
  // Debug: log env vars availability
  console.log(`[DB-DEBUG] SUPABASE_URL set: ${!!Deno.env.get("SUPABASE_URL")}`);
  console.log(`[DB-DEBUG] SERVICE_ROLE_KEY set: ${!!Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`);
  console.log(`[DB-DEBUG] SERVICE_ROLE_KEY length: ${(Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "").length}`);

  // Try to find existing patient
  const { data: existing, error: selectErr } = await supabase
    .from("patients")
    .select("id, name, phone, upi, location, ward, sha_no")
    .eq("phone", phoneNumber)
    .single();

  console.log(`[DB-DEBUG] Patient SELECT: data=${JSON.stringify(existing)}, error=${JSON.stringify(selectErr)}`);

  if (existing) {
    // ── FIX: Ensure existing patients have jirani_network ──
    const { count } = await supabase
      .from("jirani_network")
      .select("id", { count: "exact", head: true })
      .eq("patient_id", existing.id);
    console.log(`[DB-DEBUG] Existing patient ${existing.id} jirani count: ${count}`);
    if (count === null || count === 0) {
      console.log(`[AUTO-FIX] Seeding jirani_network for existing patient ${existing.id}`);
      const { error: seedErr } = await supabase.from("jirani_network").insert([
        { patient_id: existing.id, contact_name: "Joseph Ochieng", contact_phone: "+254723456789", contact_type: "chp", priority: 1, location: existing.location || "Nairobi" },
        { patient_id: existing.id, contact_name: "Mama Fatuma", contact_phone: "+254700444001", contact_type: "neighbor", priority: 2, location: existing.location || "Nairobi" },
        { patient_id: existing.id, contact_name: "Baba Onyango", contact_phone: "+254700444002", contact_type: "neighbor", priority: 3, location: existing.location || "Nairobi" },
        { patient_id: existing.id, contact_name: "Nyokabi Muthoni", contact_phone: "+254700444003", contact_type: "neighbor", priority: 4, location: existing.location || "Nairobi" },
      ]);
      if (seedErr) console.error(`[DB-ERROR] Jirani seed for existing patient: ${JSON.stringify(seedErr)}`);
      else console.log(`[AUTO-FIX] Jirani network seeded successfully for ${existing.id}`);
    }
    return existing as Patient;
  }

  // Auto-register: create a new patient on the fly
  const shortPhone = phoneNumber.replace(/\+254/, "0").slice(-6);
  const upi = `UPI-AUTO-${shortPhone}`;
  const defaultName = lang === "sw" ? `Mtumiaji ${shortPhone}` : `User ${shortPhone}`;

  const { data: created, error: insertErr } = await supabase
    .from("patients")
    .insert({
      upi,
      name: defaultName,
      phone: phoneNumber,
      age: null,
      gender: null,
      location: "Nairobi",
      language_pref: lang,
      ward: "Kibera",
      sha_no: `SHA-AUTO-${shortPhone}`,
      nid: null,
    })
    .select("id, name, phone, upi, location, ward, sha_no")
    .single();

  console.log(`[DB-DEBUG] Patient INSERT: data=${JSON.stringify(created)}, error=${JSON.stringify(insertErr)}`);

  if (!created) {
    console.error(`[DB-ERROR] Patient insert FAILED for ${phoneNumber}: ${JSON.stringify(insertErr)}`);
    // Fallback — return a minimal object so USSD doesn't crash
    return {
      id: "00000000-0000-0000-0000-000000000000",
      name: defaultName,
      phone: phoneNumber,
      upi,
      location: "Nairobi",
      ward: "Kibera",
      sha_no: `SHA-AUTO-${shortPhone}`,
    };
  }

  // Seed a default Jirani network for the new patient
  // CHP + 3 demo neighbors so emergency shows realistic counts
  const { error: jiErr } = await supabase.from("jirani_network").insert([
    {
      patient_id: created.id,
      contact_name: "Joseph Ochieng",
      contact_phone: "+254723456789",
      contact_type: "chp",
      priority: 1,
      location: "Nairobi",
    },
    {
      patient_id: created.id,
      contact_name: "Mama Fatuma",
      contact_phone: "+254700444001",
      contact_type: "neighbor",
      priority: 2,
      location: "Nairobi",
    },
    {
      patient_id: created.id,
      contact_name: "Baba Onyango",
      contact_phone: "+254700444002",
      contact_type: "neighbor",
      priority: 3,
      location: "Nairobi",
    },
    {
      patient_id: created.id,
      contact_name: "Nyokabi Muthoni",
      contact_phone: "+254700444003",
      contact_type: "neighbor",
      priority: 4,
      location: "Nairobi",
    },
  ]);
  if (jiErr) console.error(`[DB-ERROR] Jirani insert failed: ${JSON.stringify(jiErr)}`);

  console.log(`[AUTO-REG] New patient created: ${upi} (${phoneNumber})`);
  return created as Patient;
}

// ============================================================
// AFRICA'S TALKING API INTEGRATION
// ============================================================
function atBaseUrl(): string {
  const username = Deno.env.get("AT_USERNAME") || "sandbox";
  return username === "sandbox"
    ? "https://api.sandbox.africastalking.com"
    : "https://api.africastalking.com";
}

function atVoiceUrl(): string {
  const username = Deno.env.get("AT_USERNAME") || "sandbox";
  return username === "sandbox"
    ? "https://voice.sandbox.africastalking.com"
    : "https://voice.africastalking.com";
}

async function sendSMS(
  to: string,
  message: string,
  supabase: ReturnType<typeof createClient>,
  alertId?: string
): Promise<{ success: boolean; response?: Record<string, unknown> }> {
  const apiKey = Deno.env.get("AT_API_KEY");
  const username = Deno.env.get("AT_USERNAME");

  // If AT credentials not set, simulate for demo
  if (!apiKey || !username) {
    console.log(`[SMS DEMO] Would send to ${to}: ${message.substring(0, 80)}...`);
    // Still log the notification for dashboard visibility
    if (alertId) {
      await supabase.from("notification_log").insert({
        alert_id: alertId,
        recipient_phone: to,
        notification_type: "sms",
        message_content: message,
        status: "sent",
        provider_response: { demo: true, note: "AT credentials not configured" },
      });
    }
    return { success: true, response: { demo: true } };
  }

  try {
    const resp = await fetch(`${atBaseUrl()}/version1/messaging`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
        apiKey,
      },
      body: new URLSearchParams({ username, to, message }),
    });
    const result = await resp.json();
    console.log(`[SMS] Sent to ${to}: ${JSON.stringify(result).substring(0, 100)}`);

    // Log notification
    if (alertId) {
      await supabase.from("notification_log").insert({
        alert_id: alertId,
        recipient_phone: to,
        notification_type: "sms",
        message_content: message,
        status: "sent",
        provider_response: result,
      });
    }
    return { success: true, response: result };
  } catch (error) {
    console.error(`[SMS ERROR] ${to}:`, error);
    if (alertId) {
      await supabase.from("notification_log").insert({
        alert_id: alertId,
        recipient_phone: to,
        notification_type: "sms",
        message_content: message,
        status: "failed",
        provider_response: { error: String(error) },
      });
    }
    return { success: false };
  }
}

async function makeVoiceCall(
  to: string,
  supabase: ReturnType<typeof createClient>,
  alertId?: string,
  recipientName?: string
): Promise<{ success: boolean }> {
  const apiKey = Deno.env.get("AT_API_KEY");
  const username = Deno.env.get("AT_USERNAME");
  const from = Deno.env.get("AT_VOICE_PHONE") || "";

  if (!apiKey || !username) {
    console.log(`[VOICE DEMO] Would call ${to}`);
    if (alertId) {
      await supabase.from("notification_log").insert({
        alert_id: alertId,
        recipient_phone: to,
        recipient_name: recipientName,
        notification_type: "voice",
        message_content: "Emergency voice call",
        status: "sent",
        provider_response: { demo: true },
      });
    }
    return { success: true };
  }

  try {
    const resp = await fetch(`${atVoiceUrl()}/call`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
        apiKey,
      },
      body: new URLSearchParams({ username, to, from }),
    });
    const result = await resp.json();
    console.log(`[VOICE] Call to ${to}: ${JSON.stringify(result)}`);

    if (alertId) {
      await supabase.from("notification_log").insert({
        alert_id: alertId,
        recipient_phone: to,
        recipient_name: recipientName,
        notification_type: "voice",
        message_content: "Emergency voice call initiated",
        status: "sent",
        provider_response: result,
      });
    }
    return { success: true };
  } catch (error) {
    console.error(`[VOICE ERROR] ${to}:`, error);
    if (alertId) {
      await supabase.from("notification_log").insert({
        alert_id: alertId,
        recipient_phone: to,
        recipient_name: recipientName,
        notification_type: "voice",
        message_content: "Emergency voice call",
        status: "failed",
        provider_response: { error: String(error) },
      });
    }
    return { success: false };
  }
}

// ============================================================
// EMERGENCY HANDLER — Jirani Mesh Network Activation
// ============================================================
async function triggerEmergency(
  supabase: ReturnType<typeof createClient>,
  patient: Patient,
  alertType: "medical" | "security",
  lang: Lang
): Promise<string> {
  // 1. Create the emergency alert in DB
  const { data: alert, error: alertErr } = await supabase
    .from("alerts")
    .insert({
      patient_name: patient.name,
      phone: patient.phone,
      symptom: alertType === "medical" ? "Medical Emergency (USSD)" : "Security Threat (USSD)",
      severity: "critical",
      location: patient.location || "Unknown",
      status: "pending",
      source: "ussd",
      alert_type: alertType === "medical" ? "emergency" : "security",
      patient_id: patient.id,
    })
    .select("id")
    .single();

  if (alertErr) console.error(`[DB-ERROR] Alert insert FAILED: ${JSON.stringify(alertErr)}`);
  const alertId = alert?.id;
  console.log(`[EMERGENCY] Alert created: ${alertId} for ${patient.name} (patient.id=${patient.id})`);

  // 2. Fetch Jirani network (neighbors + CHPs)
  const { data: network, error: netErr } = await supabase
    .from("jirani_network")
    .select("*")
    .eq("patient_id", patient.id)
    .eq("is_active", true)
    .order("priority", { ascending: true });

  if (netErr) console.error(`[DB-ERROR] Jirani query FAILED: ${JSON.stringify(netErr)}`);
  console.log(`[EMERGENCY] Jirani network for ${patient.id}: ${JSON.stringify(network?.length)} contacts`);

  const neighbors = (network || []).filter((c) => c.contact_type === "neighbor");
  const chps = (network || []).filter((c) => c.contact_type === "chp");
  const chpName = chps[0]?.contact_name || "your CHP";

  // 3. Send SMS to all neighbors
  const emergencyMsg =
    lang === "sw"
      ? `DHARURA! Jirani yako ${patient.name} anahitaji msaada SASA hivi eneo la ${patient.location}. Tafadhali jibu haraka! - Dawa Mashinani Jirani Network`
      : `EMERGENCY! Your neighbor ${patient.name} needs help NOW at ${patient.location}. Please respond immediately! - Dawa Mashinani Jirani Network`;

  for (const neighbor of neighbors) {
    await sendSMS(neighbor.contact_phone, emergencyMsg, supabase, alertId);
    console.log(`[JIRANI] SMS sent to neighbor: ${neighbor.contact_name}`);
  }

  // 4. Send SMS + Voice call to CHP
  const chpMsg =
    lang === "sw"
      ? `ARIFA YA DHARURA: Mgonjwa ${patient.name} (${patient.phone}) eneo la ${patient.location} ameomba msaada wa dharura kupitia USSD. Jibu MARA MOJA. - Dawa Mashinani`
      : `EMERGENCY ALERT: Patient ${patient.name} (${patient.phone}) at ${patient.location} has triggered a ${alertType} emergency via USSD. Respond IMMEDIATELY. - Dawa Mashinani`;

  for (const chp of chps) {
    await sendSMS(chp.contact_phone, chpMsg, supabase, alertId);
    await makeVoiceCall(chp.contact_phone, supabase, alertId, chp.contact_name);
    console.log(`[JIRANI] SMS + Voice call to CHP: ${chp.contact_name}`);
  }

  // 5. Send confirmation SMS to patient
  const confirmMsg =
    lang === "sw"
      ? `Arifa yako ya dharura imesikika. Majirani ${neighbors.length} na CHP ${chpName} wamearifiwa. Msaada unakuja. Tulia.`
      : `Your emergency alert has been received. ${neighbors.length} neighbors and CHP ${chpName} have been notified. Help is on the way. Stay calm.`;
  await sendSMS(patient.phone, confirmMsg, supabase, alertId);

  // 6. Return USSD response
  if (alertType === "security") {
    return msg(lang, "securitySent");
  }
  return msg(lang, "emergencySent")
    .replace("{neighbors}", String(neighbors.length))
    .replace("{chp}", chpName);
}

// ============================================================
// HEALTH INSIGHTS SMS — Mlinzi
// ============================================================
async function sendHealthInsightsSMS(
  supabase: ReturnType<typeof createClient>,
  patient: Patient,
  lang: Lang
): Promise<boolean> {
  // Fetch latest vitals
  const { data: vitals } = await supabase
    .from("clinical_vitals")
    .select("*")
    .eq("patient_id", patient.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!vitals) return false;

  const smsBody =
    lang === "sw"
      ? `MLINZI - Muhtasari wa Afya\n\nJina: ${patient.name}\nAfya ID: ${patient.upi}\n\nVitals:\n- BP: ${vitals.bp_systolic}/${vitals.bp_diastolic} mmHg\n- Uzito: ${vitals.weight_kg} kg\n- Mapigo: ${vitals.pulse} bpm\n- Joto: ${vitals.temperature}°C\n- Sukari: ${vitals.blood_sugar || "N/A"} mmol/L\n- Oksijeni: ${vitals.oxygen_saturation || "N/A"}%\n\nMaelezo: ${vitals.notes || "Hakuna"}\n\n- Dawa Mashinani`
      : `MLINZI - Health Summary\n\nName: ${patient.name}\nAfya ID: ${patient.upi}\n\nVitals:\n- BP: ${vitals.bp_systolic}/${vitals.bp_diastolic} mmHg\n- Weight: ${vitals.weight_kg} kg\n- Pulse: ${vitals.pulse} bpm\n- Temp: ${vitals.temperature}°C\n- Blood Sugar: ${vitals.blood_sugar || "N/A"} mmol/L\n- O2 Sat: ${vitals.oxygen_saturation || "N/A"}%\n\nNotes: ${vitals.notes || "None"}\n\n- Dawa Mashinani`;

  await sendSMS(patient.phone, smsBody, supabase);
  return true;
}

// ============================================================
// GEMINI AI — Rafiki Health Advice
// ============================================================
async function askGeminiRafiki(
  symptomInput: string,
  lang: Lang,
  patientName: string
): Promise<{ advice: string; severity: "critical" | "high" | "medium" | "low" }> {
  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) {
    console.log("[GEMINI] No API key — falling back to static KB");
    const symptomKey = detectSymptom(symptomInput);
    const info = SYMPTOM_KB[symptomKey] || SYMPTOM_KB.fever;
    return { advice: lang === "sw" ? info.sw : info.en, severity: info.severity };
  }

  const langName = lang === "sw" ? "Kiswahili" : "English";
  const prompt = `You are Rafiki, a health AI assistant for Dawa Mashinani (a rural Kenya health platform). 
A patient named "${patientName}" reports: "${symptomInput}".

Respond in ${langName}. Your response MUST:
1. Start with "Rafiki:" 
2. Be max 150 characters (USSD limit)
3. Give brief, actionable advice
4. End with severity on new line: SEVERITY:critical OR SEVERITY:high OR SEVERITY:medium OR SEVERITY:low

Example format:
Rafiki: [brief advice here]
SEVERITY:medium`;

  try {
    const resp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 120, temperature: 0.3 },
        }),
      }
    );
    console.log(`[GEMINI] Status: ${resp.status}`);
    if (!resp.ok) {
      const errText = await resp.text();
      console.error(`[GEMINI] HTTP ${resp.status}: ${errText}`);
      throw new Error(`Gemini API error: ${resp.status}`);
    }
    const data = await resp.json();
    console.log(`[GEMINI] Full data: ${JSON.stringify(data).substring(0, 500)}`);
    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    console.log(`[GEMINI] Raw response: ${raw}`);
    console.log(`[GEMINI] Raw response: ${raw}`);

    // Extract severity
    let severity: "critical" | "high" | "medium" | "low" = "medium";
    const sevMatch = raw.match(/SEVERITY:(critical|high|medium|low)/i);
    if (sevMatch) severity = sevMatch[1].toLowerCase() as typeof severity;

    // Clean advice: remove the SEVERITY line, trim to 160 chars for USSD
    let advice = raw.replace(/\n?SEVERITY:\w+/i, "").trim();
    if (advice.length > 160) advice = advice.substring(0, 157) + "...";
    if (!advice.startsWith("Rafiki")) advice = `Rafiki: ${advice}`;

    return { advice, severity };
  } catch (err) {
    console.error("[GEMINI ERROR]:", err);
    // Fallback to static KB
    const symptomKey = detectSymptom(symptomInput);
    const info = SYMPTOM_KB[symptomKey] || SYMPTOM_KB.fever;
    return { advice: lang === "sw" ? info.sw : info.en, severity: info.severity };
  }
}

// ============================================================
// MAIN HANDLER
// ============================================================
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Africa's Talking sends POST with form-encoded data
    const formData = await req.formData();
    const sessionId = formData.get("sessionId") as string;
    const phoneNumber = formData.get("phoneNumber") as string;
    const text = (formData.get("text") as string) || "";
    const serviceCode = formData.get("serviceCode") as string;

    console.log(
      `[USSD] Session: ${sessionId}, Phone: ${phoneNumber}, Input: "${text}"`
    );

    // Parse cumulative input (AT separates with *)
    const parts = text.split("*").filter(Boolean);
    const level = parts.length;
    let response = "";

    // ========================
    // LEVEL 0 — Language Selection
    // ========================
    if (level === 0) {
      response = "CON " + msg("en", "welcome");

      // Create USSD session
      const { error: sessErr } = await supabase.from("ussd_sessions").upsert(
        {
          session_id: sessionId,
          phone_number: phoneNumber,
          service_code: serviceCode || "*433#",
          current_menu: "language_select",
          conversation_log: [
            { input: "", menu: "language_select", ts: new Date().toISOString() },
          ],
          status: "active",
        },
        { onConflict: "session_id" }
      );
      if (sessErr) console.error(`[DB-ERROR] USSD session upsert FAILED: ${JSON.stringify(sessErr)}`);
    }

    // ========================
    // LEVEL 1 — Main Menu (after language)
    // ========================
    else if (level === 1) {
      const lang: Lang = parts[0] === "2" ? "sw" : "en";

      // Auto-register if needed — any phone number works
      const patient = await getOrCreatePatient(supabase, phoneNumber, lang);

      // Store language preference
      await supabase
        .from("patients")
        .update({ language_pref: lang })
        .eq("id", patient.id);

      response =
        "CON " +
        msg(lang, "mainMenu").replace("{phone}", maskPhone(phoneNumber));
    }

    // ========================
    // LEVEL 2 — Menu Option Selected
    // ========================
    else if (level === 2) {
      const lang: Lang = parts[0] === "2" ? "sw" : "en";
      const option = parts[1];

      // Auto-register if needed
      const patient = await getOrCreatePatient(supabase, phoneNumber, lang);

      switch (option) {
        case "1": // EMERGENCY (Jirani)
          response = "CON " + msg(lang, "emergencyMenu");
          break;

        case "2": // Ask Rafiki
          response = "CON " + msg(lang, "rafikiPrompt");
          break;

        case "3": {
          // Health Alerts & Mlinzi
          const ward = patient?.ward || "default";
          const areaAlert =
            AREA_ALERTS[ward]?.[lang] || AREA_ALERTS.default[lang];
          response =
            "CON " +
            msg(lang, "mlinziMenu").replace("{areaAlert}", areaAlert);
          break;
        }

        case "4": {
          // Unlock Afya ID for Doctor
          const pin = generatePIN();
          // Store the token (expires in 30 min)
          await supabase.from("afya_id_tokens").insert({
            patient_id: patient.id,
            pin_code: pin,
            expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
          });
          response =
            "CON " + msg(lang, "afyaIdMenu").replace("{pin}", pin);
          break;
        }

        case "5": {
          // Request Voice Call — call both patient and CHP
          const patient5 = await getOrCreatePatient(supabase, phoneNumber, lang);
          const { data: chp } = await supabase
            .from("jirani_network")
            .select("contact_phone, contact_name")
            .eq("patient_id", patient5.id)
            .eq("contact_type", "chp")
            .single();

          // Initiate voice call to the patient
          await makeVoiceCall(phoneNumber, supabase, undefined, patient5.name);
          // Also call the CHP so they connect
          if (chp) {
            await makeVoiceCall(chp.contact_phone, supabase, undefined, chp.contact_name);
          }
          response = "END " + msg(lang, "voiceCall");
          break;
        }

        default:
          response = "END " + msg(lang, "invalidOption");
      }
    }

    // ========================
    // LEVEL 3 — Sub-menu Actions
    // ========================
    else if (level === 3) {
      const lang: Lang = parts[0] === "2" ? "sw" : "en";
      const option = parts[1]; // Main menu selection
      const sub = parts[2]; // Sub-menu selection

      const patient = await getOrCreatePatient(supabase, phoneNumber, lang);

      if (option === "1") {
        // EMERGENCY sub-menu
        if (sub === "1") {
          // Medical Emergency — TRIGGER JIRANI NETWORK
          const result = await triggerEmergency(
            supabase,
            patient as Patient,
            "medical",
            lang
          );
          response = "END " + result;
        } else if (sub === "2") {
          // Security Threat
          const result = await triggerEmergency(
            supabase,
            patient as Patient,
            "security",
            lang
          );
          response = "END " + result;
        } else if (sub === "0") {
          response = "END " + msg(lang, "emergencyCancelled");
        } else {
          response = "END " + msg(lang, "invalidOption");
        }
      } else if (option === "2") {
        // Rafiki — symptom entered (free text or number)

        // Option 8 = "Other: Speak to CHP" → trigger voice call
        if (sub === "8") {
          const { data: chp } = await supabase
            .from("jirani_network")
            .select("contact_phone, contact_name")
            .eq("patient_id", patient.id)
            .eq("contact_type", "chp")
            .single();

          if (chp) {
            // Voice call FROM CHP TO patient
            await makeVoiceCall(patient.phone, supabase, undefined, patient.name);
            // Also SMS CHP to call patient
            const chpMsg = lang === "sw"
              ? `Mgonjwa ${patient.name} (${patient.phone}) anahitaji kuongea nawe. Tafadhali wapigie. - Dawa Mashinani`
              : `Patient ${patient.name} (${patient.phone}) needs to speak with you. Please call them. - Dawa Mashinani`;
            await sendSMS(chp.contact_phone, chpMsg, supabase);
          }
          response = "END " + msg(lang, "voiceCall");
        } else {
          // Map numeric choices to symptom names for better AI context
          const SYMPTOM_MAP: Record<string, string> = {
            "1": "Fever / high temperature",
            "2": "Headache",
            "3": "Cough / persistent cough",
            "4": "Stomach pain / abdominal pain",
            "5": "Malaria symptoms (fever, chills, sweating)",
            "6": "Pregnancy concern",
            "7": "Diarrhea",
          };
          const symptomText = SYMPTOM_MAP[sub] || sub; // Use mapped name or free text
          const { advice, severity } = await askGeminiRafiki(symptomText, lang, patient.name);

          // Auto-create alert for critical/high severity symptoms
          if (severity === "critical" || severity === "high") {
            await supabase.from("alerts").insert({
              patient_name: patient.name,
              phone: patient.phone,
              symptom: `${sub} (Rafiki AI USSD)`,
              severity,
              location: patient.location || "Unknown",
              status: "pending",
              source: "ussd",
              alert_type: "medical",
              patient_id: patient.id,
            });
            console.log(`[RAFIKI-AI] Auto-alert: ${severity} - ${sub}`);
          }

          response = "CON " + advice + msg(lang, "rafikiFollowUp");
        }
      } else if (option === "3") {
        // Mlinzi sub-menu
        if (sub === "1") {
          // Send health insights via SMS
          const sent = await sendHealthInsightsSMS(
            supabase,
            patient as Patient,
            lang
          );
          response = sent
            ? "END " + msg(lang, "healthSmsSent")
            : "END " + msg(lang, "noHealthData");
        } else {
          response = "END " + msg(lang, "invalidOption");
        }
      } else if (option === "4") {
        // Afya ID sub-menu
        if (sub === "1") {
          // Revoke access
          await supabase
            .from("afya_id_tokens")
            .update({ is_revoked: true })
            .eq("patient_id", patient.id)
            .eq("is_revoked", false);
          response = "END " + msg(lang, "afyaRevoked");
        } else {
          response = "END " + msg(lang, "invalidOption");
        }
      } else {
        response = "END " + msg(lang, "invalidOption");
      }
    }

    // ========================
    // LEVEL 4 — Rafiki Follow-up
    // ========================
    else if (level === 4) {
      const lang: Lang = parts[0] === "2" ? "sw" : "en";
      const option = parts[1];
      const followUp = parts[3];

      if (option === "2") {
        // Rafiki follow-up response
        if (followUp === "0") {
          // Speak to CHP — trigger actual voice call + SMS
          const patient = await getOrCreatePatient(supabase, phoneNumber, lang);

          const { data: chp } = await supabase
            .from("jirani_network")
            .select("contact_name, contact_phone")
            .eq("patient_id", patient.id)
            .eq("contact_type", "chp")
            .single();

          if (chp) {
            // Voice call to patient from system
            await makeVoiceCall(patient.phone, supabase, undefined, patient.name);
            // SMS to CHP to call the patient
            const chpAlert =
              lang === "sw"
                ? `Mgonjwa ${patient.name} (${patient.phone}) anahitaji kuongea na CHP. Tafadhali wapigie simu SASA. - Dawa Mashinani`
                : `Patient ${patient.name} (${patient.phone}) is requesting CHP voice assistance via Rafiki. Please call them NOW. - Dawa Mashinani`;
            await sendSMS(chp.contact_phone, chpAlert, supabase);
            // Also voice call the CHP
            await makeVoiceCall(chp.contact_phone, supabase, undefined, chp.contact_name);
          }
          response = "END " + msg(lang, "chpAlerted");
        } else {
          // Follow-up answer (1, 2, or 3) — provide generic advice and end
          response = "END " + msg(lang, "rafikiAdviceEnd");
        }
      } else {
        response = "END " + msg(lang, "invalidOption");
      }
    }

    // ========================
    // FALLBACK
    // ========================
    else {
      const lang: Lang = parts[0] === "2" ? "sw" : "en";
      response = "END " + msg(lang, "invalidOption");
    }

    // ========================
    // LOG SESSION
    // ========================
    await supabase
      .from("ussd_sessions")
      .update({
        current_menu: `level_${level}_option_${parts[1] || "root"}`,
        conversation_log: [
          { input: text, level, parts, ts: new Date().toISOString() },
        ],
        status: response.startsWith("END") ? "completed" : "active",
      })
      .eq("session_id", sessionId);

    // Return plain text (Africa's Talking protocol)
    return new Response(response, {
      headers: { ...corsHeaders, "Content-Type": "text/plain" },
    });
  } catch (error) {
    console.error("[USSD ERROR]:", error);
    return new Response(
      "END An error occurred. Please try again. Dial *433#.",
      {
        headers: { ...corsHeaders, "Content-Type": "text/plain" },
      }
    );
  }
});
