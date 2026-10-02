import React from "react";
import type { Metadata } from "next";
import Image from "next/image";
import { currentUser } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";

import CompanionSessionClient from "@/components/CompanionSessionClient";
import { getCompanion } from "@/lib/actions/companions.action";
import { getSubjectsColor } from "@/lib/utils";

interface CompanionSessionPageProps {
  params: Promise<{ id: string }>;
}

export const generateMetadata = async ({
  params,
}: CompanionSessionPageProps): Promise<Metadata> => {
  const { id } = await params;

  try {
    const companion = await getCompanion(id);
    return { title: companion ? `${companion.name} – ${companion.topic}` : "Session" };
  } catch {
    return { title: "Session" };
  }
};

const CompanionSession = async ({ params }: CompanionSessionPageProps) => {
  const { id } = await params;
  const companion = await getCompanion(id);
  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  if (!companion) {
    notFound();
  }

  const { name, subject, topic, duration } = companion;

  return (
    <main>
      <article className="flex rounded-border justify-between p-6 max-md:flex-col">
        <div className="flex items-center gap-2">
          <div
            className="size-[72px] flex items-center justify-center rounded-lg max-md:hidden"
            style={{ backgroundColor: getSubjectsColor(subject) }}
          >
            <Image
              src={`/icons/${subject}.svg`}
              alt={subject}
              width={35}
              height={35}
              sizes="35px"
            />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <p className="font-bold text-2xl">{name}</p>
              <div className="subject-badge max-sm:hidden">{subject}</div>
            </div>
            <p className="text-lg">{topic}</p>
          </div>
        </div>
        <div className="items-start text-2xl max-md:hidden">{duration} minutes</div>
      </article>

      <CompanionSessionClient
        {...companion}
        companionId={id}
        userName={user.firstName ?? user.username ?? "Student"}
        userImage={user.imageUrl}
      />
    </main>
  );
};

export default CompanionSession;
