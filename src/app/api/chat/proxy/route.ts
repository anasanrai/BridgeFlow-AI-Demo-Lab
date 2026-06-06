import { NextResponse } from "next/server";
import Groq from "groq-sdk";

const WEBHOOK_MAP: Record<string, string | undefined> = {
  "islamic-bot": process.env.N8N_WEBHOOK_ISLAMIC_BOT,
  "clinic-bot": process.env.N8N_WEBHOOK_CLINIC_BOT,
  "axis-agent": process.env.N8N_WEBHOOK_AXIS_AGENT,
};

const SYSTEM_CONTEXTS: Record<string, string> = {
  "islamic-bot":
    "You are an expert Islamic family law consultant. Answer queries regarding marriage, divorce, inheritance, and child custody in a compassionate and legally accurate manner (based on Islamic jurisprudence). Support both English and Arabic.",
  "clinic-bot":
    "You are a helpful receptionist AI for a private clinic. Assist users with booking appointments, checking operating hours, and listing services. Greet in both Arabic and English.",
  "axis-agent":
    "You are the AXIS AI Command Agent, an advanced business assistant. Help with task planning, automation logic, and custom commands. Be direct, logical, and concise.",
};

function extractReply(data: unknown): string | null {
  if (!data) return null;
  if (typeof data === "string") {
    const trimmed = data.trim();
    // n8n returns this when there's no Respond to Webhook node
    if (trimmed === "Workflow was started" || trimmed === "") return null;
    return trimmed;
  }
  if (Array.isArray(data)) {
    const first = data[0];
    if (!first) return null;
    if (typeof first === "string") {
      return first === "Workflow was started" ? null : first;
    }
    if (first && typeof first === "object") {
      const f = first as Record<string, unknown>;
      const val = f.output ?? f.message ?? f.text ?? f.response ?? f.reply ?? f.answer;
      if (typeof val === "string" && val !== "Workflow was started") return val;
    }
    return null;
  }
  if (typeof data === "object") {
    const d = data as Record<string, unknown>;
    const val =
      d.output ?? d.message ?? d.text ?? d.response ?? d.reply ?? d.answer ??
      (typeof d.data === "string" ? d.data : undefined);
    if (typeof val === "string" && val !== "Workflow was started") return val;
  }
  return null;
}

async function groqFallback(
  agentKey: string,
  message: string,
  systemContext: string
): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return "The agent webhook is not responding. Please check the n8n workflow configuration.";
  }

  const groq = new Groq({ apiKey });
  const sysPrompt = systemContext || SYSTEM_CONTEXTS[agentKey] || "You are a helpful AI assistant.";

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: sysPrompt },
      { role: "user", content: message },
    ],
    max_tokens: 512,
    temperature: 0.4,
  });

  return completion.choices[0]?.message?.content || "No response generated.";
}

export async function POST(req: Request) {
  const { agentKey, message, sessionId, systemContext } = await req.json().catch(() => ({}));

  if (!agentKey || !message) {
    return NextResponse.json({ reply: "Missing agentKey or message." });
  }

  const webhookUrl = WEBHOOK_MAP[agentKey];

  // If webhook URL is missing or wrong, go straight to Groq
  if (!webhookUrl) {
    try {
      const reply = await groqFallback(agentKey, message, systemContext || "");
      return NextResponse.json({ reply, source: "groq-fallback" });
    } catch (err: any) {
      return NextResponse.json({ reply: `Agent not configured. (${err.message})` });
    }
  }

  // Try n8n webhook first
  let n8nReply: string | null = null;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        sessionId,
        systemContext: systemContext || "",
        source: "bridgeflow-demo-lab",
        timestamp: new Date().toISOString(),
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (response.ok) {
      const contentType = response.headers.get("content-type") || "";
      let data: unknown;
      if (contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();
        try {
          data = JSON.parse(text);
        } catch {
          data = text;
        }
      }
      n8nReply = extractReply(data);
    }
    // If !response.ok, fall through to Groq
  } catch {
    // Timeout or network error — fall through to Groq
  }

  if (n8nReply) {
    return NextResponse.json({ reply: n8nReply, source: "n8n" });
  }

  // Groq fallback
  try {
    const reply = await groqFallback(agentKey, message, systemContext || "");
    return NextResponse.json({ reply, source: "groq-fallback" });
  } catch (err: any) {
    return NextResponse.json({
      reply: "The agent is temporarily unavailable. Please try again in a moment.",
    });
  }
}
