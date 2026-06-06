import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

function chunkText(text: string, chunkSize = 800, overlap = 100): string[] {
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    chunks.push(text.slice(start, end).trim());
    start += chunkSize - overlap;
  }
  return chunks.filter((c) => c.length > 50);
}

async function embedText(text: string): Promise<number[]> {
  // text-embedding-004 requires v1 API; embedding-001 is stable on v1beta
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

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const sessionId = formData.get("sessionId") as string;

    if (!file || !sessionId) {
      return NextResponse.json({ error: "Missing file or sessionId" }, { status: 400 });
    }

    // Read file content
    let text = "";
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    if (file.name.endsWith(".pdf")) {
      // Dynamic import keeps pdf-parse out of the client bundle (see serverExternalPackages in next.config.ts)
      const pdfModule = await import("pdf-parse");
      const pdfParse = (pdfModule as any).default ?? pdfModule;
      const parsed = await pdfParse(buffer);
      text = parsed.text;
    } else {
      text = buffer.toString("utf-8");
    }

    if (!text || text.trim().length < 50) {
      return NextResponse.json({ error: "Could not extract text from file" }, { status: 400 });
    }

    // Delete old session data
    await supabaseAdmin.from("rag_documents").delete().eq("session_id", sessionId);

    // Chunk text
    const chunks = chunkText(text);
    if (chunks.length === 0) {
      return NextResponse.json({ error: "No text chunks generated from file." }, { status: 400 });
    }

    let indexed = 0;

    // Embed and store each chunk in batches to avoid rate limits
    const BATCH_SIZE = 5;
    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
      const batch = chunks.slice(i, i + BATCH_SIZE);
      const embeddings = await Promise.all(batch.map((c) => embedText(c)));

      const rows = batch.map((content, j) => ({
        session_id: sessionId,
        content,
        metadata: {
          filename: file.name,
          chunk_index: i + j,
          total_chunks: chunks.length,
        },
        embedding: `[${embeddings[j].join(",")}]`,
      }));

      const { error } = await supabaseAdmin.from("rag_documents").insert(rows);
      if (error) {
        console.error("Supabase insert error:", error);
        throw error;
      }
      indexed += batch.length;
    }

    return NextResponse.json({
      success: true,
      chunks: indexed,
      filename: file.name,
    });
  } catch (err: any) {
    console.error("RAG ingest error:", err);
    return NextResponse.json({ error: err.message || "Failed to process file" }, { status: 500 });
  }
}
