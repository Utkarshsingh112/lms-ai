import React from "react";
import { getAllCompanions } from "@/lib/actions/companions.action";
import CompanionCard from "@/components/CompanionCard";
import { getSubjectsColor } from "@/lib/utils";
import SearchInput from "@/components/SearchInput";
import SubjectFilter from "@/components/SubjectFilter";
import type { PageSearchParams } from "@/types/companion";

const Companionslibrary = async ({ searchParams }: PageSearchParams) => {
  const filters = await searchParams;
  const subject = Array.isArray(filters.subject)
    ? filters.subject[0]
    : filters.subject ?? "";
  const topic = Array.isArray(filters.topic)
    ? filters.topic[0]
    : filters.topic ?? "";

  const companions = await getAllCompanions({ subject, topic });
  return(
     <main>
            <section className="flex justify-between gap-4 max-sm:flex-col">
                <h1>Companion Library</h1>
                <div className="flex gap-4">
                    <SearchInput/>
                    <SubjectFilter/>
                </div>
            </section>
            <section className="companions-grid  ">
                {companions.map((companion) => (
                    <CompanionCard
                        key={companion.id}
                        {...companion}
                        color={getSubjectsColor(companion.subject)}
                    />
                ))}
            </section>
        </main>
  )

};

export default Companionslibrary;
