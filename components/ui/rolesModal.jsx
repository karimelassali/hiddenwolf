import { useState } from 'react'
import Image from 'next/image'
export function RolesModal({ role }) {
    const wolf = '/assets/images/wolf.png';
    const villager = '/assets/images/villager.png';

  return (
   <div className="fixed z-50 overflow-hidden inset-0 bg-white bg-opacity-50 flex justify-center items-center">
    <div className="bg-white  p-10 max-w-md mx-auto">
        <Image src={role === 'wolf' ? wolf : villager} alt="wolf" width={300} height={300} className="mx-auto rounded-sm mb-10" />
        <p className="text-center text-4xl font-bold">You are:</p>
        <p className="text-center text-6xl font-black">{role}</p>
    </div>
   </div>
  )
}
