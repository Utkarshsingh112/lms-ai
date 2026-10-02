import React from 'react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import {
  getUserCompanions,
  getUserSessions,
  // getBookmarkedCompanions,
} from "@/lib/actions/companions.action";
import Image from "next/image";
import CompanionsList from "@/components/CompanionsList";

export const metadata = { title: "My Journey" };

const Profile = async() => {
   const user=await currentUser()
   if(!user) redirect('/sign-in');
    const companions = await getUserCompanions(user.id);
  const sessionHistory = await getUserSessions(user.id);
  // const bookmarkedCompanions = await getBookmarkedCompanions(user.id);
  return (
   <main className='min-lg:w-3/4'>
    <section className='flex justify-between gap-4 max-sm:flex-col items-center'>
        <div className="flex gap-4 items-center">
      <Image
        src={user.imageUrl!}
        alt={user.firstName ?? "Your profile photo"}
        width={110}
        height={110}
        className="rounded-full"
        sizes="(max-width: 640px) 28vw, 110px"
        placeholder="blur"
        blurDataURL="data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPScxNicgaGVpZ2h0PScxNic+PHJlY3Qgd2lkdGg9JzE2JyBoZWlnaHQ9JzE2JyBmaWxsPScjZjNlNmVmJy8+PC9zdmc+"
      />
       <div className="flex flex-col gap-2">
            <h1 className="font-bold text-2xl">
              {user.firstName} {user.lastName}
            </h1>
            <p className="text-sm text-muted-foreground">
              {user.emailAddresses[0]?.emailAddress}
            </p>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="border border-black rounded-lg p-3 gap-2 flex flex-col h-fit">
            <div className="flex gap-2 items-center">
              <Image
                src="/icons/check.svg"
                alt=""
                width={22}
                height={22}
                sizes="22px"
              />
              <p className="text-2xl font-bold">{sessionHistory.length}</p>
            </div>
            <div>Lessons completed</div>
          </div>
          <div className="border border-black rounded-lg p-3 gap-2 flex flex-col h-fit">
            <div className="flex gap-2 items-center">
              <Image src="/icons/cap.svg" alt="" width={22} height={22} sizes="22px" />
              <p className="text-2xl font-bold">{companions.length}</p>
            </div>
            <div>Companions created</div>
          </div>
        </div>
        
    </section>
<Accordion type="multiple">
  {/* Recent Sessions */}
  <AccordionItem value="recent">
    <AccordionTrigger className="text-2xl font-bold">
      Recent Sessions
    </AccordionTrigger>
    <AccordionContent>
      <CompanionsList
        title="Recent sessions"
        companions={sessionHistory}
        emptyMessage="No sessions yet. Launch a companion and your completed lessons will show up here."
      />
    </AccordionContent>
  </AccordionItem>

  {/* My Companions */}
  <AccordionItem value="companions">
    <AccordionTrigger className="text-2xl font-bold">
      My companions ({companions.length})
    </AccordionTrigger>
    <AccordionContent>
      <CompanionsList
        title="My Companions"
        companions={companions}
        emptyMessage="You haven't built a companion yet."
        emptyAction={{ href: "/companions/new", label: "Build your first companion" }}
      />
    </AccordionContent>
  </AccordionItem>
</Accordion>

   </main>
  )
}

export default Profile
