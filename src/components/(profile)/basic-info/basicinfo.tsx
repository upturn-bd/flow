interface EmployeeInfo {
  name: string
  employeeId: string
  designation: string
  department: string
  phoneNo: string
  emailId: string
  jobStatus: string
  joiningDate: string
  supervisor: string
}

export default function EmployeeInfoCard() {
  const employeeInfo: EmployeeInfo = {
    name: "Mahir Hossain",
    employeeId: "24175004",
    designation: "Founder",
    department: "Management",
    phoneNo: "+8801640480530",
    emailId: "mahir@upturn.com.bd",
    jobStatus: "Permanent",
    joiningDate: "22 October, 2022",
    supervisor: "Not Applicable",
  }

  const formatLabel = (key: string) => {
    return key
      .replace(/([A-Z])/g, " $1")
      .toLowerCase()
      .replace(/^\w/, (c) => c.toUpperCase())
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <div className="space-y-4">
        {Object.entries(employeeInfo).map(([key, value]) => (
          <div key={key} className="flex items-center border-b border-gray-100 pb-2">
            <div className="w-40 text-right text-blue-600 pr-2">{formatLabel(key)}</div>
            <div className="flex-1">
              <span className="inline-block min-w-[12px]">:</span>
              <span className="ml-1">{value}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

