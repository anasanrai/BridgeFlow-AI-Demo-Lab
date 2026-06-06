import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { agentId } = await req.json();

    if (!agentId) {
      return NextResponse.json({ error: "Missing agentId" }, { status: 400 });
    }

    const response = await fetch("https://api.retellai.com/v2/create-web-call", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RETELL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ agent_id: agentId }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Retell API Error response:", errText);
      return NextResponse.json(
        { error: `Failed to create Retell web call: ${response.statusText}` },
        { status: 500 }
      );
    }

    const data = await response.json();
    return NextResponse.json({ accessToken: data.access_token });
  } catch (error: any) {
    console.error("Retell server error:", error);
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 });
  }
}
