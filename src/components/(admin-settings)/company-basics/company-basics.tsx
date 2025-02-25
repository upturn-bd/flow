import { useState } from "react";

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setCompany({ ...company, [e.target.name]: e.target.value });
  };

  const addDivision = () => {
    if (newDivision.trim() && !company.divisions.includes(newDivision)) {
      setCompany({ ...company, divisions: [...company.divisions, newDivision] });
      setNewDivision("");
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
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Step 1: Company Basics</h2>
      
      {/* Company Fields */}
      <div className="grid gap-4 mb-6">
        {/* Company Name */}
        <div className="flex items-center gap-4">
          <label className="block font-semibold w-32">Company Name</label>
          <input
            type="text"
            name="companyName"
            value={company.companyName}
            onChange={handleChange}
            className="border p-2 rounded flex-grow"
          />
        </div>

        {/* Company Code */}
        <div className="flex items-center gap-4">
          <label className="block font-semibold w-32">Company Code</label>
          <input
            type="text"
            name="companyCode"
            value={company.companyCode}
            onChange={handleChange}
            className="border p-2 rounded flex-grow"
          />
        </div>

        {/* Industry */}
        <div className="flex items-center gap-4">
          <label className="block font-semibold w-32">Industry</label>
          <select
            name="industry"
            value={company.industry}
            onChange={handleChange}
            className="border p-2 rounded flex-grow"
          >
            <option value="">Select Industry</option>
            <option value="Technology">Technology</option>
            <option value="Finance">Finance</option>
            <option value="Healthcare">Healthcare</option>
          </select>
        </div>

        {/* Country */}
        <div className="flex items-center gap-4">
          <label className="block font-semibold w-32">Country</label>
          <input
            type="text"
            name="country"
            value={company.country}
            onChange={handleChange}
            className="border p-2 rounded flex-grow"
          />
        </div>

        {/* Divisions */}
        <div className="flex items-center gap-4">
          <label className="block font-semibold w-32">Divisions</label>
          <div className="flex-grow space-y-2">
            {/* Division Tags */}
            <div className="flex flex-wrap gap-2">
              {company.divisions.map((div, index) => (
                <span
                  key={index}
                  className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full flex items-center"
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
            </div>

            {/* Add Division Input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newDivision}
                onChange={(e) => setNewDivision(e.target.value)}
                className="border p-2 rounded flex-grow"
                placeholder="Add new division"
              />
              <button
                onClick={addDivision}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                +
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Department Section */}
      <div className="mb-6">
        <label className="block font-semibold mb-2">Department</label>
        <div className="space-y-2">
          {company.departments.map((dept, index) => (
            <div
              key={index}
              className="flex justify-between items-center bg-gray-50 p-3 rounded-lg"
            >
              <span className="font-medium">{dept.name}</span>
              <div className="flex gap-2">
                <button className="bg-blue-100 text-blue-800 px-3 py-1 rounded hover:bg-blue-200">
                  {dept.details}
                </button>
                <button className="bg-blue-100 text-blue-800 px-3 py-1 rounded hover:bg-blue-200">
                  {dept.position}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Proceed Button */}
      <button className="bg-yellow-400 text-white px-4 py-2 rounded hover:bg-yellow-500">
        Proceed ▶
      </button>
    </div>
  );
}