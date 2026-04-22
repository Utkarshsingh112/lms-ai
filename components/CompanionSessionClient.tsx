"use client";

import dynamic from "next/dynamic";

import type { CompanionComponentProps } from "@/types/companion";

const CompanionComponent = dynamic(
  () => import("@/components/CompanionComponent"),
  {
    ssr: false,
    loading: () => (
      <section className="rounded-border border border-border/60 p-6 text-sm text-muted-foreground">
        Preparing the session interface...
      </section>
    ),
  }
);

const CompanionSessionClient = (props: CompanionComponentProps) => {
  return <CompanionComponent {...props} />;
};

export default CompanionSessionClient;
