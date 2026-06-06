import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdf-parse"],
  images: {
    domains: [],
  },
  // Ensure public env vars are mapped correctly
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_VAPI_PUBLIC_KEY: process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY,
    NEXT_PUBLIC_VAPI_ASSISTANT_ID_REAL_ESTATE: process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID_REAL_ESTATE,
    NEXT_PUBLIC_RETELL_AGENT_ID: process.env.NEXT_PUBLIC_RETELL_AGENT_ID,
    NEXT_PUBLIC_ELEVENLABS_AGENT_ID: process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID,
  },
};

export default nextConfig;
