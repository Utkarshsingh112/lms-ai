import React from "react";
import { getCompanionsPage } from "@/lib/actions/companions.action";
import CompanionCard from "@/components/CompanionCard";
import { getSubjectsColor } from "@/lib/utils";
import SearchInput from "@/components/SearchInput";
import SubjectFilter from "@/components/SubjectFilter";
import type { PageSearchParams } from "@/types/companion";
import Link from "next/link";

export const metadata = { title: "Companion Library" };

const PAGE_SIZE = 9;

const Companionslibrary = async ({ searchParams }: PageSearchParams) => {
  const filters = await searchParams;
  const subject = Array.isArray(filters.subject)
    ? filters.subject[0]
    : filters.subject ?? "";
  const topic = Array.isArray(filters.topic)
    ? filters.topic[0]
    : filters.topic ?? "";

  const rawPage = Number(
    Array.isArray(filters.page) ? filters.page[0] : filters.page
  );
  const page = Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1;

  const { companions, hasMore } = await getCompanionsPage({
    subject,
    topic,
    page,
    limit: PAGE_SIZE,
  });

  const pageHref = (target: number) => {
    const params = new URLSearchParams();
    if (subject) params.set("subject", subject);
    if (topic) params.set("topic", topic);
    if (target > 1) params.set("page", String(target));
    const qs = params.toString();
    return qs ? `/companions?${qs}` : "/companions";
  };
  return(
     <main>
            <section className="flex justify-between gap-4 max-sm:flex-col">
                <h1>Companion Library</h1>
                <div className="flex gap-4">
                    <SearchInput/>
                    <SubjectFilter/>
                </div>
            </section>
            {companions.length === 0 && page > 1 ? (
                <section className="flex flex-col items-center gap-4 py-16 text-center">
                    <p className="text-lg text-muted-foreground">
                        There is nothing on this page.
                    </p>
                    <Link href={pageHref(1)} className="btn-primary">
                        Back to the first page
                    </Link>
                </section>
            ) : companions.length === 0 ? (
                <section className="flex flex-col items-center gap-4 py-16 text-center">
                    <p className="text-lg text-muted-foreground">
                        {subject || topic
                            ? "No companions match your search."
                            : "No companions yet. Be the first to build one."}
                    </p>
                    <Link
                        href={subject || topic ? "/companions" : "/companions/new"}
                        className="btn-primary"
                    >
                        {subject || topic ? "Clear filters" : "Build a companion"}
                    </Link>
                </section>
            ) : null}
            <section className="companions-grid  ">
                {companions.map((companion) => (
                    <CompanionCard
                        key={companion.id}
                        {...companion}
                        color={getSubjectsColor(companion.subject)}
                    />
                ))}
            </section>
            {page > 1 || hasMore ? (
                <nav
                    aria-label="Pagination"
                    className="flex items-center justify-center gap-4 pb-12"
                >
                    {page > 1 ? (
                        <Link href={pageHref(page - 1)} className="btn-signin">
                            Previous
                        </Link>
                    ) : null}
                    <span className="text-sm text-muted-foreground">Page {page}</span>
                    {hasMore ? (
                        <Link href={pageHref(page + 1)} className="btn-primary">
                            Next
                        </Link>
                    ) : null}
                </nav>
            ) : null}
        </main>
  )

};

export default Companionslibrary;
