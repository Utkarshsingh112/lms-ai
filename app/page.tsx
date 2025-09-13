import React from "react";
import { Button } from "@/components/ui/button";
import CompanionCard from "@/components/CompanionCard";
import CTA from "@/components/CTA";

const Page = () => {
  return (
    <div>
      <h1 >Popular Comapnions</h1>
      <section className="home-section">
        <CompanionCard 
        id="123"
        name="Neura the brainy explorer"
        topic="Neural Network of Brain"
        subject="Science"
        duration={45}
        color="#ffda6e"
        />
        <CompanionCard
         id="456"
        name="Countsy the number wizard"
        topic="Derivatives and integrals"
        subject="Maths"
        duration={30}
        color="#e5d0ff"
        />
        <CompanionCard
         id="789"
        name="Verba the vocabulary builder"
        topic="english literature"
        subject="English"
        duration={30}
        color="#BDE7FF"
        />
      </section>
      <section className="home-section">
        <CompanionCard />
        <CTA />
      </section>
    </div>
  );
};

export default Page;
