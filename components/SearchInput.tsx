"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";

const SearchInput = () => {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlTopic = searchParams.get("topic") ?? "";
  const [searchQuery, setSearchQuery] = useState(urlTopic);
  // Last value this component wrote to (or read from) the URL.
  const lastSynced = useRef(urlTopic);

  // Follow URL changes made elsewhere (e.g. a "Clear filters" link).
  useEffect(() => {
    if (urlTopic !== lastSynced.current) {
      lastSynced.current = urlTopic;
      setSearchQuery(urlTopic);
    }
  }, [urlTopic]);

  useEffect(() => {
    if (searchQuery === lastSynced.current) {
      return;
    }

    const delayDebounceFn = setTimeout(() => {
      lastSynced.current = searchQuery;

      const params = new URLSearchParams(searchParams.toString());
      if (searchQuery) {
        params.set("topic", searchQuery);
      } else {
        params.delete("topic");
      }
      // A new search always starts from the first page.
      params.delete("page");

      const queryString = params.toString();
      router.push(queryString ? `${pathname}?${queryString}` : pathname, {
        scroll: false,
      });
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, router, searchParams, pathname]);

  return (
    <div className="relative border border-black rounded-lg items-center flex gap-2 px-2 py-1 h-fit">
      <Image src="/icons/search.svg" alt="" width={15} height={15} sizes="15px" />
      <input
        type="search"
        aria-label="Search companions"
        placeholder="search companion..."
        className="outline-none"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
    </div>
  );
};

export default SearchInput;
