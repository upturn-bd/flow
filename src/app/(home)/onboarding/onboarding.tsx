"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { z } from "zod";
import {
  getDepartmentsByCompanyId,
  getEmployeesByCompanyId,
  getUser,
} from "@/lib/auth/getUser";
import { validateCompanyCode } from "@/lib/api/company";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Calendar, 
  Building2, 
  User, 
  Mail, 
  Phone, 
  Briefcase, 
  Users, 
  CircleCheck, 
  CircleAlert, 
  AlertCircle, 
  ChevronDown, 
  Loader2, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  BadgeCheck, 
  Send
} from "lucide-react";

const jobStatuses = [
  "Active",
  "Inactive",
  "Probation",
  "Resigned",
  "Terminated",
] as const;

const formSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone_number: z.string().min(1, "Phone number is required"),
  department_id: z.number().min(1, "Department is required"),
  designation: z.string().min(1, "Designation is required"),
  job_status: z.enum(jobStatuses, {
    errorMap: () => ({ message: "Job status is required" }),
  }),
  hire_date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Please enter a valid date",
  }),
  company_name: z.string().min(1, "Company name is required"),
  company_id: z.number().min(1, "Company ID is required"),
  supervisor_id: z.string().optional(),
});

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.4 }
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

export default function EmployeeOnboarding() {
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone_number: "",
    department_id: 0,
    designation: "",
    job_status: "",
    hire_date: "",
    company_name: "",
    company_id: 0,
    supervisor_id: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [dirty, setDirty] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const status = searchParams.get("status");
  const reason = searchParams.get("reason");
  const [isCompanyCodeValid, setIsCompanyCodeValid] = useState(false);
  const [companyCode, setCompanyCode] = useState("");
  const [departments, setDepartments] = useState<
    { id: number; name: string }[]
  >([]);
  const [employees, setEmployees] = useState<
    { id: string; name: string; role: string }[]
  >([]);
  const [userId, setUserId] = useState<string>("");
  const [activeSection, setActiveSection] = useState("company");

  useEffect(() => {
    const fetchRejectedData = async () => {
      if (status === "rejected") {
        try {
          setLoading(true);
          const res = await fetch("/api/onboarding");
          if (res.ok) {
            const { data } = await res.json();
            if (data) {
              const formatted = {
                ...formData,
                ...data.userData,
                company_name: data.companyData.name,
                company_id: data.userData.company_id,
              };
              setCompanyCode(data.companyData.code);
              setIsCompanyCodeValid(true);
              setFormData(formatted);
              setActiveSection("personal");
            }
          }
        } catch (e) {
          console.error("Failed to fetch rejected data:", e);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchRejectedData();
  }, [status]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "department_id" ? parseInt(value) : value,
    }));
    setDirty(true);
    
    // Clear error for the field being changed
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = {...prev};
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = formSchema.safeParse(formData);
      if (!result.success) {
        const errorMap: Record<string, string> = {};
        result.error.errors.forEach((e) => (errorMap[e.path[0]] = e.message));
        setErrors(errorMap);
        return;
      }
      
      setErrors({});
      setLoading(true);
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result.data),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      router.push("/onboarding?status=pending");
    } catch (err: any) {
      console.error("Submission error:", err);
      if (err?.errors) {
        const errorMap: Record<string, string> = {};
        err.errors.forEach((e: any) => (errorMap[e.path[0]] = e.message));
        setErrors(errorMap);
      } else {
        setErrors({ submit: err.message || "Something went wrong. Please try again later." });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleValidateCompanyCode = async () => {
    try {
      setVerifyLoading(true);
      const { isValid, id } = await validateCompanyCode(
        formData.company_name,
        companyCode
      );
      if (isValid && id) {
        setFormData((prev) => ({ ...prev, company_id: id }));
        setIsCompanyCodeValid(isValid);
        setActiveSection("personal");
      } else {
        setErrors({ 
          company_code: "Invalid company code or name. Please check and try again." 
        });
      }
    } catch (error) {
      console.error("Error verifying company code:", error);
      setErrors({ 
        company_code: "Failed to verify company code. Please try again." 
      });
    } finally {
      setVerifyLoading(false);
    }
  };

  useEffect(() => {
    const fetchDepartments = async (companyId: number) => {
      try {
        const res = await getDepartmentsByCompanyId(companyId);
        setDepartments(res);
      } catch (error) {
        console.error("Error fetching departments:", error);
      }
    };

    const fetchEmployees = async (companyId: number) => {
      try {
        const res = await getEmployeesByCompanyId(companyId);
        setEmployees(res ?? []);
      } catch (error) {
        console.error("Error fetching employees:", error);
      }
    };

    const getUserId = async () => {
      try {
        const { user } = await getUser();
        if (user) {
          setUserId(user.id);
        }
      } catch (error) {
        console.error("Error fetching user ID:", error);
      }
    };

    if (isCompanyCodeValid && formData.company_id) {
      fetchDepartments(formData.company_id);
      fetchEmployees(formData.company_id);
      getUserId();
    }
  }, [formData.company_id, isCompanyCodeValid]);

  if (status === "pending") {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="w-full min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-6"
      >
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="max-w-lg w-full bg-white rounded-xl shadow-lg overflow-hidden"
        >
          <div className="bg-blue-600 py-4 px-6">
            <h2 className="text-xl font-semibold text-white flex items-center">
              <Clock className="mr-2 h-5 w-5" />
              Application Pending
            </h2>
          </div>
          
          <div className="p-6">
            <div className="flex items-center justify-center mb-6">
              <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center">
                <Clock className="h-12 w-12 text-blue-600" />
              </div>
            </div>
            
            <h3 className="text-xl font-semibold text-center mb-4">Your information is being reviewed</h3>
            
            <p className="text-gray-600 text-center mb-6">
              Thank you for submitting your details. Your application is currently under review by the administrative team.
              You will be notified once the review process is complete.
            </p>
            
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-6">
              <p className="text-sm text-blue-700 flex items-start">
                <AlertCircle size={16} className="mr-2 mt-0.5 flex-shrink-0" />
                If you have any questions about your application status, please contact your supervisor or the HR department.
              </p>
            </div>
            
            <div className="flex justify-center">
              <button
                onClick={() => router.push("/home")}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Return to Dashboard
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  const renderInputField = (
    name: keyof typeof formData,
    label: string,
    icon: React.ReactNode,
    type = "text",
    readOnly = false
  ) => {
    const hasError = !!errors[name];
    
    return (
      <motion.div 
        variants={fadeInUp}
        className="mb-4"
      >
        <label 
          htmlFor={name} 
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {label}
        </label>
        <div className="relative">
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            {icon}
          </div>
          <input
            id={name}
            name={name}
            value={formData[name as keyof typeof formData] as string}
            onChange={handleChange}
            type={type}
            readOnly={readOnly}
            className={`w-full pl-10 pr-4 py-2.5 text-gray-900 rounded-lg ${
              hasError 
                ? "border-red-300 ring-1 ring-red-300 focus:ring-red-500 focus:border-red-500 bg-red-50" 
                : "border-gray-300 focus:ring-blue-500 focus:border-blue-500 bg-[#EAF4FF]"
            } ${readOnly ? "bg-gray-100 cursor-not-allowed" : ""}`}
          />
          {hasError && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-500">
              <AlertCircle size={16} />
            </div>
          )}
        </div>
        {hasError && (
          <p className="mt-1 text-sm text-red-600">{errors[name]}</p>
        )}
      </motion.div>
    );
  };

  const renderSelectField = (
    name: keyof typeof formData,
    label: string,
    icon: React.ReactNode,
    options: Array<{ value: string | number; label: string }>,
    placeholder: string
  ) => {
    const hasError = !!errors[name];
    
    return (
      <motion.div 
        variants={fadeInUp}
        className="mb-4"
      >
        <label 
          htmlFor={name} 
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {label}
        </label>
        <div className="relative">
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            {icon}
          </div>
          <select
            id={name}
            name={name}
            value={formData[name] as string}
            onChange={handleChange}
            className={`w-full pl-10 pr-10 py-2.5 text-gray-900 rounded-lg appearance-none ${
              hasError 
                ? "border-red-300 ring-1 ring-red-300 focus:ring-red-500 focus:border-red-500 bg-red-50" 
                : "border-gray-300 focus:ring-blue-500 focus:border-blue-500 bg-[#EAF4FF]"
            }`}
          >
            <option value="">{placeholder}</option>
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
            <ChevronDown size={16} />
          </div>
          {hasError && (
            <div className="absolute right-8 top-1/2 transform -translate-y-1/2 text-red-500">
              <AlertCircle size={16} />
            </div>
          )}
        </div>
        {hasError && (
          <p className="mt-1 text-sm text-red-600">{errors[name]}</p>
        )}
      </motion.div>
    );
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-10 px-4 sm:px-6"
    >
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-8 text-center"
        >
          <h1 className="text-3xl font-bold text-blue-800 mb-2">Employee Onboarding</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Complete your employee profile information to get started with our system.
          </p>
        </motion.div>

        {/* Progress Steps */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { delay: 0.2 } }}
          className="mb-10 hidden sm:block"
        >
          <div className="flex items-center justify-center">
            <div className="relative">
              <div className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  activeSection === "company" ? "bg-blue-600" : isCompanyCodeValid ? "bg-green-600" : "bg-gray-300"
                } text-white font-medium`}>
                  {isCompanyCodeValid ? <CheckCircle2 size={18} /> : 1}
                </div>
                <div className={`h-1 w-20 sm:w-32 ${isCompanyCodeValid ? "bg-green-600" : "bg-gray-300"}`}></div>
              </div>
              <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-sm font-medium">
                Company
              </div>
            </div>

            <div className="relative">
              <div className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  activeSection === "personal" ? "bg-blue-600" : "bg-gray-300"
                } text-white font-medium`}>
                  2
                </div>
                <div className="h-1 w-20 sm:w-32 bg-gray-300"></div>
              </div>
              <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-sm font-medium">
                Personal
              </div>
            </div>

            <div className="relative">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-300 text-white font-medium">
                  3
                </div>
              </div>
              <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-sm font-medium">
                Submit
              </div>
            </div>
          </div>
        </motion.div>

        {/* Rejected Notice */}
        {status === "rejected" && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-8 bg-red-50 border-l-4 border-red-400 p-4 rounded-md shadow-sm"
          >
            <div className="flex items-start">
              <XCircle className="h-5 w-5 text-red-500 mr-3 mt-0.5" />
              <div>
                <h3 className="text-lg font-medium text-red-800">Application Rejected</h3>
                <p className="mt-1 text-red-700">
                  Your application was rejected for the following reason:
                </p>
                <p className="mt-2 text-red-600 bg-red-100 p-2 rounded font-medium">
                  {reason || "No specific reason provided. Please reach out to HR for more details."}
                </p>
                <p className="mt-3 text-sm text-red-600">
                  Please update your information and resubmit your application.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Form Container */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
          <form onSubmit={handleSubmit}>
            <AnimatePresence mode="wait">
              {/* Company Information Section */}
              {activeSection === "company" && (
                <motion.div
                  key="company"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  className="p-6"
                >
                  <div className="flex items-center mb-6">
                    <Building2 className="h-6 w-6 text-blue-600 mr-2" />
                    <h2 className="text-xl font-semibold text-gray-800">Company Information</h2>
                  </div>
                  
                  <motion.div 
                    variants={staggerContainer}
                    initial="hidden"
                    animate="visible"
                    className="space-y-2"
                  >
                    {renderInputField(
                      "company_name",
                      "Company Name",
                      <Building2 size={18} />,
                      "text",
                      !!status
                    )}
                    
                    <motion.div 
                      variants={fadeInUp}
                      className="mb-4"
                    >
                      <label 
                        htmlFor="companyCode" 
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Company Code
                      </label>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                          <BadgeCheck size={18} />
                        </div>
                        <input
                          id="companyCode"
                          name="companyCode"
                          value={companyCode}
                          onChange={(e) => setCompanyCode(e.target.value)}
                          type="text"
                          readOnly={!!status || isCompanyCodeValid}
                          className={`w-full pl-10 pr-4 py-2.5 text-gray-900 rounded-lg ${
                            errors.company_code
                              ? "border-red-300 ring-1 ring-red-300 focus:ring-red-500 focus:border-red-500 bg-red-50" 
                              : "border-gray-300 focus:ring-blue-500 focus:border-blue-500 bg-[#EAF4FF]"
                          } ${(!!status || isCompanyCodeValid) ? "bg-gray-100 cursor-not-allowed" : ""}`}
                        />
                        {errors.company_code && (
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-500">
                            <AlertCircle size={16} />
                          </div>
                        )}
                      </div>
                      {errors.company_code && (
                        <p className="mt-1 text-sm text-red-600">{errors.company_code}</p>
                      )}
                    </motion.div>
                    
                    <motion.div 
                      variants={fadeInUp}
                      className="flex justify-center mt-8"
                    >
                      {isCompanyCodeValid ? (
                        <button
                          type="button"
                          className="flex items-center justify-center w-full sm:w-auto px-6 py-2 rounded-lg bg-green-100 text-green-700 cursor-default"
                        >
                          <CircleCheck className="mr-2 h-5 w-5" />
                          Verified Successfully
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={!formData.company_name || !companyCode || verifyLoading}
                          onClick={handleValidateCompanyCode}
                          className="flex items-center justify-center w-full sm:w-auto px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {verifyLoading ? (
                            <>
                              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                              Verifying...
                            </>
                          ) : (
                            <>
                              <BadgeCheck className="mr-2 h-5 w-5" />
                              Verify Company Code
                            </>
                          )}
                        </button>
                      )}
                    </motion.div>
                  </motion.div>
                </motion.div>
              )}

              {/* Personal Information Section */}
              {activeSection === "personal" && (
                <motion.div
                  key="personal"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  className="p-6"
                >
                  <div className="flex items-center mb-6">
                    <User className="h-6 w-6 text-blue-600 mr-2" />
                    <h2 className="text-xl font-semibold text-gray-800">Personal Information</h2>
                  </div>
                  
                  <motion.div 
                    variants={staggerContainer}
                    initial="hidden"
                    animate="visible"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                      {renderInputField("first_name", "First Name", <User size={18} />)}
                      {renderInputField("last_name", "Last Name", <User size={18} />)}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                      {renderInputField("email", "Email Address", <Mail size={18} />, "email")}
                      {renderInputField("phone_number", "Phone Number", <Phone size={18} />)}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                      {renderSelectField(
                        "department_id",
                        "Department",
                        <Building2 size={18} />,
                        departments.map(dept => ({ value: dept.id, label: dept.name })),
                        "Select Department"
                      )}
                      
                      {renderInputField("designation", "Designation", <Briefcase size={18} />)}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                      {renderSelectField(
                        "job_status",
                        "Job Status",
                        <Briefcase size={18} />,
                        jobStatuses.map(status => ({ value: status, label: status })),
                        "Select Job Status"
                      )}
                      
                      {renderInputField("hire_date", "Joining Date", <Calendar size={18} />, "date")}
                    </div>
                    
                    {renderSelectField(
                      "supervisor_id",
                      "Supervisor",
                      <Users size={18} />,
                      (status !== "rejected"
                        ? employees
                        : employees.filter(employee => employee.id !== userId)
                      ).map(emp => ({ value: emp.id, label: emp.name })),
                      "Not Applicable"
                    )}
                    
                    <motion.div 
                      variants={fadeInUp}
                      className="flex justify-between mt-8"
                    >
                      <button
                        type="button"
                        onClick={() => setActiveSection("company")}
                        className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Back to Company
                      </button>
                      
                      <button
                        type="submit"
                        disabled={loading || (status === "rejected" && !dirty)}
                        className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Processing...
                          </>
                        ) : status === "rejected" ? (
                          <>
                            <Send className="mr-2 h-5 w-5" />
                            Resubmit Application
                          </>
                        ) : (
                          <>
                            <Send className="mr-2 h-5 w-5" />
                            Submit Application
                          </>
                        )}
                      </button>
                    </motion.div>
                    
                    {errors.submit && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm"
                      >
                        <div className="flex items-start">
                          <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                          <span>{errors.submit}</span>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </form>
        </div>
      </div>
    </motion.div>
  );
}
