import React from 'react'
import Image from 'next/image'
// import { Link2Off } from 'lucide-react'
import Link from 'next/link'
import Navitems from './Navitems'

const Navbar = () => {
  return (
 <nav className="navbar">
      <Link href="/">
        <div className="flex items-center gap-2.5 cursor-pointer">
          <Image 
            src="/images/logo.svg" 
            alt="logo" 
            width={46} 
            height={46} 
          />
        </div>
      </Link>
      <div className="flex items-center gap-8">
       <Navitems/>
        <p>Sign in</p>

      </div>
    </nav>
  )
}

export default Navbar