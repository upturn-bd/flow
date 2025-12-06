"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Building, User, Envelope, Phone, Briefcase, Users, CheckCircle, WarningCircle, Clock, XCircle, SealCheck, PaperPlaneTilt, SignOut } from "@phosphor-icons/react";
import { logout } from "@/app/(auth)/auth-actions";
import FormInputField from "@/components/ui/FormInputField";
import FormSelectField from "@/components/ui/FormSelectField";
import { fadeInUp, staggerContainer } from "@/components/ui/animations";
import { InlineSpinner } from "@/components/ui";
import { useCompanyValidation } from "@/hooks/useCompanyValidation";
import { useEmployees } from "@/hooks/useEmployees";
import { useDepartments } from "@/hooks/useDepartments";
import { useOnboarding } from "@/hooks/useOnboarding";
import { validateOnboardingForm, validationErrorsToObject } from "@/lib/utils/validation";
import { OnboardingFormData } from "@/lib/types/schemas";
import { getEmployeeId, getUser } from "@/lib/utils/auth";

const jobStatuses = [
  "Active",
  "Inactive",
  "Probation",
  "Resigned",
  "Terminated",
] as const;

export default function EmployeeOnboarding() {
  const [formData, setFormData] = useState<OnboardingFormData>({
    first_name: "",
    last_name: "",
    email: "",
    phone_number: "",
    department_id: null,
    designation: "",
    job_status: "",
    hire_date: "",
    company_name: "",
    company_id: 0,
    supervisor_id: null,
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
  const { getUserOnboardingInfo, submitOnboarding, subscribeToUserOnboardingUpdates } = useOnboarding();

  useEffect(() => {
    console.log(departments, "Departments fetched in onboarding");
    console.log(employees, "Employees fetched in onboarding");
  }, [departments,employees]);
    


  useEffect(() => {
    const fetchRejectedData = async () => {
      if (status === "rejected") {
        try {
          setLoading(true);
          const userInfo = await getUserOnboardingInfo();
          if (userInfo) {
            const formatted = {
              ...formData,
              ...userInfo.userData,
              company_name: userInfo.companyData.name,
              company_id: userInfo.userData.company_id,
            };
            setCompanyCode(userInfo.companyData.code);
            setIsCompanyCodeValid(true);
            setFormData(formatted);
            setActiveSection("personal");
            
            // Fetch departments when application is rejected
            await (async () => {
              try {
                await fetchDepartments(companyId!);
              } catch (error) {
                console.error("Error fetching departments:", error);
              }
            })();
            await fetchEmployees();
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
            email: user.email ?? "",
            phone_number: user.phone ?? "",
          }));
        }
      }
    };
    fetchRejectedData();
  }, []);

  useEffect(() => {
    if (isCompanyCodeValid && formData.company_id) {
      try{
        fetchDepartments(companyId!);
        fetchEmployees(companyId!);
        getEmployeeId().then(id => setUserId(id));
      }
      catch (error) {
        console.error("Error fetching departments or employees:", error);
      }
    }
  }, [companyId]);

  // Set up polling for user's onboarding status (replaces realtime)
  useEffect(() => {
    if (userId) {
      const unsubscribe = subscribeToUserOnboardingUpdates(userId, (payload) => {
        // Redirect to appropriate page based on status change
        if (payload.new.has_approval === "ACCEPTED") {
          router.push("/home");
        } else if (payload.new.has_approval === "REJECTED") {
          router.push(`/onboarding?status=rejected&reason=${encodeURIComponent(payload.new.rejection_reason || "No reason provided")}`);
        }
      });

      return () => {
        unsubscribe();
      };
    }
  }, [userId, subscribeToUserOnboardingUpdates, router]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "department_id" ? (value ? parseInt(value) : null) : value,
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
      const result = validateOnboardingForm(formData);
      if (!result.success) {
        const errorMap = validationErrorsToObject(result.errors);
        setErrors(errorMap);
        return;
      }
      
      setErrors({});
      setLoading(true);
      
      await submitOnboarding(result.data!);
      router.push("/onboarding?status=pending");
    } catch (err: any) {
      console.error("Submission error:", err);
      if (err?.errors) {
        const errorMap = validationErrorsToObject(err.errors);
        setErrors(errorMap);
      } else {
        // Check if it's a duplicate email error
        const errorMessage = err.message || "Something went wrong. Please try again later.";
        if (errorMessage.includes("email") && errorMessage.includes("already")) {
          setErrors({ 
            email: errorMessage,
            submit: "Please correct the errors above and try again." 
          });
        } else {
          setErrors({ submit: errorMessage });
        }
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
          // await fetchDepartmentsData();
          // await fetchEmployees();
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
        className="w-full min-h-screen bg-linear-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-6"
      >
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="max-w-lg w-full bg-surface-primary rounded-xl shadow-lg overflow-hidden"
        >
          <div className="bg-primary-600 py-4 px-6">
            <h2 className="text-xl font-semibold text-white flex items-center">
              <Clock className="mr-2 h-5 w-5" />
              Application Pending
            </h2>
          </div>
          
          <div className="p-6">
            <div className="flex items-center justify-center mb-6">
              <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center">
                <Clock className="h-12 w-12 text-primary-600" />
              </div>
            </div>
            
            <h3 className="text-xl font-semibold text-center mb-4">Your information is being reviewed</h3>
            
            <p className="text-foreground-secondary text-center mb-6">
              Thank you for submitting your details. Your application is currently under review by the administrative team.
              You will be notified once the review process is complete.
            </p>
            
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-6">
              <p className="text-sm text-blue-700 flex items-start">
                <WarningCircle size={16} className="mr-2 mt-0.5 shrink-0" />
                If you have any questions about your application status, please contact your supervisor or the HR department.
              </p>
            </div>
            
            <div className="flex justify-center">
              <button
                onClick={logout}
                className="flex items-center px-6 py-2 bg-background-tertiary dark:bg-surface-secondary text-foreground-secondary rounded-lg hover:bg-surface-hover transition-colors"
              >
                <SignOut className="mr-2 h-5 w-5" />
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
      className="w-full min-h-screen bg-linear-to-br from-blue-50 to-indigo-50 py-10 px-4 sm:px-6"
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
          <p className="text-foreground-secondary max-w-2xl mx-auto">
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
                  activeSection === "company" ? "bg-primary-600" : isCompanyCodeValid ? "bg-green-600" : "bg-gray-300"
                } text-white font-medium`}>
                  {isCompanyCodeValid ? <CheckCircle size={18} /> : 1}
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
                  activeSection === "personal" ? "bg-primary-600" : "bg-gray-300"
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
            className="flex items-center px-4 py-2 text-sm bg-background-tertiary dark:bg-surface-secondary text-foreground-secondary rounded-lg hover:bg-surface-hover transition-colors"
          >
            <SignOut className="h-4 w-4 mr-2" />
            Logout
          </button>
        </motion.div>

        {/* Form Container */}
        <div className="bg-surface-primary rounded-xl shadow-lg overflow-hidden mb-8">
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
                    <Building className="h-6 w-6 text-primary-600 mr-2" />
                    <h2 className="text-xl font-semibold text-foreground-primary">Company Information</h2>
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
                      icon={<Building size={18} />}
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
                          className="flex items-center justify-center w-full sm:w-auto px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {verifyLoading ? (
                            <>
                              <InlineSpinner size="md" color="white" className="mr-2" />
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
                    <User className="h-6 w-6 text-primary-600 mr-2" />
                    <h2 className="text-xl font-semibold text-foreground-primary">Personal Information</h2>
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
                        icon={<Envelope size={18} />}
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
                        icon={<Building size={18} />}
                        options={departments
                          .filter(dept => dept.id !== undefined)
                          .map(dept => ({ value: dept.id as number, label: dept.name }))}
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
                      value={formData.supervisor_id === null ? "" : formData.supervisor_id}
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
                        className="flex items-center px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading ? (
                          <>
                            <InlineSpinner size="md" color="white" className="mr-2" />
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
                          <WarningCircle className="h-5 w-5 mr-2 shrink-0" />
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
