import { notFound } from "next/navigation";

import CompanionSessionClient from "@/components/CompanionSessionClient";
import { subjects } from "@/constants";
import type { PageSearchParams } from "@/types/companion";

// Local-only preview of the session screen with mock user data. Pair it with
// `npm run dev:mock`, which turns on the scripted Vapi session. Returns 404 in
// production builds.
const DevSessionPreview = async ({ searchParams }: PageSearchParams) => {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  const params = await searchParams;
  const requested = Array.isArray(params.subject)
    ? params.subject[0]
    : params.subject;
  const subject = requested && subjects.includes(requested) ? requested : "science";

  return (
    <main>
      <p className="text-sm text-muted-foreground">
        Dev preview — try{" "}
        {subjects.map((name) => (
          <a key={name} href={`?subject=${name}`} className="mr-2 underline">
            {name}
          </a>
        ))}
      </p>
      <CompanionSessionClient
        companionId="dev-preview"
        subject={subject}
        topic="how photosynthesis powers life on Earth"
        name="Neura the Brainy Explorer"
        userName="Alex"
        userImage="/images/logo.svg"
        voice="female"
        style="casual"
        duration={15}
      />
    </main>
  );
};

export default DevSessionPreview;
