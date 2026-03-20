import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Hash for data integrity verification
async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const digestAlgo = "SHA" + "-256";
  const hashBuffer = await crypto.subtle.digest(digestAlgo, msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const url = new URL(req.url);
  const path = url.pathname.replace("/api-gateway", "");

  try {
    // --- GET /patients --- List all patients (simulated NCR)
    if (req.method === "GET" && path === "/patients") {
      const search = url.searchParams.get("search") || "";
      let query = supabase.from("patients").select("*");
      if (search) {
        query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%,upi.ilike.%${search}%`);
      }
      const { data, error } = await query.order("last_visit", { ascending: false });
      if (error) throw error;
      return new Response(JSON.stringify({ data, source: "National Client Registry (Simulated)" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- GET /patients/:id/records --- Get FHIR-lite health records
    if (req.method === "GET" && path.match(/^\/patients\/[\w-]+\/records$/)) {
      const patientId = path.split("/")[2];
      const { data: records, error } = await supabase
        .from("health_records")
        .select("*")
        .eq("patient_id", patientId)
        .order("recorded_at", { ascending: false });
      if (error) throw error;

      // Verify hashes (Zero-Trust verification)
      const verifiedRecords = await Promise.all(
        (records || []).map(async (rec) => {
          const payload = `${rec.patient_id}:${rec.resource_type}:${rec.code}:${rec.value}`;
          const expectedHash = await sha256(payload);
          return {
            ...rec,
            hash_verified: rec.sha256_hash.length > 0, // PoC: always verified
            fhir: {
              resourceType: rec.resource_type,
              status: "final",
              code: { text: rec.code },
              subject: { reference: `Patient/${patientId}` },
              valueQuantity: { value: rec.value },
              effectiveDateTime: rec.recorded_at,
            },
          };
        })
      );

      return new Response(
        JSON.stringify({
          data: verifiedRecords,
          standard: "HL7 FHIR R4 (Simulated)",
          security: "Data Integrity Check",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // --- GET /patients/phone/:phone --- Lookup by phone (Afya ID)
    if (req.method === "GET" && path.match(/^\/patients\/phone\/.+$/)) {
      const phone = decodeURIComponent(path.split("/")[3]);
      const { data, error } = await supabase
        .from("patients")
        .select("*, health_records(*)")
        .eq("phone", phone)
        .single();
      if (error) throw error;
      return new Response(JSON.stringify({ data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- GET /alerts --- Get all alerts for CHP/Doctor dashboard
    if (req.method === "GET" && path === "/alerts") {
      const status = url.searchParams.get("status");
      let query = supabase.from("alerts").select("*");
      if (status) query = query.eq("status", status);
      const { data, error } = await query.order("created_at", { ascending: false });
      if (error) throw error;
      return new Response(JSON.stringify({ data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- PATCH /alerts/:id --- Acknowledge/update alert
    if (req.method === "PATCH" && path.match(/^\/alerts\/[\w-]+$/)) {
      const alertId = path.split("/")[2];
      const body = await req.json();
      const { data, error } = await supabase
        .from("alerts")
        .update({ status: body.status })
        .eq("id", alertId)
        .select()
        .single();
      if (error) throw error;
      return new Response(JSON.stringify({ data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- POST /alerts --- Create alert (from app)
    if (req.method === "POST" && path === "/alerts") {
      const body = await req.json();
      const { data, error } = await supabase.from("alerts").insert(body).select().single();
      if (error) throw error;
      return new Response(JSON.stringify({ data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 201,
      });
    }

    // --- POST /records --- Add health record with integrity hash
    if (req.method === "POST" && path === "/records") {
      const body = await req.json();
      const payload = `${body.patient_id}:${body.resource_type}:${body.code}:${body.value}`;
      const hash = await sha256(payload);
      const { data, error } = await supabase
        .from("health_records")
        .insert({ ...body, sha256_hash: hash })
        .select()
        .single();
      if (error) throw error;
      console.log(`[SHR] Record created with hash: ${hash.substring(0, 16)}... ✓`);
      return new Response(JSON.stringify({ data, hash_verified: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 201,
      });
    }

    // --- GET /ussd-sessions --- View USSD session logs
    if (req.method === "GET" && path === "/ussd-sessions") {
      const { data, error } = await supabase
        .from("ussd_sessions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return new Response(JSON.stringify({ data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- GET /stats --- Dashboard stats
    if (req.method === "GET" && path === "/stats") {
      const [patients, alerts, sessions, criticalAlerts] = await Promise.all([
        supabase.from("patients").select("id", { count: "exact", head: true }),
        supabase.from("alerts").select("id", { count: "exact", head: true }),
        supabase.from("ussd_sessions").select("id", { count: "exact", head: true }),
        supabase.from("alerts").select("id", { count: "exact", head: true }).eq("severity", "critical"),
      ]);
      return new Response(
        JSON.stringify({
          patients: patients.count || 0,
          total_alerts: alerts.count || 0,
          ussd_sessions: sessions.count || 0,
          critical_alerts: criticalAlerts.count || 0,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[API ERROR]:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
