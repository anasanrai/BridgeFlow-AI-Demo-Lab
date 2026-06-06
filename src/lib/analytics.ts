import { supabase } from "./supabase";

export async function logSession(
  agentType: "voice" | "chat" | "rag",
  agentName: string,
  platform: string
) {
  try {
    const { error } = await supabase.from("demo_sessions").insert({
      agent_type: agentType,
      agent_name: agentName,
      platform,
      started_at: new Date().toISOString(),
    });
    if (error) {
      console.error("Error logging session:", error);
    }
  } catch (err) {
    console.error("Catch error logging session:", err);
  }
}
