# BridgeFlow AI Demo Lab

An interactive, live showcase dashboard where potential clients can test voice agents (Vapi, Retell, ElevenLabs), chat bots (n8n webhooks), and RAG systems (Gemini & Supabase pgvector) on-demand. 

No login required. Built with Next.js 15, TypeScript, Tailwind CSS v4, and Framer Motion.

---

## Environment Variables Configuration

Create a `.env.local` file in the root directory. Below is the checklist of required environment variables, classified by access scope:

| Variable Name | Description | Scope / Safety |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project endpoint | Safe (Public Client) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous public key | Safe (Public Client) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role admin key | **Secret (Server Only)** |
| `GEMINI_API_KEY` | Google Gemini API key | **Secret (Server Only)** |
| `GROQ_API_KEY` | Groq console API key | **Secret (Server Only)** |
| `NEXT_PUBLIC_VAPI_PUBLIC_KEY` | Vapi Web SDK public token | Safe (Public Client) |
| `NEXT_PUBLIC_VAPI_ASSISTANT_ID_REAL_ESTATE` | Vapi assistant ID for lead qualification | Safe (Public Client) |
| `RETELL_API_KEY` | Retell console API key | **Secret (Server Only)** |
| `NEXT_PUBLIC_RETELL_AGENT_ID` | Retell agent identifier | Safe (Public Client) |
| `ELEVENLABS_API_KEY` | ElevenLabs developer key | **Secret (Server Only)** |
| `NEXT_PUBLIC_ELEVENLABS_AGENT_ID` | ElevenLabs agent identifier | Safe (Public Client) |
| `N8N_WEBHOOK_ISLAMIC_BOT` | n8n WhatsApp workflow trigger | **Secret (Server Only)** |
| `N8N_WEBHOOK_CLINIC_BOT` | n8n Appointment booking workflow trigger | **Secret (Server Only)** |
| `N8N_WEBHOOK_AXIS_AGENT` | n8n AXIS Command workflow trigger | **Secret (Server Only)** |

---

## Supabase Schema Setup

Execute the following SQL commands in your Supabase SQL Editor before initiating tests. This configures the `vector` extension, sets up similarity indexing, creates the RPC match function, and boots up analytics logs:

```sql
-- 1. Enable pgvector
create extension if not exists vector;

-- 2. RAG documents table
create table if not exists rag_documents (
  id bigserial primary key,
  session_id text not null,
  content text not null,
  metadata jsonb default '{}',
  embedding vector(768),
  created_at timestamptz default now()
);

-- 3. Index for fast cosine similarity search
create index if not exists rag_documents_embedding_idx 
  on rag_documents using hnsw (embedding vector_cosine_ops)
  with (m = 16, ef_construction = 64);

-- 4. Match documents function
create or replace function match_rag_documents(
  query_embedding vector(768),
  match_session_id text,
  match_count int default 5,
  match_threshold float default 0.3
)
returns table (
  id bigint,
  content text,
  metadata jsonb,
  similarity float
)
language sql stable
as $$
  select
    id,
    content,
    metadata,
    1 - (embedding <=> query_embedding) as similarity
  from rag_documents
  where session_id = match_session_id
    and 1 - (embedding <=> query_embedding) > match_threshold
  order by embedding <=> query_embedding
  limit match_count;
$$;

-- 5. Session analytics table
create table if not exists demo_sessions (
  id bigserial primary key,
  agent_type text not null, -- 'voice' | 'chat' | 'rag'
  agent_name text not null,
  platform text, -- 'vapi' | 'retell' | 'elevenlabs' | 'n8n' | 'rag'
  started_at timestamptz default now(),
  ended_at timestamptz,
  metadata jsonb default '{}'
);
```

---

## How to Add New Agents

To register a new agent on the dashboard, update the respective tab file under `src/components/tabs/`:

### 1. Adding a Voice Agent
Open [VoiceTab.tsx](file:///Users/anasanrai/BridgeFlow_AI_Demo_Lab/src/components/tabs/VoiceTab.tsx):
- Update `voiceAgents` array with a new configuration object:
  ```typescript
  {
    key: "my-new-voice",
    name: "Customer Outreach Agent",
    platform: "vapi", // or 'retell' | 'elevenlabs'
    agentId: process.env.NEXT_PUBLIC_VAPI_NEW_AGENT_ID || "",
    description: "Inbound and outbound agent for qualification.",
    tags: ["Outreach", "Sales", "Vapi"],
  }
  ```
- Add default system prompts and first messages to `DEFAULT_VOICE_PARAMS`.

### 2. Adding a Chat Agent
Open [ChatTab.tsx](file:///Users/anasanrai/BridgeFlow_AI_Demo_Lab/src/components/tabs/ChatTab.tsx):
- Update `chatAgents` array:
  ```typescript
  {
    key: "new-chat-bot",
    name: "HR Recruiter Assistant",
    platform: "n8n",
    description: "Interviews candidates and schedules followups.",
    tags: ["HR", "Recruitment", "n8n"],
  }
  ```
- Map the agent key inside `/api/chat/proxy/route.ts` to its environment webhook endpoint.
- Provide default settings in `DEFAULT_CHAT_PARAMS`.

---

## Vercel Deployment

1. Make sure all environment variables are added under project settings in Vercel.
2. The serverless functions are configured using `vercel.json` to allocate higher resources for embedding tasks:
   - Ingestion route: `maxDuration` = 60s, `memory` = 1GB.
3. Deploy directly using Vercel CLI or via Github Action integration:
   ```bash
   vercel --prod
   ```

---

## Pre-Launch Credentials Checklist

Before going live on `demo.n8ngalaxy.com`, ensure the following placeholders are rotated/replaced with your own production instances:
- [ ] `RETELL_API_KEY` (replace development credential with production inbound/outbound setup)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` (rotate keys to restrict access if shared publicly)
- [ ] `ELEVENLABS_API_KEY` & `NEXT_PUBLIC_ELEVENLABS_AGENT_ID` (swap with your specific voice configurations)
- [ ] Update **Calendly Links** inside [NavBar.tsx](file:///Users/anasanrai/BridgeFlow_AI_Demo_Lab/src/components/NavBar.tsx) and [page.tsx](file:///Users/anasanrai/BridgeFlow_AI_Demo_Lab/src/app/page.tsx) to match your sales funnel booking link.
