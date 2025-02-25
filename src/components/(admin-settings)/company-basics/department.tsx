import { useState } from "react";

interface Department {
  companyName: string;
  companyCode: string;
  industry: string;
  country: string;
  divisions: string[];
  departments: { name: string; details: string; position: string }[];
}

export default function DepartmentComponent() {
  const [company, setCompany] = useState<Department>({
    companyName: "Unilever Bangladesh Limited",
    companyCode: "Ubl_1979@",
    industry: "",
    country: "Bangladesh",
    divisions: ["Sales", "Marketing", "Operations", "Finance", "HR"],
    departments: [
      { name: "Digital Sales", details: "View Details", position: "View Position" },
      { name: "Inbound Marketing", details: "Add Details", position: "Add Position" },
    ],
  });

  return (
    <div className="my-10">
      <label className="block font-bold text-3xl mb-4">Department</label>
      <div className="space-y-3">
        {company.departments.map((dept, index) => (
          <div key={index} className="grid grid-cols-3 gap-4 items-center">
            <div className="bg-blue-100 text-black px-4 py-2 rounded-lg text-lg font-medium">
              {dept.name}
            </div>
            <button className="bg-gray-200 text-black px-4 py-2 rounded-lg text-lg">
              {dept.details}
            </button>
            <button className="bg-gray-200 text-black px-4 py-2 rounded-lg text-lg">
              {dept.position}
            </button>
          </div>
        ))}
      </div>

      {/* Floating Add Button */}
      <button className="fixed bottom-5 left-5 bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg hover:bg-blue-700 text-xl">
        +
      </button>
      
    </div>
  );
}
