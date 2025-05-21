"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { z } from "zod";
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
  AlertCircle, 
  Loader2, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  BadgeCheck, 
  Send,
  LogOut
} from "lucide-react";
import { logout } from "@/app/(auth)/auth-actions";
import FormInputField from "@/components/ui/FormInputField";
import FormSelectField from "@/components/ui/FormSelectField";
import { fadeInUp, staggerContainer } from "@/components/ui/animations";
import { useCompanyValidation } from "@/hooks/useCompanyValidation";
import { useEmployees } from "@/hooks/useEmployees";
import { useDepartments } from "@/hooks/useDepartments";
import { getEmployeeId, getUser } from "@/lib/api/employee";

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
  const [userId, setUserId] = useState<string>("");
  const [activeSection, setActiveSection] = useState("company");

  const { 
    validateCompanyCode, 
    companyId,
  } = useCompanyValidation();
  
  const { employees, fetchEmployees } = useEmployees();
  const { departments, fetchDepartments } = useDepartments();

  const fetchDepartmentsData = async () => {
    try {
      await fetchDepartments(companyId ?? undefined);
    } catch (error) {
      console.error("Error fetching departments:", error);
    }
  };

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
              
              // Fetch departments when application is rejected
              await fetchDepartmentsData();
              await fetchEmployees();
            }
          }
        } catch (e) {
          console.error("Failed to fetch rejected data:", e);
        } finally {
          setLoading(false);
        }
      } else{
        const user = await getUser();
        if (user) {
          setFormData((prev) => ({
            ...prev,
            email: user.user?.email ?? "",
            phone_number: user.user?.phone ?? "",
          }));
        }
      }
    };
    fetchRejectedData();
  }, []);

  useEffect(() => {
    if (isCompanyCodeValid && formData.company_id) {
      fetchDepartmentsData();
      getEmployeeId().then(id => setUserId(id));
    }
  }, [isCompanyCodeValid]);

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
      
      const result = await validateCompanyCode(formData.company_name, companyCode);
      
      if (result.isValid && result.id !== null) {
        setIsCompanyCodeValid(true);
        setFormData((prev) => ({ ...prev, company_id: result.id || 0 }));
        setActiveSection("personal");
        
        // Fetch departments and employees for the validated company
        if (result.id) {
          await fetchDepartmentsData();
          await fetchEmployees();
          setVerifyLoading(false);
        }
      } else {
        setIsCompanyCodeValid(false);
        setVerifyLoading(false);
        setErrors({ 
          company_code: result.error || "Invalid company code or name. Please check and try again." 
        });
      }
    } catch (error) {
      console.error("Error verifying company code:", error);
      setIsCompanyCodeValid(false);
      setVerifyLoading(false);
      setErrors({ 
        company_code: "Failed to verify company code. Please try again." 
      });
    }
  };

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
                onClick={logout}
                className="flex items-center px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <LogOut className="mr-2 h-5 w-5" />
                Logout
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    );
  }

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
              <div className="absolute -bottom-6 left-5 transform -translate-x-1/2 text-sm font-medium">
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
              <div className="absolute -bottom-6 left-5 transform -translate-x-1/2 text-sm font-medium">
                Personal
              </div>
            </div>

            <div className="relative">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-300 text-white font-medium">
                  3
                </div>
              </div>
              <div className="absolute -bottom-6 left-5 transform -translate-x-1/2 text-sm font-medium">
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

        {/* Logout Button */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-4 flex justify-end"
        >
          <button
            onClick={logout}
            className="flex items-center px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </button>
        </motion.div>

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
                    <FormInputField
                      name="company_name"
                      label="Company Name"
                      icon={<Building2 size={18} />}
                      value={formData.company_name}
                      onChange={handleChange}
                      readOnly={!!status}
                      error={errors.company_name}
                    />
                    
                    <FormInputField
                      name="companyCode"
                      label="Company Code"
                      icon={<BadgeCheck size={18} />}
                      value={companyCode}
                      onChange={(e) => setCompanyCode(e.target.value)}
                      readOnly={!!status || isCompanyCodeValid}
                      error={errors.company_code}
                    />
                    
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
                      <FormInputField
                        name="first_name"
                        label="First Name"
                        icon={<User size={18} />}
                        value={formData.first_name}
                        onChange={handleChange}
                        error={errors.first_name}
                      />
                      <FormInputField
                        name="last_name"
                        label="Last Name"
                        icon={<User size={18} />}
                        value={formData.last_name}
                        onChange={handleChange}
                        error={errors.last_name}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                      <FormInputField
                        name="email"
                        label="Email Address"
                        icon={<Mail size={18} />}
                        value={formData.email}
                        onChange={handleChange}
                        type="email"
                        error={errors.email}
                      />
                      <FormInputField
                        name="phone_number"
                        label="Phone Number"
                        icon={<Phone size={18} />}
                        value={formData.phone_number}
                        onChange={handleChange}
                        error={errors.phone_number}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                      <FormSelectField
                        name="department_id"
                        label="Department"
                        icon={<Building2 size={18} />}
                        options={departments.map(dept => ({ value: dept.id, label: dept.name }))}
                        placeholder="Select Department"
                        value={formData.department_id}
                        onChange={handleChange}
                        error={errors.department_id}
                      />
                      
                      <FormInputField
                        name="designation"
                        label="Designation"
                        icon={<Briefcase size={18} />}
                        value={formData.designation}
                        onChange={handleChange}
                        error={errors.designation}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                      <FormSelectField
                        name="job_status"
                        label="Job Status"
                        icon={<Briefcase size={18} />}
                        options={jobStatuses.map(status => ({ value: status, label: status }))}
                        placeholder="Select Job Status"
                        value={formData.job_status}
                        onChange={handleChange}
                        error={errors.job_status}
                      />
                      
                      <FormInputField
                        name="hire_date"
                        label="Joining Date"
                        icon={<Calendar size={18} />}
                        value={formData.hire_date}
                        onChange={handleChange}
                        type="date"
                        error={errors.hire_date}
                      />
                    </div>
                    
                    <FormSelectField
                      name="supervisor_id"
                      label="Supervisor"
                      icon={<Users size={18} />}
                      options={(status !== "rejected"
                        ? employees
                        : employees.filter(employee => employee.id !== userId)
                      ).map(emp => ({ value: emp.id, label: emp.name }))}
                      placeholder="Not Applicable"
                      value={formData.supervisor_id || ""}
                      onChange={handleChange}
                      error={errors.supervisor_id}
                    />
                    
                    <motion.div 
                      variants={fadeInUp}
                      className="flex justify-end mt-8"
                    >                      
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
