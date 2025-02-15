"use client";
import React, { useState, useEffect } from "react";

const dummyData = [
    { id: "001", name: "John Doe", industry: "Tech", address: "123 Main St", contact: "Alice", phone: "123-456-7890" },
    { id: "002", name: "Jane Smith", industry: "Finance", address: "456 Oak St", contact: "Bob", phone: "987-654-3210" },
    { id: "003", name: "Mike Johnson", industry: "Healthcare", address: "789 Pine St", contact: "Charlie", phone: "555-123-4567" },
    { id: "004", name: "Emma Wilson", industry: "Retail", address: "101 Maple Ave", contact: "David", phone: "212-345-6789" },
    { id: "005", name: "Sophia Brown", industry: "Marketing", address: "202 Elm St", contact: "Eva", phone: "323-456-7890" },
    { id: "006", name: "Liam Taylor", industry: "Tech", address: "303 Birch Rd", contact: "Frank", phone: "434-567-8901" },
    { id: "007", name: "Olivia Lee", industry: "Construction", address: "404 Cedar Blvd", contact: "Grace", phone: "545-678-9012" },
    { id: "008", name: "James Clark", industry: "Healthcare", address: "505 Pine Blvd", contact: "Hannah", phone: "656-789-0123" },
    { id: "009", name: "Ava Rodriguez", industry: "Finance", address: "606 Oak Rd", contact: "Isaac", phone: "767-890-1234" },
    { id: "010", name: "Ethan Martinez", industry: "Tech", address: "707 Maple St", contact: "Jack", phone: "878-901-2345" },
    { id: "011", name: "Mason Harris", industry: "Retail", address: "808 Birch Blvd", contact: "Kelly", phone: "989-012-3456" },
    { id: "012", name: "Isabella Anderson", industry: "Finance", address: "909 Elm Ave", contact: "Leo", phone: "100-123-4567" },
    { id: "013", name: "Alexander Young", industry: "Marketing", address: "1010 Cedar St", contact: "Mia", phone: "212-234-5678" },
    { id: "014", name: "Charlotte King", industry: "Healthcare", address: "1111 Maple Rd", contact: "Nina", phone: "323-345-6789" },
    { id: "015", name: "Benjamin Scott", industry: "Retail", address: "1212 Pine Ave", contact: "Oscar", phone: "434-456-7890" },
    { id: "016", name: "Amelia Green", industry: "Tech", address: "1313 Oak Blvd", contact: "Paul", phone: "545-567-8901" },
    { id: "017", name: "William Adams", industry: "Construction", address: "1414 Birch Rd", contact: "Quinn", phone: "656-678-9012" },
    { id: "018", name: "Harper Nelson", industry: "Retail", address: "1515 Maple Blvd", contact: "Rachel", phone: "767-789-0123" },
    { id: "019", name: "Jack Carter", industry: "Marketing", address: "1616 Cedar Ave", contact: "Samantha", phone: "878-890-1234" },
    { id: "020", name: "Lucas Mitchell", industry: "Finance", address: "1717 Pine Rd", contact: "Tom", phone: "989-901-2345" },
  ];
  

const SearchableTable: React.FC = () => {
  const [search, setSearch] = useState("");
  const [filteredData, setFilteredData] = useState(dummyData);
  const [searchTrigger, setSearchTrigger] = useState(false);

  // Function to filter data
  const filterData = () => {
    const searchLower = search.trim().toLowerCase();
    
    if (!searchLower) {
      setFilteredData(dummyData);
      return;
    }
  
    const matches = dummyData.map((item) => {
      let priority = 0;
  
      // **ID Matching (Highest Priority)**
      if (item.id.toLowerCase() === searchLower) priority += 10; // Exact match
      else if (item.id.toLowerCase().startsWith(searchLower)) priority += 7; // Starts with search
      else if (item.id.toLowerCase().includes(searchLower)) priority += 5; // Contains search
  
      // **Other Field Matching (Descending Priority)**
      if (item.name.toLowerCase().includes(searchLower)) priority += 4;
      if (item.industry.toLowerCase().includes(searchLower)) priority += 3;
      if (item.address.toLowerCase().includes(searchLower)) priority += 2;
      if (item.contact.toLowerCase().includes(searchLower)) priority += 1;
      if (item.phone.includes(searchLower)) priority += 1;
  
      return { ...item, priority };
    });
  
    // **Sort results by priority**
    const sortedResults = matches
      .filter((item) => item.priority > 0)
      .sort((a, b) => b.priority - a.priority);
  
    setFilteredData(sortedResults);
  };
  

  // Live search
  useEffect(() => {
    filterData();
  }, [search]);

  // Button search
  const handleButtonSearch = () => {
    setSearchTrigger(!searchTrigger);
    filterData();
  };

  return (
    <div className="p-5 container mx-auto">
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder="Search..."
          className="border p-2 flex-grow rounded shadow"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button
          onClick={handleButtonSearch}
          className="bg-blue-500 text-white px-4 py-2 rounded shadow"
        >
          Search
        </button>
      </div>
      <table className="w-full border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-200">
            <th className="border p-2">Client ID</th>
            <th className="border p-2">Client Name</th>
            <th className="border p-2">Industry</th>
            <th className="border p-2">Address</th>
            <th className="border p-2">Contact Person</th>
            <th className="border p-2">Phone No.</th>
          </tr>
        </thead>
        <tbody>
          {filteredData.length > 0 ? (
            filteredData.map((row) => (
              <tr key={row.id}>
                <td className="border p-2">{row.id}</td>
                <td className="border p-2">{row.name}</td>
                <td className="border p-2">{row.industry}</td>
                <td className="border p-2">{row.address}</td>
                <td className="border p-2">{row.contact}</td>
                <td className="border p-2">{row.phone}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={6} className="text-center border p-2 ">
                No results found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default SearchableTable;
