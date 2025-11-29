"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Building, Settings, CaretRight, CaretLeft, Loader, CheckCircle, XCircle, CreditCard, DollarSign, Shield } from "@/lib/icons";
import { staggerContainer } from "@/components/ui/animations";

// Import context
import { AdminDataProvider, useAdminData } from "@/contexts/AdminDataContext";

// Import components
import SetupStep1 from "@/components/admin/setup/SetupStep1";
import SetupStep2 from "@/components/admin/setup/SetupStep2";
import BasicTab from "@/components/admin/tabs/BasicTab";
import AdvancedTab from "@/components/admin/tabs/AdvancedTab";
import AccountsTab from "@/components/admin/tabs/AccountsTab";
import RoleManagementTab from "@/components/admin/tabs/RoleManagementTab";
import { EmployeeSalaryList } from "@/components/admin/salary/SalaryManagement";

// Main content component that uses the context
function AdminManagementContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get('tab') || 'basic';
  
  const [currentStep, setCurrentStep] = useState(1);
  const [step1Complete, setStep1Complete] = useState(false);
  
  
  // Use the admin data context
  const {
    departments,
    divisions,
    grades,
    positions,
    loading,
    departmentsLoading,
    divisionsLoading,
    gradesLoading,
    positionsLoading,
    error,
    isSetupComplete,
    entityStatus,
  } = useAdminData();

  const handleTabChange = (tab: string) => {
    router.push(`/admin?tab=${tab}`);
  };

  const handleNextStep = () => {
    if (step1Complete) {
      setCurrentStep(2);
    }
  };

  const handlePrevStep = () => {
    setCurrentStep(1);
  };

  // Debug info
  console.log('Admin Management State:', {
    loading,
    departmentsLoading,
    divisionsLoading,
    gradesLoading,
    positionsLoading,
    departments: departments.length,
    divisions: divisions.length,
    grades: grades.length,
    positions: positions.length,
    isSetupComplete,
    error,
  });

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center h-64 bg-surface-primary rounded-xl shadow-sm p-6 max-w-6xl mx-auto mt-8"
      >
        <Loader className="w-12 h-12 text-foreground-tertiary animate-spin mb-4" />
        <p className="text-foreground-secondary">Loading admin management...</p>
      </motion.div>
    );
  }

    // Show guided setup if not complete
  if (!isSetupComplete) {
    return (
      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
        className="max-w-6xl mx-auto p-4 sm:p-6 pb-12"
      >
        {/* Header with progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center mb-8"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0.5 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="p-2 rounded-lg bg-blue-100 text-blue-700 mb-4 mx-auto w-fit"
          >
            <Settings size={24} />
          </motion.div>
          <h1 className="text-3xl font-bold text-foreground-primary mb-2">Initial Setup Required</h1>
          <p className="text-foreground-secondary mb-6">Complete the setup process to access all admin management features</p>
          
          {/* Progress indicators */}
          <div className="flex justify-center items-center gap-4 mb-8">
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
              currentStep === 1 ? 'bg-blue-100 text-blue-700' : 'bg-background-tertiary dark:bg-surface-secondary text-foreground-secondary'
            }`}>
              <span className="font-medium">Step 1</span>
              <Building size={16} />
            </div>
            <CaretRight className="text-foreground-tertiary" size={16} />
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
              currentStep === 2 ? 'bg-blue-100 text-blue-700' : 'bg-background-tertiary dark:bg-surface-secondary text-foreground-secondary'
            }`}>
              <span className="font-medium">Step 2</span>
              <Settings size={16} />
            </div>
          </div>

          {/* Entity status */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {Object.entries(entityStatus).map(([entity, complete]) => (
              <div key={entity} className="flex items-center justify-center gap-2 p-2 bg-background-secondary dark:bg-background-tertiary rounded-lg">
                {complete ? (
                  <CheckCircle className="text-green-500" size={16} />
                ) : (
                  <XCircle className="text-red-500" size={16} />
                )}
                <span className="text-sm font-medium capitalize">{entity}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Step content */}
        <AnimatePresence mode="wait">
          {currentStep === 1 ? (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <SetupStep1 
                onStepComplete={setStep1Complete}
              />
            </motion.div>
          ) : (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <SetupStep2 />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="flex justify-between mt-8"
        >
          <motion.button
            onClick={handlePrevStep}
            disabled={currentStep === 1}
            whileHover={{ scale: currentStep === 1 ? 1 : 1.05 }}
            whileTap={{ scale: currentStep === 1 ? 1 : 0.95 }}
            className={`px-6 py-2.5 rounded-lg flex items-center gap-2 shadow-sm transition-all duration-200 ${
              currentStep === 1 
                ? 'bg-background-tertiary dark:bg-surface-secondary text-foreground-tertiary cursor-not-allowed' 
                : 'bg-background-tertiary dark:bg-surface-secondary hover:bg-surface-hover text-foreground-secondary'
            }`}
          >
            <CaretLeft size={18} />
            <span className="font-medium">Previous</span>
          </motion.button>

          <motion.button
            onClick={handleNextStep}
            disabled={!step1Complete}
            whileHover={{ scale: !step1Complete ? 1 : 1.05 }}
            whileTap={{ scale: !step1Complete ? 1 : 0.95 }}
            className={`px-6 py-2.5 rounded-lg flex items-center gap-2 shadow-sm transition-all duration-200 ${
              !step1Complete 
                ? 'bg-background-tertiary dark:bg-surface-secondary text-foreground-tertiary cursor-not-allowed' 
                : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white'
            }`}
          >
            <span className="font-medium">
              {currentStep === 2 ? 'Complete Setup' : 'Next Step'}
            </span>
            <CaretRight size={18} />
          </motion.button>
        </motion.div>
      </motion.div>
    );
  }

  // Show tabs interface if setup is complete
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      className="max-w-6xl mx-auto p-4 sm:p-6 pb-12"
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-center mb-8"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0.5 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="p-2 rounded-lg bg-background-tertiary dark:bg-surface-secondary text-foreground-secondary mr-3"
        >
          <Building size={24} />
        </motion.div>
        <div>
          <h1 className="text-2xl font-bold text-foreground-primary">Admin Management</h1>
          <p className="text-foreground-secondary">Configure your company details and administrative settings</p>
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="flex border-b border-border-primary mb-6 bg-surface-primary rounded-t-xl shadow-sm"
      >
        <button
          onClick={() => handleTabChange('basic')}
          className={`px-6 py-3 font-medium text-sm rounded-tl-xl transition-colors duration-200 flex items-center gap-2 ${
            currentTab === 'basic'
              ? 'text-blue-700 bg-blue-50 border-b-2 border-blue-700'
              : 'text-foreground-secondary hover:text-foreground-primary hover:bg-background-secondary dark:bg-background-tertiary'
          }`}
        >
          <Building size={16} />
          Basic
        </button>
        <button
          onClick={() => handleTabChange('advanced')}
          className={`px-6 py-3 font-medium text-sm transition-colors duration-200 flex items-center gap-2 ${
            currentTab === 'advanced'
              ? 'text-blue-700 bg-blue-50 border-b-2 border-blue-700'
              : 'text-foreground-secondary hover:text-foreground-primary hover:bg-background-secondary dark:bg-background-tertiary'
          }`}
        >
          <Settings size={16} />
          Advanced
        </button>
        <button
          onClick={() => handleTabChange('accounts')}
          className={`px-6 py-3 font-medium text-sm transition-colors duration-200 flex items-center gap-2 ${
            currentTab === 'accounts'
              ? 'text-blue-700 bg-blue-50 border-b-2 border-blue-700'
              : 'text-foreground-secondary hover:text-foreground-primary hover:bg-background-secondary dark:bg-background-tertiary'
          }`}
        >
          <CreditCard size={16} />
          Transactions
        </button>
        <button
          onClick={() => handleTabChange('salaries')}
          className={`px-6 py-3 font-medium text-sm transition-colors duration-200 flex items-center gap-2 ${
            currentTab === 'salaries'
              ? 'text-blue-700 bg-blue-50 border-b-2 border-blue-700'
              : 'text-foreground-secondary hover:text-foreground-primary hover:bg-background-secondary dark:bg-background-tertiary'
          }`}
        >
          <DollarSign size={16} />
          Payroll
        </button>
        <button
          onClick={() => handleTabChange('roles')}
          className={`px-6 py-3 font-medium text-sm rounded-tr-xl transition-colors duration-200 flex items-center gap-2 ${
            currentTab === 'roles'
              ? 'text-blue-700 bg-blue-50 border-b-2 border-blue-700'
              : 'text-foreground-secondary hover:text-foreground-primary hover:bg-background-secondary dark:bg-background-tertiary'
          }`}
        >
          <Shield size={16} />
          Roles
        </button>
      </motion.div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        {currentTab === 'basic' ? (
          <motion.div
            key="basic"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <BasicTab />
          </motion.div>
        ) : currentTab === 'advanced' ? (
          <motion.div
            key="advanced"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <AdvancedTab />
          </motion.div>
        ) : currentTab === 'accounts' ? (
          <motion.div
            key="accounts"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <AccountsTab />
          </motion.div>
        ) : currentTab === 'salaries' ? (
          <motion.div
            key="salaries"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <EmployeeSalaryList />
          </motion.div>
        ) : currentTab === 'roles' ? (
          <motion.div
            key="roles"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <RoleManagementTab />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.div>
  );
}

// Main component that provides the context
export default function AdminManagement() {
  return (
    <AdminDataProvider>
      <Suspense fallback={
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center h-64 bg-surface-primary rounded-xl shadow-sm p-6 max-w-6xl mx-auto mt-8"
        >
          <Loader className="w-12 h-12 text-foreground-tertiary animate-spin mb-4" />
          <p className="text-foreground-secondary">Loading admin management...</p>
        </motion.div>
      }>
        <AdminManagementContent />
      </Suspense>
    </AdminDataProvider>
  );
}
