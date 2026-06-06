import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { GoogleGenerativeAI } from "@google/generative-ai";

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
  throw new Error("No Gemini embedding model available. Check GEMINI_API_KEY.");
}

// Default BridgeFlow context fallback
const DEFAULT_CONTEXT = `
BridgeFlow AI Agency offers: Voice AI Agents ($400-2000), WhatsApp Bots ($300-800), 
n8n Automation Workflows ($200-1000), RAG Knowledge Assistants ($500-1500), and ERP systems.
Primary niches: Real Estate Agencies, Private Clinics, Dental Clinics, SMBs in Saudi Arabia and UAE.
Technologies: Vapi, Retell AI, ElevenLabs, n8n, Supabase, Gemini, Claude API, Evolution API (WhatsApp).
Languages: Arabic (Gulf dialect) and English. Based in Riyadh, Saudi Arabia.
Founder: Anasan Rai (Ani) — n8n L1/L2 Certified, Claude 101 Certified, Upwork 5-star rated.
Delivery: 3-7 days for most projects. Demo-first: build a working demo, you only pay if satisfied.
`;

export async function POST(req: Request) {
  try {
    const { question, sessionId, systemPrompt, chunkCount = 5 } = await req.json();

    if (!question || !sessionId) {
      return NextResponse.json({ error: "Missing question or sessionId" }, { status: 400 });
    }

    // Embed the question
    const queryEmbedding = await embedText(question);

    // Search for relevant chunks
    const { data: docs, error } = await supabaseAdmin.rpc("match_rag_documents", {
      query_embedding: `[${queryEmbedding.join(",")}]`,
      match_session_id: sessionId,
      match_count: chunkCount,
      match_threshold: 0.3,
    });

    if (error) {
      console.error("Supabase RPC error:", error);
    }

    let context = "";
    let sources: string[] = [];

    if (docs && docs.length > 0) {
      context = docs.map((d: any) => d.content).join("\n\n---\n\n");
      sources = docs.map((d: any) => {
        const fn = d.metadata?.filename || "Source Chunk";
        return `[${fn}]: "${d.content.substring(0, 150)}..."`;
      });
    } else {
      // Fall back to default BridgeFlow context
      context = DEFAULT_CONTEXT;
    }

    // Build prompt
    const sysPrompt =
      systemPrompt ||
      "You are a helpful AI assistant for BridgeFlow. Answer questions based on the provided context. Be concise and helpful. If the answer is not in the context, say so clearly.";

    const fullPrompt = `${sysPrompt}

CONTEXT:
${context}

QUESTION: ${question}

Answer based on the context above. Be helpful, professional, and concise.`;

    // Generate answer with Gemini — try flash models in order of availability
    let answer = "";
    for (const modelName of ["gemini-2.0-flash", "gemini-2.0-flash-exp", "gemini-1.5-flash", "gemini-pro"]) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(fullPrompt);
        answer = result.response.text();
        break;
      } catch {
        continue;
      }
    }
    if (!answer) {
      answer = "I could not generate an answer. Check the GEMINI_API_KEY configuration.";
    }

    return NextResponse.json({
      answer,
      sources: docs && docs.length > 0 ? sources : [],
      usedDefaultContext: !docs || docs.length === 0,
    });
  } catch (err: any) {
    console.error("RAG query error:", err);
    return NextResponse.json({ error: err.message || "Failed to generate answer" }, { status: 500 });
  }
}
