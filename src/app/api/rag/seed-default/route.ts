import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const BRIDGEFLOW_CONTENT = `
BridgeFlow AI Agency — Services & Capabilities

COMPANY OVERVIEW
BridgeFlow is an AI automation agency specializing in voice AI agents, WhatsApp bots, n8n automation workflows, ERP systems, and Retrieval-Augmented Generation implementations. We serve real estate agencies, private clinics, dental clinics, and SMBs across Saudi Arabia, UAE, UK, and US markets.

VOICE AI AGENTS
Inbound and outbound AI voice agents that answer calls, qualify leads, book appointments, and handle FAQs in Arabic and English.
Use cases: Real estate inbound call handler, clinic appointment setter, outbound cold caller, customer support agent.
Pricing: Setup ranges from SAR 1,500 to 8,000 / $400 to $2,000 one-time setup plus monthly maintenance.
Platforms: Vapi, Retell AI, ElevenLabs.

WHATSAPP AUTOMATION BOTS
AI-powered WhatsApp bots that handle appointments, answer questions, qualify leads, and follow up automatically.
Use cases: Clinic appointment booking via Google Calendar, real estate lead capture and qualification, missed call follow-up within seconds, automated appointment reminders at 24h and 2h.
Pricing: Setup ranges from SAR 1,125 to 3,000 / $300 to $800 one-time setup.

N8N AUTOMATION WORKFLOWS
End-to-end business process automation using n8n connecting CRM, calendar, email, WhatsApp.
Popular workflows: Lead scraper and outreach machine using Google Maps, CRM auto-population from forms, appointment reminder system, social media automation, video content pipeline.
Pricing: SAR 750 to 3,750 / $200 to $1,000 per workflow.

RAG KNOWLEDGE ASSISTANTS
AI agents that answer questions based on your own data — manuals, policies, product catalogs, contracts, FAQs.
Use cases: Real estate FAQ bot from listings database, clinic protocol assistant from SOPs, Islamic legal assistant from curated knowledge base, customer service bot from documentation.
Stack: Supabase pgvector plus Gemini embeddings plus n8n orchestration.
Pricing: Setup ranges from SAR 1,875 to 5,625 / $500 to $1,500 setup plus data ingestion.

ERP AND BUSINESS SYSTEMS
Custom lightweight ERP for clinics and real estate — booking, billing, records, reporting.
Pricing: Custom quote, SAR 7,500 or more / $2,000 or more.

TECHNOLOGY STACK
Automation: n8n self-hosted enterprise-grade.
Voice AI: Vapi, Retell AI, ElevenLabs.
WhatsApp: Evolution API, no Meta verification needed.
AI Models: Gemini 2.5 Flash, Claude API, Groq Llama.
Vector Database: Supabase pgvector.
Frontend: Next.js, Tailwind CSS, Supabase Auth.
Telephony: Twilio.
Lead Generation: Apify Google Maps scraper.

PRIMARY NICHES
Real Estate Agencies: Lead qualification, viewing bookings, follow-up sequences.
Private and Dental Clinics: Appointment booking, reminders, patient triage.
SMBs in Saudi Arabia and UAE: General automation, WhatsApp bots, CRM integration.

LANGUAGES
Arabic Gulf dialect and English. All voice agents and chat bots are bilingual.

DELIVERY TIMELINE
WhatsApp Bot: 2 to 3 days.
Voice Agent: 3 to 5 days.
Full automation workflow: 5 to 7 days.
RAG system: 5 to 10 days depending on data size.

PRICING PHILOSOPHY
Demo-first approach: Build a working demo at no charge. You only pay when you see a working system you are satisfied with. No upfront payment required.

MONTHLY MAINTENANCE
Maintenance and monitoring packages from SAR 375 per month or $100 per month.

FOUNDER
Anasan Rai known as Ani. n8n Level 1 and Level 2 Certified. Claude 101 Certified. 5-star rating on Upwork. Based in Riyadh, Saudi Arabia.

CONTACT
Website: demo.n8ngalaxy.com
Available for Upwork projects and direct hire.
Book a 30-minute discovery call via Calendly, no obligation.
Languages spoken: English, Arabic, Nepali.

FREQUENTLY ASKED QUESTIONS
Do I need Meta verification for WhatsApp bots? No. Evolution API bypasses Meta business verification requirement for development and testing.
Can voice agents speak Arabic? Yes. All agents are bilingual Arabic Gulf dialect and English.
How long does setup take? Most projects live in 3 to 7 days. Complex RAG systems up to 10 days.
Is data secure? All data stored in your own Supabase project. BridgeFlow does not store client data on their servers.
Refund policy? Demo first approach means you only pay when satisfied with the working system.
Monthly retainers available? Yes, maintenance packages from SAR 375 per month.
`;

export async function POST(req: Request) {
  try {
    const { sessionId } = await req.json();

    if (!sessionId) {
      return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
    }

    // Check if default already seeded for this session
    const { count, error: countErr } = await supabaseAdmin
      .from("rag_documents")
      .select("*", { count: "exact", head: true })
      .eq("session_id", sessionId);

    if (countErr) {
      console.error("Error checking seeded documents:", countErr);
    }

    if (count && count > 0) {
      return NextResponse.json({ success: true, alreadySeeded: true });
    }

    // Chunk the content
    function chunkText(text: string, size = 800, overlap = 100): string[] {
      const chunks: string[] = [];
      let start = 0;
      while (start < text.length) {
        const end = Math.min(start + size, text.length);
        chunks.push(text.slice(start, end).trim());
        start += size - overlap;
      }
      return chunks.filter((c) => c.length > 80);
    }

    const chunks = chunkText(BRIDGEFLOW_CONTENT);

    async function embedOne(text: string): Promise<number[]> {
      for (const modelName of ["text-embedding-004", "embedding-001"]) {
        try {
          const m = genAI.getGenerativeModel({ model: modelName });
          const r = await m.embedContent(text);
          return r.embedding.values;
        } catch {
          continue;
        }
      }
      throw new Error("Embedding unavailable");
    }

    // If embedding is unavailable, return success — queries fall back to DEFAULT_CONTEXT
    try {
      await embedOne(chunks[0]); // probe once before processing all
    } catch {
      return NextResponse.json({ success: true, chunks: 0, usingDefaultContext: true });
    }

    const BATCH = 5;
    for (let i = 0; i < chunks.length; i += BATCH) {
      const batch = chunks.slice(i, i + BATCH);
      const embeddings = await Promise.all(batch.map((c) => embedOne(c)));

      const rows = batch.map((content, j) => ({
        session_id: sessionId,
        content,
        metadata: { source: "BridgeFlow Services Default", chunk_index: i + j },
        embedding: `[${embeddings[j].join(",")}]`,
      }));

      const { error } = await supabaseAdmin.from("rag_documents").insert(rows);
      if (error) {
        console.error("Seeder insert error:", error);
        throw error;
      }
    }

    return NextResponse.json({ success: true, chunks: chunks.length });
  } catch (err: any) {
    console.error("Seed error:", err);
    return NextResponse.json({ error: err.message || "Seeding failed" }, { status: 500 });
  }
}
