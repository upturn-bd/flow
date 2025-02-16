"use client"
import Table from '@/components/(user)/table/table'
import React, { useState } from 'react'



interface NavItem {
  label: string;
}


const navItems: NavItem[] = [
  {
    label: 'Client',
  
  },
  {
    label: 'Leads',
  
  },
  {
    label: 'Employees',
  
  },
];

export default function page() {
  const [activeTab,setTab] = useState(0); 

  return (
    <div className='p-5 container mx-auto'>
      <div className="flex mb-10 w-fit rounded-lg shadow-md ">
       {navItems.map((item,index)=>(
         <button 
         className={`w-70  px-5 text-2xl py-3 first:rounded-l-lg border-r last:border-r-0 border-black last:rounded-r-lg h-full flex items-center justify-center text-center transition-colors duration-300 ${
          activeTab === index ? 'bg-white shadow-md text-blue-900 font-semibold' : 'bg-[#D9D9D9] hover:bg-gray-300'
        }`}
         key={index}
         onClick={()=>setTab(index)}>
          {item.label}
         </button>
       ))}
      </div>
      
      {activeTab === 0 && <div>
        <Table />
        </div>}

        {activeTab === 1 && <div>
        <Table />
        </div>}

        {activeTab === 2 && <div>
        <Table />
        </div>}
      
    </div>
  )
}
