import { SOURCES } from "../../../lib/sources";

export const maxDuration = 60;

const SYSTEM = `You are Aria, an AI health information guide. You give general, educational health information in plain language. You are not a doctor and you never diagnose or prescribe.

Rules:
- Always use web search before answering, and base your answer only on what the approved sources say. If they don't cover the question, say so plainly instead of guessing.
- Structure answers as: a short direct answer, what commonly causes or helps, simple self-care, and when to see a doctor.
- If symptoms could be an emergency (chest pain, trouble breathing, stroke signs, severe bleeding, overdose, thoughts of self-harm), start by telling the person to call 911 or their local emergency number now. For thoughts of suicide, also mention calling or texting 988 in the US or Canada. Be warm and calm.
- Do not give personal medication doses. Point to the product label, a pharmacist, or a doctor.
- Write plain text only: no markdown, no asterisks, no headings. Use short paragraphs and "-" for lists. Keep answers under 250 words.`;

const EMERGENCY = /chest pain|can'?t breathe|cannot breathe|trouble breathing|short of breath|stroke|overdose|suicid|kill myself|end my life|self.?harm|severe bleeding|unconscious|seizure|anaphyla/i;

// Basic per-IP limit. In-memory, so it is best-effort on serverless.
const hits = new Map();
function limited(ip) {
  const now = Date.now();
  const max = Number(process.env.RATE_LIMIT_PER_HOUR || 20);
  if (hits.size > 5000) hits.clear();
  const recent = (hits.get(ip) || []).filter((t) => now - t < 3600000);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > max;
}

const err = (error, status) => Response.json({ error }, { status });

export async function POST(req) {
  if (!process.env.ANTHROPIC_API_KEY) return err("Server is missing its API key.", 500);
  const ip = (req.headers.get("x-forwarded-for") || "anon").split(",")[0].trim();
  if (limited(ip)) return err("You've reached the hourly question limit. Please try again later.", 429);

  let body;
  try { body = await req.json(); } catch { return err("Bad request.", 400); }

  const messages = (Array.isArray(body.messages) ? body.messages : [])
    .slice(-8)
    .map((m) => ({ role: m.role === "assistant" ? "assistant" : "user", content: String(m.content || "").slice(0, 1500) }));
  while (messages[0] && messages[0].role === "assistant") messages.shift();
  const last = messages[messages.length - 1];
  if (!last || last.role !== "user" || !last.content.trim()) return err("Please type a question.", 400);

  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || "claude-haiku-5-5",
      max_tokens: 900,
      system: SYSTEM,
      messages,
      tools: [{
        type: "web_search_20250305",
        name: "web_search",
        max_uses: 3,
        allowed_domains: SOURCES.map((s) => s.domain),
      }],
    }),
  });
  if (!r.ok) {
    console.error("Anthropic error", r.status, await r.text());
    return err("Aria is unavailable right now. Please try again shortly.", 502);
  }

  const data = await r.json();
  let reply = "";
  const seen = new Map();
  for (const b of data.content || []) {
    if (b.type !== "text") continue;
    reply += b.text;
    for (const c of b.citations || []) if (c.url && !seen.has(c.url)) seen.set(c.url, c.title || c.url);
  }
  return Response.json({
    reply: reply.trim() || "I couldn't find that in my approved sources. Please ask a clinician or pharmacist.",
    sources: [...seen].map(([url, title]) => ({ url, title })),
    emergency: EMERGENCY.test(last.content),
  });
}
