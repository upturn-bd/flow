import { useState } from "react";
import Department from "./department";

interface CompanyInfo {
  companyName: string;
  companyCode: string;
  industry: string;
  country: string;
  divisions: string[];
  departments: { name: string; details: string; position: string }[];
}

export default function CompanyBasics() {
  const [company, setCompany] = useState<CompanyInfo>({
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

  const [newDivision, setNewDivision] = useState("");
  const [showAddDivision, setShowAddDivision] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setCompany({ ...company, [e.target.name]: e.target.value });
  };

  const addDivision = () => {
    if (newDivision.trim() && !company.divisions.includes(newDivision)) {
      setCompany({ ...company, divisions: [...company.divisions, newDivision] });
      setNewDivision("");
      setShowAddDivision(false);
    }
  };

  const removeDivision = (division: string) => {
    setCompany({
      ...company,
      divisions: company.divisions.filter((div) => div !== division),
    });
  };

  return (
    <div className="p-6">
      <h2 className="text-3xl font-semibold text-[#1D65E9] mb-6">Step 1: Company Basics</h2>
      
      {/* Company Fields */}
      <div className="grid gap-4 mb-6">
        {/* Company Name */}
        <div className="flex items-center gap-4">
          <label className="block w-52 text-[#002568] font-semibold text-2xl">Company Name</label>
          <input
            type="text"
            name="companyName"
            value={company.companyName}
            onChange={handleChange}
            className="pl-5 bg-[#E3F3FF] text-2xl p-1 rounded w-[400px]"
          />
        </div>

        {/* Company Code */}
        <div className="flex items-center gap-4">
          <label className="block w-52 text-[#002568] font-semibold text-2xl">Company Code</label>
          <input
            type="text"
            name="companyCode"
            value={company.companyCode}
            onChange={handleChange}
            className="pl-5 bg-[#E3F3FF] text-2xl p-1 rounded w-[400px]"
          />
        </div>

        {/* Industry */}
        <div className="flex items-center gap-4">
          <label className="block w-52 text-[#002568] font-semibold text-2xl">Industry</label>
          <select
            name="industry"
            value={company.industry}
            onChange={handleChange}
            className="pl-5 bg-[#E3F3FF] text-2xl p-1 rounded w-[400px] h-[48px]"
          >
            <option value="">Select Industry</option>
            <option value="Technology">Technology</option>
            <option value="Finance">Finance</option>
            <option value="Healthcare">Healthcare</option>
          </select>
        </div>

        {/* Country */}
        <div className="flex items-center gap-4">
          <label className="block w-52 text-[#002568] font-semibold text-2xl">Country</label>
          <input
            type="text"
            name="country"
            value={company.country}
            onChange={handleChange}
            className="pl-5 bg-[#E3F3FF] text-2xl p-1 rounded w-[400px]"
          />
        </div>

        {/* Divisions Section */}
        <div className="flex items-center gap-4">
          <label className="block w-52 text-[#002568] font-semibold text-2xl">Divisions</label>
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              {company.divisions.map((div, index) => (
                <span
                  key={index}
                  className="bg-blue-100  px-3 py-1 rounded-full flex items-center"
                >
                  {div}
                  <button
                    onClick={() => removeDivision(div)}
                    className="ml-2 text-blue-800 font-bold hover:text-blue-600"
                  >
                    ×
                  </button>
                </span>
              ))}
              {/* Toggleable Add Division Input */}
              {showAddDivision ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newDivision}
                    onChange={(e) => setNewDivision(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addDivision()}
                    className="border p-2 rounded text-2xl w-[300px]"
                    placeholder="Enter division name"
                    autoFocus
                  />
                  <button
                    onClick={addDivision}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-2xl"
                  >
                    Add
                  </button>
                  <button
                    onClick={() => {
                      setShowAddDivision(false);
                      setNewDivision("");
                    }}
                    className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300 text-2xl"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowAddDivision(true)}
                  className="w-12 h-12 flex items-center justify-center bg-blue-600 text-white rounded-full hover:bg-blue-700 text-2xl shadow-lg"
                >
                  +
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Department Section */}
      {/* <div className="mb-6">
        <label className="block font-semibold mb-2 text-2xl">Department</label>
        <div className="space-y-2">
          {company.departments.map((dept, index) => (
            <div
              key={index}
              className="flex justify-between items-center bg-gray-50 p-3 rounded-lg"
            >
              <span className="font-medium text-xl">{dept.name}</span>
              <div className="flex gap-2">
                <button className="bg-blue-100 text-blue-800 px-3 py-1 rounded hover:bg-blue-200 text-xl">
                  {dept.details}
                </button>
                <button className="bg-blue-100 text-blue-800 px-3 py-1 rounded hover:bg-blue-200 text-xl">
                  {dept.position}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div> */}
      <Department/>

      {/* Proceed Button */}
      <div className="flex justify-end">
      <button className="bg-yellow-400 text-white px-4 py-2 rounded-xl hover:bg-yellow-500 text-2xl ">
        Proceed ▶
      </button>
      </div>
    </div>
  );
}