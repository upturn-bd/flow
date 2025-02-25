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
    ],
  });

  const [newDept, setNewDept] = useState({ name: "", details: "View Details", position: "View Position" });
  const [showInput, setShowInput] = useState(false);

  const handleAddDepartment = () => {
    if (newDept.name.trim()) {
      setCompany((prev) => ({
        ...prev,
        departments: [...prev.departments, newDept],
      }));
      setNewDept({ name: "", details: "View Details", position: "View Position" });
      setShowInput(false);
    }
  };

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

      {/* Input field to add new department */}
      {showInput && (
        <div className="mt-4 flex gap-3 items-center">
          <input
            type="text"
            className="border px-4 py-2 rounded-lg text-lg"
            placeholder="Department Name"
            value={newDept.name}
            onChange={(e) => setNewDept({ ...newDept, name: e.target.value })}
          />
          <button
            onClick={handleAddDepartment}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-lg hover:bg-green-600"
          >
            Add
          </button>
          <button    
            onClick={() => setShowInput(false)}
            className="bg-red-600 text-white px-4 py-2 rounded-lg text-lg hover:bg-red-700"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Floating Add Button */}
      <button
        onClick={() => setShowInput(true)}
        className="w-12 h-12 flex items-center justify-center bg-blue-600 text-white rounded-full hover:bg-blue-700 text-2xl shadow-lg my-5"
      >
        +
      </button>
    </div>
  );
}