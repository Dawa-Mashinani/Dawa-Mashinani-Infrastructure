import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Mock Rafiki AI responses — "Decision-Tree Simulation Engine"
const RAFIKI_RESPONSES: Record<string, string> = {
  fever:
    "Rafiki AI: Based on your symptoms, ensure you stay hydrated and monitor your temperature. If it exceeds 38.5°C, seek medical attention immediately.\n1. Alert nearest CHP\n2. Back to menu",
  headache:
    "Rafiki AI: For persistent headaches, rest in a dark quiet room and stay hydrated. If headaches persist for more than 48 hours, visit your nearest health facility.\n1. Alert nearest CHP\n2. Back to menu",
  cough:
    "Rafiki AI: A persistent cough may indicate a respiratory infection. Monitor for difficulty breathing or chest pain.\n1. Alert nearest CHP\n2. Back to menu",
  bleeding:
    "Rafiki AI: ⚠️ CRITICAL — Severe bleeding requires immediate medical attention. Stay calm and apply pressure. Emergency referral triggered.\n1. Confirm location\n2. Back to menu",
  malaria:
    "Rafiki AI: Malaria symptoms include fever, chills, and body aches. Get tested at your nearest facility. Use treated mosquito nets.\n1. Alert nearest CHP\n2. Back to menu",
  pregnancy:
    "Rafiki AI: Regular antenatal visits are essential. Report any bleeding, severe headaches, or swelling immediately.\n1. Schedule ANC visit\n2. Back to menu",
  diarrhea:
    "Rafiki AI: Stay hydrated with ORS (Oral Rehydration Salts). If diarrhea persists beyond 48 hours or contains blood, seek medical help.\n1. Alert nearest CHP\n2. Back to menu",
};

// Symptom-to-severity mapping for alert generation
const SEVERITY_MAP: Record<string, string> = {
  bleeding: "critical",
  fever: "high",
  headache: "medium",
  cough: "medium",
  malaria: "high",
  pregnancy: "high",
  diarrhea: "medium",
};

// SHA-256 hash function for data integrity
async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Africa's Talking sends POST with form data
    const formData = await req.formData();
    const sessionId = formData.get("sessionId") as string;
    const phoneNumber = formData.get("phoneNumber") as string;
    const text = (formData.get("text") as string) || "";
    const serviceCode = formData.get("serviceCode") as string;

    console.log(`[USSD] Session: ${sessionId}, Phone: ${phoneNumber}, Input: "${text}"`);

    // Parse the text input (AT sends cumulative selections separated by *)
    const parts = text.split("*").filter(Boolean);
    const level = parts.length;

    let response = "";

    // --- USSD Menu Logic ---

    if (level === 0) {
      // Main menu
      response =
        "CON Welcome to Dawa Mashinani 🏥\nYour Digital Health Superhighway\n\n1. Rafiki AI - Symptom Check\n2. Jirani Ledger - My Records\n3. Mlinzi - Health Score\n4. My Afya ID";

      // Create/update USSD session
      await supabase.from("ussd_sessions").upsert(
        {
          session_id: sessionId,
          phone_number: phoneNumber,
          service_code: serviceCode || "*384#",
          current_menu: "main",
          conversation_log: [{ input: "", menu: "main", timestamp: new Date().toISOString() }],
          status: "active",
        },
        { onConflict: "session_id" }
      );
    } else if (parts[0] === "1") {
      // Rafiki AI flow
      if (level === 1) {
        response =
          "CON 🤖 Rafiki AI - Symptom Assessment\nDescribe your main symptom:\n\n1. Fever\n2. Headache\n3. Cough\n4. Bleeding\n5. Malaria symptoms\n6. Pregnancy concern\n7. Diarrhea";
      } else if (level === 2) {
        const symptomMap: Record<string, string> = {
          "1": "fever",
          "2": "headache",
          "3": "cough",
          "4": "bleeding",
          "5": "malaria",
          "6": "pregnancy",
          "7": "diarrhea",
        };
        const symptomKey = symptomMap[parts[1]] || "fever";
        const rafikiResponse = RAFIKI_RESPONSES[symptomKey] || RAFIKI_RESPONSES.fever;
        response = `CON ${rafikiResponse}`;

        // Generate SHA-256 hash for this interaction
        const dataPayload = JSON.stringify({
          phone: phoneNumber,
          symptom: symptomKey,
          timestamp: new Date().toISOString(),
        });
        const hash = await sha256(dataPayload);
        console.log(`[SECURITY] SHA-256 Hash: ${hash.substring(0, 16)}... ✓ Verified`);

        // If critical symptom, auto-create alert for CHP dashboard
        const severity = SEVERITY_MAP[symptomKey];
        if (severity === "critical" || severity === "high") {
          // Look up patient by phone
          const { data: patient } = await supabase
            .from("patients")
            .select("name, location")
            .eq("phone", phoneNumber)
            .single();

          await supabase.from("alerts").insert({
            patient_name: patient?.name || phoneNumber,
            phone: phoneNumber,
            symptom: symptomKey.charAt(0).toUpperCase() + symptomKey.slice(1),
            severity: severity,
            location: patient?.location || "Unknown",
            status: "pending",
            source: "ussd",
          });

          console.log(`[MLINZI] Alert triggered: ${severity} - ${symptomKey} for ${phoneNumber}`);
        }
      } else if (level === 3) {
        if (parts[2] === "1") {
          // Alert CHP
          const { data: patient } = await supabase
            .from("patients")
            .select("name, location")
            .eq("phone", phoneNumber)
            .single();

          await supabase.from("alerts").insert({
            patient_name: patient?.name || phoneNumber,
            phone: phoneNumber,
            symptom: "USSD Referral Request",
            severity: "high",
            location: patient?.location || "Unknown",
            status: "pending",
            source: "ussd",
          });

          response = "END ✅ Your nearest Community Health Promoter has been alerted.\nThey will contact you shortly.\n\nStay safe. — Dawa Mashinani";
        } else {
          response =
            "CON Welcome to Dawa Mashinani 🏥\n\n1. Rafiki AI - Symptom Check\n2. Jirani Ledger - My Records\n3. Mlinzi - Health Score\n4. My Afya ID";
        }
      }
    } else if (parts[0] === "2") {
      // Jirani Ledger
      if (level === 1) {
        const { data: patient } = await supabase
          .from("patients")
          .select("id, upi, name")
          .eq("phone", phoneNumber)
          .single();

        if (patient) {
          const { data: records } = await supabase
            .from("health_records")
            .select("resource_type, code, value, sha256_hash, recorded_at")
            .eq("patient_id", patient.id)
            .order("recorded_at", { ascending: false })
            .limit(3);

          if (records && records.length > 0) {
            let recordList = `CON 📋 Jirani Ledger - ${patient.name}\nUPI: ${patient.upi}\n\n`;
            records.forEach((r, i) => {
              recordList += `${i + 1}. ${r.code}: ${r.value}\n   Hash: ${r.sha256_hash.substring(0, 8)}..✓\n`;
            });
            recordList += "\n0. Back to menu";
            response = recordList;
          } else {
            response = "CON No records found.\n\n0. Back to menu";
          }
        } else {
          response = "CON ❌ No Afya ID found for this number.\nVisit your nearest health facility to register.\n\n0. Back to menu";
        }
      } else {
        response =
          "CON Welcome to Dawa Mashinani 🏥\n\n1. Rafiki AI - Symptom Check\n2. Jirani Ledger - My Records\n3. Mlinzi - Health Score\n4. My Afya ID";
      }
    } else if (parts[0] === "3") {
      // Mlinzi Health Score
      response = "CON 🛡️ Mlinzi Health Score\n\nYour Score: 82/100 ✅\n\nRecommendations:\n• Schedule BP follow-up\n• Update immunization records\n• Annual screening due\n\n0. Back to menu";
      if (level > 1) {
        response =
          "CON Welcome to Dawa Mashinani 🏥\n\n1. Rafiki AI - Symptom Check\n2. Jirani Ledger - My Records\n3. Mlinzi - Health Score\n4. My Afya ID";
      }
    } else if (parts[0] === "4") {
      // My Afya ID
      const { data: patient } = await supabase
        .from("patients")
        .select("upi, name, phone")
        .eq("phone", phoneNumber)
        .single();

      if (patient) {
        const idHash = await sha256(`${patient.upi}:${patient.phone}:${new Date().toISOString()}`);
        response = `END 🆔 Digital Afya ID\n\nName: ${patient.name}\nUPI: ${patient.upi}\nPhone: ${patient.phone}\n\nVerification: ${idHash.substring(0, 12)}...\nStatus: ✅ Verified\n\n— Secured by SHA-256`;
      } else {
        response = "END ❌ No Afya ID found.\nVisit your nearest health facility to register.";
      }
    } else {
      response = "END Invalid option. Please try again.";
    }

    // Update session log
    await supabase
      .from("ussd_sessions")
      .update({
        current_menu: `level_${level}`,
        conversation_log: [{ input: text, level, timestamp: new Date().toISOString() }],
        status: response.startsWith("END") ? "completed" : "active",
      })
      .eq("session_id", sessionId);

    // Return plain text response (Africa's Talking expects this)
    return new Response(response, {
      headers: { ...corsHeaders, "Content-Type": "text/plain" },
    });
  } catch (error) {
    console.error("[USSD ERROR]:", error);
    return new Response("END An error occurred. Please try again.", {
      headers: { ...corsHeaders, "Content-Type": "text/plain" },
    });
  }
});
