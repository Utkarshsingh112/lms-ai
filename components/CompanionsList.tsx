import { cn } from "@/lib/utils";
import Link from "next/link";
import { getSubjectsColor } from "@/lib/utils";

import {
  Table,
  TableBody,
  // TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import React from "react";
import Image from "next/image";
// import { Link } from "lucide-react";
interface CompanionsListProps {
  title?: string;
  companions?: Companion[];
  className?: string;
  emptyMessage?: string;
  emptyAction?: { href: string; label: string };
}
const CompanionsList = ({
  title,
  companions,
  className,
  emptyMessage = "Nothing here yet.",
  emptyAction,
}: CompanionsListProps) => {
  return (
    <article className={cn(`companion-list`, className)}>
      <h2 className="font-bold text-3xl capitalize mb-6">{title}</h2>
      <Table>
        <TableHeader>
          <TableRow className="border-b border-gray-200">
            <TableHead className="text-base font-semibold text-gray-700 w-2/3 py-4">Lessons</TableHead>
            <TableHead className="text-base font-semibold text-gray-700 py-4">Subjects</TableHead>
            <TableHead className="text-base font-semibold text-gray-700 text-right py-4">Duration</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {!companions?.length ? (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={3} className="py-10 text-center">
                <p className="text-base text-muted-foreground">{emptyMessage}</p>
                {emptyAction ? (
                  <Link
                    href={emptyAction.href}
                    className="btn-primary mt-4 inline-flex"
                  >
                    {emptyAction.label}
                  </Link>
                ) : null}
              </TableCell>
            </TableRow>
          ) : null}
          {companions?.map(({ id, subject, name, duration,topic }, index) => (
            <TableRow key={`${id}-${index}`}>
              <TableCell>
                <Link href={`/companions/${id}`}>
                  <div className="flex items-center gap-3">
                    <div className="size-[62px] flex items-center justify-center rounded-lg max-md:hidden" style={{ backgroundColor: getSubjectsColor(subject) }}>
                      <Image
                        src={`/icons/${subject}.svg`}
                        alt=""
                        width={35}
                        height={35}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <p className="font-bold text-xl">{name}</p>
                      <p className="text-base text-muted-foreground">{topic}</p>

                    </div>
                  </div>
                </Link>
              </TableCell>
              <TableCell>
                <div className="subject-badge w-fit max-md:hidden">
                  {subject}
                </div>
                <div className="flex items-center justify-center rounded-lg w-fit p-2 md:hidden" style={{ backgroundColor: getSubjectsColor(subject) }}>
                  <Image
                    src={`/icons/${subject}.svg`}
                    alt={subject}
                    width={18}
                    height={18}
                  />

                </div>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center gap-2 justify-end">
                  <p className="text-lg font-medium">
                    {duration}
                    <span className="max-md:hidden ml-1">mins</span>
                  </p>
                  <Image src="/icons/clock.svg" alt="" width={14} height={14} />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </article>
  );
};

export default CompanionsList;
