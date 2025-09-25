import Vapi from "@vapi-ai/web"

const token = process.env.NEXT_PUBLIC_WEB_TOKEN
if (!token) throw new Error("Missing NEXT_PUBLIC_WEB_TOKEN")

export const vapi = new Vapi(token)