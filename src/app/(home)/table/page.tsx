"use client"

import Table from '@/components/(user)/table/table';
import React, { useState } from 'react';

interface NavItem {
  label: string;
}

const navItems: NavItem[] = [
  { label: 'Client' },
  { label: 'Leads' },
  { label: 'Employees' },
];

const Page: React.FC = () => {
  const [activeTab, setTab] = useState<number>(0);

  return (
    <div >
      <div className="flex mb-10 w-fit rounded-lg shadow-md">
        {navItems.map((item, index) => (
          <button
            key={index}
            className={`w-70 px-5 text-2xl py-3 first:rounded-l-lg border-r last:border-r-0 border-black last:rounded-r-lg h-full flex items-center justify-center text-center transition-colors duration-300 ${
              activeTab === index ? 'bg-white shadow-md text-blue-900 font-semibold' : 'bg-[#D9D9D9] hover:bg-gray-300'
            }`}
            onClick={() => setTab(index)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div>
      {
        activeTab === 0 && <Table />
      }
      </div>
      <div>
      {
        activeTab === 1 && <Table />
      }
      </div>
      <div>
      {
        activeTab === 2 && <Table />
      }
      </div>
    </div>
  );
};

export default Page;