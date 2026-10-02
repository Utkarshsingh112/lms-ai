import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import Navitems from './Navitems'
// import { Button } from './ui/button'
import { SignedIn, SignedOut, UserButton, SignInButton } from '@clerk/nextjs';
import { isMockMode } from '@/lib/mock-mode';

const Navbar = () => {
  return (
 <nav className="navbar">
      <Link href="/">
        <div className="flex items-center gap-2.5 cursor-pointer">
          <Image 
            src="/images/logo.svg" 
            alt="LMS-AI home" 
            width={46} 
            height={46} 
          />
        </div>
      </Link>
      <div className="flex items-center gap-8 max-sm:gap-3">
       <Navitems/>
        {isMockMode ? (
          <span className="btn-signin" title="Mock mode: Clerk is disabled">
            Mock user
          </span>
        ) : (
          <>
        <SignedOut>
                    <SignInButton>
                        <button className="btn-signin">Sign In</button>
                    </SignInButton>
                </SignedOut>
                <SignedIn>
                    <UserButton />
                </SignedIn>
          </>
        )}
      </div>
    </nav>
  )
}

export default Navbar