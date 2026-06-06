import { NextResponse } from "next/server";

const WEBHOOK_MAP: Record<string, string> = {
  "islamic-bot": process.env.N8N_WEBHOOK_ISLAMIC_BOT!,
  "clinic-bot": process.env.N8N_WEBHOOK_CLINIC_BOT!,
  "axis-agent": process.env.N8N_WEBHOOK_AXIS_AGENT!,
};

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
      console.error(`n8n webhook returned status: ${response.status}`);
      return NextResponse.json({ error: `n8n webhook error: ${response.statusText}` }, { status: 500 });
    }

    const data = await response.json();
    
    // n8n outputs vary: check output, message, text, or fallback
    const replyText =
      data?.output ||
      data?.message ||
      data?.text ||
      (typeof data === "string" ? data : JSON.stringify(data));

    return NextResponse.json({ reply: replyText });
  } catch (err: any) {
    console.error("n8n Chat Proxy Error:", err);
    return NextResponse.json(
      { error: "Request timeout or connection error. Make sure the n8n webhook is active." },
      { status: 500 }
    );
  }
}
