// Local UI testing without any real accounts.
//
//   npm run dev:mock            -> http://localhost:3000
//   PORT=3100 npm run dev:mock  -> custom port
//
// Starts a tiny in-memory Supabase REST mock and runs `next dev` with dummy
// Clerk/Supabase/Vapi credentials. Voice sessions are scripted (no microphone
// or Vapi account needed). Signed-in-only pages (My Journey, creating a
// companion) still need a real Clerk key; use /dev/session for the session UI.
import { spawn } from "node:child_process";
import http from "node:http";

const SUPABASE_PORT = Number(process.env.MOCK_SUPABASE_PORT ?? 54321);
const APP_PORT = process.env.PORT ?? "3000";

const subjects = ["maths", "language", "science", "history", "coding", "economics"];
const names = [
  ["Countdown Carl", "Fractions and ratios"],
  ["Lingo Lena", "Everyday Spanish phrases"],
  ["Neura the Brainy Explorer", "Neural networks of the brain"],
  ["Professor Timeline", "The fall of the Roman Empire"],
  ["Codey the Debugger", "JavaScript closures"],
  ["Penny Wise", "How inflation works"],
];
const companions = Array.from({ length: 14 }, (_, i) => ({
  id: `mock-${String(i).padStart(2, "0")}`,
  name: i < 6 ? names[i][0] : `${names[i % 6][0]} ${Math.floor(i / 6) + 1}`,
  subject: subjects[i % 6],
  topic: names[i % 6][1],
  duration: 10 + (i % 5) * 5,
  voice: i % 2 ? "male" : "female",
  style: i % 3 ? "casual" : "formal",
  author: "mock_user",
  created_at: new Date(Date.UTC(2026, 0, 1 + i)).toISOString(),
}));

const unquote = (v) => v.replace(/^"|"$/g, "").replace(/\\(.)/g, "$1");
const likeToRegex = (pattern) =>
  new RegExp(
    "^" +
      unquote(pattern)
        .replace(/[.*+?^${}()|[\]]/g, "\\$&")
        .replace(/\\\\%/g, "\u0000")
        .replace(/%/g, ".*")
        .replace(/\u0000/g, "%") +
      "$",
    "i"
  );

const supabase = http.createServer((req, res) => {
  const url = new URL(req.url, "http://mock");
  res.setHeader("content-type", "application/json");

  if (!url.pathname.endsWith("/companions")) {
    res.end("[]");
    return;
  }

  let rows = [...companions];
  const subject = url.searchParams.get("subject");
  if (subject?.startsWith("ilike.")) {
    const re = likeToRegex(subject.slice(6));
    rows = rows.filter((r) => re.test(r.subject));
  }
  const id = url.searchParams.get("id");
  if (id?.startsWith("eq.")) rows = rows.filter((r) => r.id === id.slice(3));
  const author = url.searchParams.get("author");
  if (author?.startsWith("eq.")) rows = rows.filter((r) => r.author === author.slice(3));
  const or = url.searchParams.get("or");
  if (or) {
    const patterns = [...or.matchAll(/(?:topic|name)\.ilike\.("(?:[^"\\]|\\.)*"|[^,)]*)/g)];
    rows = rows.filter((r) =>
      patterns.some((m) => {
        const re = likeToRegex(m[1]);
        return re.test(r.topic) || re.test(r.name);
      })
    );
  }

  const total = rows.length;
  const offset = Number(url.searchParams.get("offset") ?? 0);
  const limit = Number(url.searchParams.get("limit") ?? total);
  rows = rows.slice(offset, offset + limit);

  res.setHeader("content-range", `${offset}-${offset + rows.length - 1}/${total}`);
  if (req.method === "HEAD") {
    res.end();
    return;
  }
  res.end(JSON.stringify(rows));
});

supabase.listen(SUPABASE_PORT, "127.0.0.1", () => {
  console.log(`[dev-mock] mock Supabase on http://127.0.0.1:${SUPABASE_PORT}`);
});

// A production-style dummy key keeps Clerk from redirecting the browser to a
// (non-existent) development handshake domain; visitors simply appear signed out.
const clerkKey = `pk_live_${Buffer.from("clerk.mock.example.com$").toString("base64")}`;

const next = spawn("npx", ["next", "dev", "--turbopack", "-p", APP_PORT], {
  stdio: "inherit",
  env: {
    ...process.env,
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: clerkKey,
    CLERK_SECRET_KEY: "sk_live_mock_for_local_ui_only",
    NEXT_PUBLIC_SUPABASE_URL: `http://127.0.0.1:${SUPABASE_PORT}`,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "mock-anon-key",
    NEXT_PUBLIC_WEB_TOKEN: "mock-vapi-token",
    NEXT_PUBLIC_MOCK_VAPI: "true",
    CRON_SECRET: "mock-cron-secret",
  },
});

const shutdown = () => {
  supabase.close();
  next.kill("SIGTERM");
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
next.on("exit", (code) => {
  supabase.close();
  process.exit(code ?? 0);
});

console.log(`[dev-mock] app:           http://localhost:${APP_PORT}`);
console.log(`[dev-mock] session demo:  http://localhost:${APP_PORT}/dev/session`);
