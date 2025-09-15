import React from "react";
import { Button } from "@/components/ui/button";
import CompanionCard from "@/components/CompanionCard";
import CTA from "@/components/CTA";
import CompanionsList from "@/components/CompanionsList";
import { recentSessions } from "@/constants";

const popularCompanions = [
  {
    id: "123",
    name: "Neura the brainy explorer",
    topic: "Neural Network of Brain",
    subject: "Science",
    duration: 45,
    color: "#ffda6e",
  },
  {
    id: "456",
    name: "Countsy the number wizard",
    topic: "Derivatives and integrals",
    subject: "Maths",
    duration: 30,
    color: "#e5d0ff",
  },
  {
    id: "789",
    name: "Verba the vocabulary builder",
    topic: "english literature",
    subject: "English",
    duration: 30,
    color: "#BDE7FF",
  },
];

const Page = () => {
  return (
    <div>
      <h1>Popular Companions</h1>
      <section className="companions-grid">
        {popularCompanions.map((companion) => (
          <CompanionCard key={companion.id} {...companion} />
        ))}
      </section>
      <section className="home-section">
        <CompanionsList 
        title="recently added companions"
        companions={recentSessions}
        className="w-2/3 max-lg:w-full"
        />
        <CTA />
      </section>
    </div>
  );
};

export default Page;
