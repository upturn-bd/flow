import React from 'react'

export default function Leave() {
  return (
    <div className="p-4">
      {/* Pending Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between p-3 bg-blue-100 rounded-md">
          <div className='flex space-x-2'>
          <p className="font-bold">Sick Leave</p> 
          <p>
          - Mahir Hossain - [01 Oct - 03 Oct]
          </p>
          </div>
          <div className="flex space-x-2">
            <button className="text-green-500 cursor-pointer">✔</button>
            <button className="text-red-500 cursor-pointer">✖</button>
          </div>
        </div>
        <div className="flex items-center justify-between p-3 bg-blue-100 rounded-md">
          <div className='flex space-x-2'>
          <p className="font-bold">Casual Leave</p> 
          <p>
           - SM Saimul Islam - [06 Oct - 10 Oct]
          </p>
          </div>
          <div className="flex space-x-2">
            <button className="text-green-500 cursor-pointer">✔</button>
            <button className="text-red-500 cursor-pointer">✖</button>
          </div>
        </div>
      </div>

      {/* Processed Section */}
      <h2 className="mt-5 mb-3 text-2xl font-bold text-blue-700">Processed</h2>
      <div className="space-y-2">
        <div className="flex items-center justify-between p-3 bg-green-100 rounded-md">
         <div>
         <span className="font-bold">Sick Leave</span> - Mahir Hossain - [01 Oct - 03 Oct]
         </div>
          <span className="text-green-600 font-semibold">Accepted</span>
        </div>
        <div className="flex items-center justify-between p-3 bg-red-100 rounded-md">
        <div>
        <span className="font-bold">Casual Leave</span> - SM Saimul Islam - [06 Oct - 10 Oct]
        </div>
          <span className="text-red-600 font-semibold">Rejected</span>
        </div>
      </div>
    </div>
  )
}
