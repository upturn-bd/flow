"use client";

import BasicInfo from '@/components/(profile)/basic-info/basicinfo';
import React, { useState } from 'react';

const TabView = () => {
  const [activeTab, setActiveTab] = useState(0);
  const tabs = [
    'Basic Information',
    'Personal Information',
    'Education & Experience',
    'Key Performance Indicator',
    'Performance Evaluation',
  ];

  return (
  <section>
      <div className="">
      <div className="flex bg-gray-200 rounded-lg shadow-md">
        {tabs.map((tab, index) => (
          <button
            key={index}
            className={`flex-1 px-10 py-4 font-semibold transition-colors duration-300 ${
              activeTab === index
                ? 'bg-white shadow-md text-blue-900'
                : 'text-blue-900 hover:bg-gray-300'
            } ${index === 0 ? 'rounded-l-lg' : ''} ${
              index === tabs.length - 1 ? 'rounded-r-lg' : ''
            }`}
            onClick={() => setActiveTab(index)}
          >
            {tab}
          </button>
        ))}
      </div>
    
    </div>
    <div className="mt-5 w-full text-center">
        {activeTab === 0 && 
        <div>
            <BasicInfo />
        </div>}
        {activeTab === 1 && <div>Content for Personal Information</div>}
        {activeTab === 2 && <div>Content for Education & Experience</div>}
        {activeTab === 3 && <div>Content for Key Performance Indicator</div>}
        {activeTab === 4 && <div>Content for Performance Evaluation</div>}
      </div>
  </section>
  );
};

export default TabView;