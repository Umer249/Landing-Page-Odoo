const express = require("express");
const path = require("path");
const nodemailer = require("nodemailer");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_API_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const SUPABASE_LEADS_TABLE = process.env.SUPABASE_LEADS_TABLE || "leads";

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

function ensureSupabaseConfig() {
  if (!SUPABASE_URL || !SUPABASE_API_KEY) {
    throw new Error(
      "Missing Supabase config. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY."
    );
  }
}

function getSupabaseHeaders(preferReturn = false) {
  const headers = {
    apikey: SUPABASE_API_KEY,
    Authorization: `Bearer ${SUPABASE_API_KEY}`,
    "Content-Type": "application/json"
  };

  if (preferReturn) {
    headers.Prefer = "return=representation";
  }

  return headers;
}

async function saveLeadToSupabase(lead) {
  ensureSupabaseConfig();

  const response = await fetch(`${SUPABASE_URL}/rest/v1/${SUPABASE_LEADS_TABLE}`, {
    method: "POST",
    headers: getSupabaseHeaders(true),
    body: JSON.stringify([lead])
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Supabase insert failed: ${error}`);
  }
}

async function fetchLeadsFromSupabase() {
  ensureSupabaseConfig();

  const params = new URLSearchParams({
    select: "*",
    order: "submitted_at.desc"
  });

  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/${SUPABASE_LEADS_TABLE}?${params.toString()}`,
    {
      method: "GET",
      headers: getSupabaseHeaders(false)
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Supabase fetch failed: ${error}`);
  }

  return response.json();
}

function isAuthorized(req) {
  const adminKey = process.env.ADMIN_KEY || "change-me-admin-key";
  return req.query.key === adminKey || req.headers["x-admin-key"] === adminKey;
}

async function sendWebhook(payload) {
  if (!process.env.WEBHOOK_URL) return;
  try {
    await fetch(process.env.WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  } catch (error) {
    console.error("Webhook error:", error.message);
  }
}

async function sendEmail(payload) {
  const {
    SMTP_HOST,
    SMTP_PORT,
    SMTP_USER,
    SMTP_PASS,
    TO_EMAIL,
    FROM_EMAIL
  } = process.env;

  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS || !TO_EMAIL) return;

  try {
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT),
      secure: Number(SMTP_PORT) === 465,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS
      }
    });

    const lines = [
      "New Odoo ERP lead submission:",
      `Name: ${payload.name}`,
      `Phone: ${payload.phone}`,
      `Email: ${payload.email}`,
      `Company: ${payload.company || "-"}`,
      `Industry / services: ${payload.industry || "-"}`,
      `Project / message: ${payload.project || "-"}`,
      `Submitted At: ${payload.submitted_at}`
    ];

    await transporter.sendMail({
      from: FROM_EMAIL || SMTP_USER,
      to: TO_EMAIL,
      subject: "New Odoo ERP Lead (UAE Landing Page)",
      text: lines.join("\n")
    });
  } catch (error) {
    console.error("Email error:", error.message);
  }
}

app.post("/api/leads", async (req, res) => {
  const { name, phone, email, company, industry, project } = req.body;

  if (!name || !phone || !email) {
    return res.status(400).json({ error: "Name, phone, and email are required." });
  }

  const submission = {
    name: String(name).trim(),
    phone: String(phone).trim(),
    email: String(email).trim(),
    company: company ? String(company).trim() : "",
    industry: industry ? String(industry).trim() : "",
    project: project ? String(project).trim() : "",
    submitted_at: new Date().toISOString(),
    source: "Google Ads Landing Page"
  };

  try {
    await saveLeadToSupabase(submission);
    void sendWebhook(submission);
    void sendEmail(submission);

    return res.status(201).json({
      success: true,
      message: "Thanks! Our Odoo experts will contact you shortly."
    });
  } catch (error) {
    console.error("Lead save error:", error.message);
    return res.status(500).json({
      error: "Unable to submit lead right now. Please try again shortly."
    });
  }
});

app.get("/api/leads", async (req, res) => {
  if (!isAuthorized(req)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const all = await fetchLeadsFromSupabase();
    return res.json(all);
  } catch (error) {
    console.error("Admin fetch error:", error.message);
    return res.status(500).json({ error: "Unable to load submissions." });
  }
});

app.get("/admin", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin.html"));
});

app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

if (require.main === module) {
  const server = app.listen(PORT, () => {
    console.log(`Landing page running on http://localhost:${PORT}`);
  });

  server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.error(`\nPort ${PORT} is already in use (another app or an old server is still running).\n`);
      console.error("Options:");
      console.error(`  • Use another port:  set PORT=3001&&npm start`);
      console.error(`    PowerShell:        $env:PORT=3001; npm start`);
      console.error(`  • Free port ${PORT}:   netstat -ano | findstr :${PORT}`);
      console.error("    Then end the PID from Task Manager or: taskkill /PID <pid> /F\n");
      process.exit(1);
    }
    throw err;
  });
}

module.exports = app;
