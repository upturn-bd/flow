import { useState } from "react";

interface Department {
  name: string;
  details?: string;
  position?: string;
}

export default function DepartmentComponent() {
  const [company, setCompany] = useState({
    companyName: "Unilever Bangladesh Limited",
    companyCode: "Ubl_1979@",
    industry: "",
    country: "Bangladesh",
    divisions: ["Sales", "Marketing", "Operations", "Finance", "HR"],
    departments: [
      { name: "Digital Sales" },
      { name: "Marketing" },
    ],
  });

  const [showInput, setShowInput] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedDept, setSelectedDept] = useState<Department | null>(null);

  const [newDept, setNewDept] = useState({
    name: "",
    details: "",
    position: "",
  });

  const handleAddDepartment = () => {
    if (newDept.name.trim()) {
      setCompany((prev) => ({
        ...prev,
        departments: [...prev.departments, { ...newDept }],
      }));
      setNewDept({ name: "", details: "", position: "" });
      setShowInput(false);
    }
  };

  const handleOpenModal = (dept: Department) => {
    setSelectedDept(dept);
    setShowModal(true);
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
            <button
              onClick={() => handleOpenModal(dept)}
              className="bg-gray-200 text-black px-4 py-2 rounded-lg text-lg"
            >
              {dept.details ? "View Details" : "Add Details"}
            </button>
            <button
              onClick={() => handleOpenModal(dept)}
              className="bg-gray-200 text-black px-4 py-2 rounded-lg text-lg"
            >
              {dept.position ? "View Position" : "Add Position"}
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

      {/* Modal Window */}
      {showModal && selectedDept && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h2 className="text-xl font-bold mb-4">{selectedDept.name}</h2>
            <p className="text-gray-700">
              {selectedDept.details ? `Details: ${selectedDept.details}` : "No details available"}
            </p>
            <p className="text-gray-700">
              {selectedDept.position ? `Position: ${selectedDept.position}` : "No position available"}
            </p>
            <button
              onClick={() => setShowModal(false)}
              className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
