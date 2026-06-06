import { NextResponse } from "next/server";

const WEBHOOK_MAP: Record<string, string> = {
  "islamic-bot": process.env.N8N_WEBHOOK_ISLAMIC_BOT!,
  "clinic-bot": process.env.N8N_WEBHOOK_CLINIC_BOT!,
  "axis-agent": process.env.N8N_WEBHOOK_AXIS_AGENT!,
};

function extractReply(data: unknown): string {
  if (typeof data === "string") return data;
  if (Array.isArray(data)) {
    const first = data[0];
    if (typeof first === "string") return first;
    if (first && typeof first === "object") {
      const f = first as Record<string, unknown>;
      const val = f.output ?? f.message ?? f.text ?? f.response ?? f.reply ?? f.answer;
      if (typeof val === "string") return val;
    }
    return JSON.stringify(data[0] ?? data);
  }
  if (data && typeof data === "object") {
    const d = data as Record<string, unknown>;
    const val =
      d.output ?? d.message ?? d.text ?? d.response ?? d.reply ?? d.answer ??
      (typeof d.data === "string" ? d.data : undefined);
    if (typeof val === "string") return val;
  }
  return JSON.stringify(data);
}

export async function POST(req: Request) {
  try {
    const { agentKey, message, sessionId, systemContext } = await req.json();

    if (!agentKey || !message) {
      return NextResponse.json({ error: "Missing agentKey or message" }, { status: 400 });
    }

    const webhookUrl = WEBHOOK_MAP[agentKey];
    if (!webhookUrl) {
      return NextResponse.json({ error: "Unknown agent key" }, { status: 400 });
    }

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        sessionId,
        systemContext: systemContext || "",
        source: "bridgeflow-demo-lab",
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Webhook returned ${response.status}. Make sure the n8n workflow is active.` },
        { status: 500 }
      );
    }

    const data = await response.json();
    return NextResponse.json({ reply: extractReply(data) });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Request timeout or connection error. Make sure the n8n webhook is active." },
      { status: 500 }
    );
  }
}
