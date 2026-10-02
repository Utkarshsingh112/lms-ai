import { PricingTable } from '@clerk/nextjs'
import React from 'react'

export const metadata = { title: "Pricing" };

const Subscription = () => {
  return (
    <div>
      <PricingTable/>
    </div>
  )
}

export default Subscription