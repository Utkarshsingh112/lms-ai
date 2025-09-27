import Vapi from "@vapi-ai/web"

const token = process.env.NEXT_PUBLIC_WEB_TOKEN
if (!token) {
  console.error("Missing NEXT_PUBLIC_WEB_TOKEN environment variable")
  throw new Error("Missing NEXT_PUBLIC_WEB_TOKEN")
}

// Only initialize Vapi in client-side environment
let vapiInstance: Vapi | null = null;

if (typeof window !== 'undefined') {
  try {
    vapiInstance = new Vapi(token);
  } catch (error) {
    console.error('Failed to initialize Vapi:', error);
  }
}

export const vapi = vapiInstance!
