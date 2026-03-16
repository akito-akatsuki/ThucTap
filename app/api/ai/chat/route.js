import OpenAI from "openai";

/* ========================
CHAT RATE LIMIT
======================== */

let lastChat = 0;
const CHAT_COOLDOWN = 3000; // 3 seconds

const client = new OpenAI({
  baseURL: "https://api.groq.com/openai/v1",
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(req) {
  const { message } = await req.json();

  const now = Date.now();

  if (now - lastChat < CHAT_COOLDOWN) {
    return Response.json({
      reply: "Please wait a moment before sending another message.",
    });
  }

  lastChat = now;

  const completion = await client.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "system",
        content: "You are an inventory assistant AI.",
      },
      {
        role: "user",
        content: message,
      },
    ],
  });

  return Response.json({
    reply: completion.choices[0].message.content,
  });
}
