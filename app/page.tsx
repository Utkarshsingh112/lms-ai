import React from "react";
import CompanionCard from "@/components/CompanionCard";
import CTA from "@/components/CTA";
import CompanionsList from "@/components/CompanionsList";
import {
  getAllCompanions,
  getRecentSessions,
} from "@/lib/actions/companions.action";
import { getSubjectsColor } from "@/lib/utils";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

const Page = async () => {
  // Independent reads: run them together instead of one after the other.
  const [companions, recentSessionsCompanions] = await Promise.all([
    getAllCompanions({ limit: 3 }),
    getRecentSessions(10),
  ]);

  return (
    <main>
      <h1>Popular Companions</h1>

      <section className="home-section">
        {companions.map((companion) => (
          <CompanionCard
            key={companion.id}
            {...companion}
            color={getSubjectsColor(companion.subject)}
          />
        ))}
      </section>

      <section className="home-section">
        <CompanionsList
          title="Recently completed sessions"
          companions={recentSessionsCompanions}
          emptyMessage="Sign in and finish a session to see your recent lessons here."
          className="w-2/3 max-lg:w-full"
        />
        <CTA />
      </section>
    </main>
  );
};

export default Page;
