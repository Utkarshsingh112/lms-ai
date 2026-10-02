import type Vapi from "@vapi-ai/web";

let vapiPromise: Promise<Vapi | null> | null = null;

export const getVapi = async (): Promise<Vapi | null> => {
  if (typeof window === "undefined") {
    return null;
  }

  // Local-only scripted voice session; never active in production builds.
  if (
    process.env.NODE_ENV !== "production" &&
    process.env.NEXT_PUBLIC_MOCK_VAPI === "true"
  ) {
    vapiPromise ??= import("@/lib/vapi.mock").then(({ createMockVapi }) =>
      createMockVapi()
    );
    return vapiPromise;
  }

  const token = process.env.NEXT_PUBLIC_WEB_TOKEN;

  if (!token) {
    console.error("Missing NEXT_PUBLIC_WEB_TOKEN environment variable");
    return null;
  }

  if (!vapiPromise) {
    vapiPromise = import("@vapi-ai/web")
      .then(({ default: VapiClient }) => new VapiClient(token))
      .catch((error) => {
        console.error("Failed to initialize Vapi:", error);
        vapiPromise = null;
        return null;
      });
  }

  return vapiPromise;
};
