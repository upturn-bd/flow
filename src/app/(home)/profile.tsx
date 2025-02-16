"use client";

import BasicInfo from '@/components/(user)/basic-info/basicinfo';
import Education from '@/components/(user)/education/education';
import Experience from '@/components/(user)/experience/experience';
import PersonalInfo from '@/components/(user)/personal-info/personalinfo';
import React, { useState } from 'react';


interface NavItem {
  label: string;
}

const navItems: NavItem[] = [
  {
    label: 'Basic Information',
   
  },
  {
    label: 'Personal Information',
    
  },
  {
    label: 'Education & Experience',
   
  },
  {
    label: 'Key Performance Indicator',
   
  },
  {
    label: 'Performance Evaluation',
  
  },
];

const TabView = () => {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <section className="overflow-y-scroll mx-20">
      <div className="flex items-center mx-auto w-fit rounded-lg shadow-md ">
        {navItems.map((item, index) => (
          <button
            key={index}
            onClick={() => setActiveTab(index)}
            className={`w-70   px-5 text-2xl py-5 first:rounded-l-lg border-r last:border-r-0 border-black last:rounded-r-lg h-full flex items-center justify-center text-center transition-colors duration-300 ${
              activeTab === index ? 'bg-white shadow-md text-blue-900 font-semibold' : 'bg-[#D9D9D9] hover:bg-gray-300'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="container mx-auto  ">
        {activeTab === 0 && 
        <div>
          <BasicInfo />
        </div>
        }
        {activeTab === 1 && <div>
          <PersonalInfo/>
          </div>}
        {activeTab === 2 && <div>
          <Education/>
          <Experience/>
          </div>}
        {activeTab === 3 && <div>Content for Key Performance Indicator</div>}
        {activeTab === 4 && <div>Content for Performance Evaluation</div>}
      </div>
    </section>
  );
};

export default TabView;