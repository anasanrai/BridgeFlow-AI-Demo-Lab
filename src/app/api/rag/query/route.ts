import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

async function embedText(text: string): Promise<number[]> {
  for (const modelName of ["text-embedding-004", "embedding-001"]) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.embedContent(text);
      return result.embedding.values;
    } catch {
      continue;
    }
  }
  throw new Error("Embedding unavailable");
}

const DEFAULT_CONTEXT = `
BridgeFlow AI Agency — Services & Capabilities

COMPANY OVERVIEW
BridgeFlow is an AI automation agency specialising in voice AI agents, WhatsApp bots, n8n automation workflows, ERP systems, and Retrieval-Augmented Generation (RAG) implementations. We serve real estate agencies, private clinics, dental clinics, and SMBs across Saudi Arabia, UAE, UK, and US markets.

VOICE AI AGENTS
Inbound and outbound AI voice agents that answer calls, qualify leads, book appointments, and handle FAQs in Arabic and English.
Platforms: Vapi, Retell AI, ElevenLabs. Pricing: $400–$2,000 one-time setup.

WHATSAPP AUTOMATION BOTS
AI-powered WhatsApp bots for appointments, lead capture, follow-up, and reminders.
Pricing: $300–$800 one-time setup.

N8N AUTOMATION WORKFLOWS
End-to-end business process automation: CRM, calendar, email, WhatsApp, lead scraping.
Pricing: $200–$1,000 per workflow.

RAG KNOWLEDGE ASSISTANTS
AI agents that answer questions from your own documents — manuals, FAQs, contracts.
Stack: Supabase pgvector + Gemini embeddings + n8n orchestration. Pricing: $500–$1,500.

ERP AND BUSINESS SYSTEMS
Custom lightweight ERP for clinics and real estate. Pricing: $2,000+.

TECHNOLOGY STACK
Automation: n8n. Voice AI: Vapi, Retell AI, ElevenLabs. WhatsApp: Evolution API.
AI Models: Gemini, Claude API, Groq Llama. Vector DB: Supabase pgvector.
Frontend: Next.js, Tailwind, Supabase Auth. Telephony: Twilio.

DELIVERY TIMELINE
WhatsApp Bot: 2–3 days. Voice Agent: 3–5 days. Full automation: 5–7 days. RAG: 5–10 days.

PRICING PHILOSOPHY
Demo-first: Build a working demo at no charge — you only pay when satisfied.
Monthly maintenance from $100/month.

FOUNDER
Anasan Rai (Ani). n8n L1/L2 Certified. Claude 101 Certified. 5-star on Upwork. Based in Riyadh, Saudi Arabia.
Languages: English, Arabic, Nepali. Book via Calendly.

FAQS
- WhatsApp bots: no Meta verification needed (Evolution API).
- All agents bilingual: Arabic (Gulf dialect) + English.
- Data: stored in your own Supabase project — BridgeFlow never holds client data.
- Refund policy: Demo-first, pay only when satisfied.
`;

async function generateWithGroq(sysPrompt: string, userMessage: string): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY not set");
  const groq = new Groq({ apiKey });
  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: sysPrompt },
      { role: "user", content: userMessage },
    ],
    max_tokens: 600,
    temperature: 0.3,
  });
  return completion.choices[0]?.message?.content || "No answer generated.";
}

export async function POST(req: Request) {
  const { question, sessionId, systemPrompt, chunkCount = 5, threshold = 0.3 } = await req.json().catch(() => ({}));

  if (!question || !sessionId) {
    return NextResponse.json({ error: "Missing question or sessionId" }, { status: 400 });
  }

  const sysPrompt =
    systemPrompt ||
    "You are a helpful AI assistant for BridgeFlow. Answer questions based on the provided context. Be concise and helpful. If the answer is not in the context, say so clearly.";

  // Try vector search — gracefully skip if embedding fails
  let context = DEFAULT_CONTEXT;
  let sources: string[] = [];
  let usedVectorSearch = false;

  try {
    const queryEmbedding = await embedText(question);
    const { data: docs, error } = await supabaseAdmin.rpc("match_rag_documents", {
      query_embedding: `[${queryEmbedding.join(",")}]`,
      match_session_id: sessionId,
      match_count: chunkCount,
      match_threshold: threshold,
    });

    if (!error && docs && docs.length > 0) {
      context = docs.map((d: any) => d.content).join("\n\n---\n\n");
      sources = docs.map((d: any) => {
        const fn = d.metadata?.filename || "Source Chunk";
        return `[${fn}]: "${d.content.substring(0, 150)}..."`;
      });
      usedVectorSearch = true;
    }
  } catch {
    // Embedding unavailable — DEFAULT_CONTEXT already set above
  }

  const userMessage = `CONTEXT:\n${context}\n\nQUESTION: ${question}\n\nAnswer based on the context above. Be helpful, professional, and concise.`;

  // Try Gemini generation first
  let answer = "";
  for (const modelName of ["gemini-2.0-flash", "gemini-2.0-flash-exp", "gemini-1.5-flash"]) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(`${sysPrompt}\n\n${userMessage}`);
      answer = result.response.text();
      if (answer) break;
    } catch {
      continue;
    }
  }

  // Groq fallback for generation
  if (!answer) {
    try {
      answer = await generateWithGroq(sysPrompt, userMessage);
    } catch {
      answer = "The RAG assistant is temporarily unavailable. Please try again.";
    }
  }

  return NextResponse.json({
    answer,
    sources: usedVectorSearch ? sources : [],
    usedDefaultContext: !usedVectorSearch,
  });
}
