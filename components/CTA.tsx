import React from "react";
import Image from "next/image";
import Link from "next/link";

const CTA = () => {
  return (
    <section className="cta-section">
      <div className="cta-badge">Start Learning your way.</div>
      <h2 className="text-3xl font-bold">
        Build and Personalize Learning Companion
      </h2>
      <p>
        Pick a name,subject,voice and personality-and start learning through
        voice conversation that feel natural and fun
      </p>
    <Image
      src="/images/cta.svg"
      alt="Call to action illustration"
      width={362}
      height={232}
      sizes="(max-width: 768px) 80vw, 362px"
    />
    <Link href="/companions/new" className="btn-primary">
      <Image src="/icons/plus.svg" alt="plus" width={12} height={12} sizes="12px" />
      <p> Build a New Companion</p>
    </Link>
    </section>
  );
};

export default CTA;
