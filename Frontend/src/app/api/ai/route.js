// src/app/api/ai/route.js (App Router style)

import { NextResponse } from "next/server";

export const runtime = "nodejs";

// ✅ Base system message
const SYSTEM_BASE = `
You are an assistant that writes short, social-first copy.
Keep outputs concise, skimmable, and platform-friendly.
Avoid emojis unless asked. Use plain language.
`;

// ✅ Shared helpers
async function callChat(messages) {
  const r = await fetch(`${process.env.AI_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.AI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.AI_MODEL || "gpt-4o-mini",
      temperature: 0.7,
      messages,
    }),
  });

  if (!r.ok) {
    const text = await r.text();
    throw new Error(`AI error: ${r.status} ${text}`);
  }

  const data = await r.json();
  return data.choices?.[0]?.message?.content?.trim() || "";
}

function stripHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+\s/g, " ")
    .trim();
}

function cleanJson(raw) {
  return raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();
}

// ✅ Prompt builders
const styleMap = {
  engaging: "Make it punchier.",
  shorter: "Make it 30% shorter but keep meaning.",
  professional: "Make it crisp and professional.",
  emojis: "Keep meaning but add relevant emojis.",
};

function reelPrompt(topic, tone) {
  return `
Write a 45–60s Reels/TikTok script on "${topic}".
Tone: ${tone}.
Structure with:
- Hook (1–2 lines)
- 3–5 quick bullets
- CTA (1 line)
`.trim();
}

function rewritePrompt(caption, style) {
  const instruction = styleMap[style] || styleMap.engaging;
  return `
Original:
${caption}

Task: ${instruction}
Return only the new caption.
`.trim();
}

function carouselPrompt(source, type = "text") {
  const baseRules = `
- 7–9 slides
- Titles <= 6 words
- Bullets: 1–3 per slide, each <= 12 words
- PURE JSON, no markdown/code fences
`.trim();

  if (type === "visual") {
    return `
You are producing a VISUAL-FIRST Instagram carousel.
${baseRules}
Add a "visual" object per slide:

"visual": {
  "layout": "title-over-image|split-left-text-right-image|full-bleed-image|quote-card|stat-card",
  "palette": ["#hex1","#hex2","#hex3"],
  "bg": "short gradient hint e.g. 'radial purple/blue'",
  "accent": "icon/shape hint e.g. 'sparkles', 'arrow', 'circle-bursts'",
  "image_prompt": "short description of the image/illustration"
}

Return JSON: {"slides":[{"title":"", "bullets":["",""], "hint":"", "visual": {...}}, ...]}

Content:
"""
${source}
"""
`.trim();
  }

  return `
You are producing a TEXT-FIRST Instagram carousel.
${baseRules}

Return JSON: {"slides":[{"title":"", "bullets":["",""], "hint":""}, ...]}

Content:
"""
${source}
"""
`.trim();
}

// ✅ Handler
export async function POST(req) {
  try {
    if (!process.env.AI_API_KEY) {
      return NextResponse.json({ error: "Missing AI_API_KEY" }, { status: 500 });
    }

    const body = await req.json();
    let prompt, content;

    switch (body.action) {
      case "reelScript":
        prompt = reelPrompt(body.topic, body.tone);
        content = await callChat([
          { role: "system", content: SYSTEM_BASE },
          { role: "user", content: prompt },
        ]);
        return NextResponse.json({ ok: true, result: content });

      case "rewriteCaption":
        prompt = rewritePrompt(body.caption, body.style);
        content = await callChat([
          { role: "system", content: SYSTEM_BASE },
          { role: "user", content: prompt },
        ]);
        return NextResponse.json({ ok: true, result: content });

      case "customHook":
        prompt = `
Give 10 hooks for short-form content.
Each ≤12 words.
Return as bullet list.
`.trim();
        content = await callChat([
          { role: "system", content: SYSTEM_BASE },
          { role: "user", content: prompt },
        ]);
        return NextResponse.json({ ok: true, result: content });

      case "carousel": {
        if (!body.source) {
          return NextResponse.json({ error: "Missing source" }, { status: 400 });
        }

        // Fetch + clean HTML if URL passed
        let text = body.source;
        if (/^https?:\/\//i.test(body.source)) {
          const page = await fetch(body.source);
          text = stripHtml(await page.text()).slice(0, 20000);
        }

        const style = body.style === "visual" ? "visual" : "text";
        prompt = carouselPrompt(text, style);

        const raw = await callChat([
          { role: "system", content: SYSTEM_BASE },
          { role: "user", content: prompt },
        ]);

        try {
          const parsed = JSON.parse(cleanJson(raw));
          return NextResponse.json({ ok: true, result: { [style]: parsed } });
        } catch {
          return NextResponse.json({ ok: true, result: raw });
        }
      }

      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (e) {
    return NextResponse.json(
      { error: e.message || "Server error" },
      { status: 500 }
    );
  }
}
