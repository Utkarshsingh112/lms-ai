"use client";
import React from "react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "./ui/select";
import { subjects } from "@/constants";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const SubjectFilter = () => {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const subject = searchParams.get("subject") || "";

    const handleChange = (value: string) => {
        const params = new URLSearchParams(searchParams.toString());

        if (!value || value === "all") {
            params.delete("subject");
        } else {
            params.set("subject", value);
        }
        // A new filter always starts from the first page.
        params.delete("page");

        const queryString = params.toString();
        router.push(queryString ? `${pathname}?${queryString}` : pathname, {
            scroll: false,
        });
    };

    return (
        <Select onValueChange={handleChange} value={subject}>
            <SelectTrigger className="input capitalize" aria-label="Filter by subject">
                <SelectValue placeholder="Subject" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">All subjects</SelectItem>
                {subjects.map((subject) => (
                    <SelectItem key={subject} value={subject} className="capitalize">
                        {subject}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
};

export default SubjectFilter;
