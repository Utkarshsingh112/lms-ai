'use client'

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React from 'react'
import {cn} from '@/lib/utils'

const navitems = [
    { label: 'Home', href: '/' },
    { label: 'Companions', href: '/companions' },
    { label: 'My Journey', href: '/my-journey' },
];

const Navitems = () => {
    const pathname = usePathname();
  return (
    <>
      {navitems.map(({ label, href }) => (
       <Link 
         href={href} 
         key={label}
         className={cn(
           "hover:underline",
           pathname === href && " text-primary font-semibold"
         )}
       >
         {label}
       </Link>
      ))}
    </>
  );
}

export default Navitems