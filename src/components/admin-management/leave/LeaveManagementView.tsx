"use client";

import { useEffect, useState } from "react";
import Collapsible from "../CollapsibleComponent";
import {
  LeaveTypeCreateModal,
  LeaveHolidayCreateModal,
  LeaveHolidayUpdateModal,
  LeaveTypeUpdateModal,
} from "./";
import { useLeaveTypes } from "@/hooks/useConfigTypes";
import { TrashSimple, Tag, CalendarCheck, CalendarBlank, Plus, Clock, Eye } from "@phosphor-icons/react";
import { useHolidayConfigs } from "@/hooks/useLeaveManagement";
import { HolidayConfig, LeaveType } from "@/hooks/useLeaveManagement";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { fadeIn, fadeInUp, staggerContainer } from "@/components/ui/animations";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export default function LeaveManagementView() {
  const {
    leaveTypes,
    fetchLeaveTypes,
    createLeaveType,
    deleteLeaveType,
    updateLeaveType,
    loading: typesLoading
  } = useLeaveTypes();
  const [editLeaveType, setEditLeaveType] = useState<number | null>(null);
  const [isCreatingLeaveType, setIsCreatingLeaveType] = useState(false);
  const [selectedLeaveTypeEdit, setSelectedLeaveType] =
    useState<LeaveType | null>(null);
  const [typeLoading, setTypeLoading] = useState(false);
  const [deleteTypeLoading, setDeleteTypeLoading] = useState<number | null>(null);

  const handleCreateLeaveType = async (values: any) => {
    try {
      setTypeLoading(true);
      await createLeaveType(values);
      setIsCreatingLeaveType(false);
      fetchLeaveTypes();
    } catch (error) {
      console.error("Error creating leave type:", error);
    } finally {
      setTypeLoading(false);
    }
  };

  const handleUpdateLeaveType = async (values: any) => {
    try {
      setTypeLoading(true);
      await updateLeaveType(values);
      setSelectedLeaveType(null);
      setEditLeaveType(null);
      fetchLeaveTypes();
    } catch (error) {
      console.error("Error updating leave type:", error);
    } finally {
      setTypeLoading(false);
    }
  };

  const handleDeleteLeaveType = async (id: number) => {
    try {
      setDeleteTypeLoading(id);
      await deleteLeaveType(id);
      fetchLeaveTypes();
    } catch (error) {
      console.error("Error deleting leave type:", error);
    } finally {
      setDeleteTypeLoading(null);
    }
  };

  useEffect(() => {
    fetchLeaveTypes();
  }, [fetchLeaveTypes]);

  useEffect(() => {
    if (editLeaveType) {
      const selectedLeaveType = leaveTypes.filter(
        (leaveType: LeaveType) => leaveType.id === editLeaveType
      )[0];
      setSelectedLeaveType(selectedLeaveType);
    }
  }, [editLeaveType, leaveTypes]);

  // Leave Holiday Management View
  const {
    holidayConfigs,
    fetchHolidayConfigs,
    createHolidayConfig,
    deleteHolidayConfig,
    updateHolidayConfig,
    loading: holidaysLoading
  } = useHolidayConfigs();
  const [editHolidayConfig, setEditHolidayConfig] = useState<number | null>(
    null
  );
  const [isCreatingHolidayConfig, setIsCreatingHolidayConfig] = useState(false);
  const [selectedHolidayConfigEdit, setSelectedHolidayConfigEdit] =
    useState<HolidayConfig | null>(null);
  const [holidayLoading, setHolidayLoading] = useState(false);
  const [deleteHolidayLoading, setDeleteHolidayLoading] = useState<number | null>(null);

  const handleCreateHolidayConfig = async (values: any) => {
    try {
      setHolidayLoading(true);
      await createHolidayConfig(values);
      setIsCreatingHolidayConfig(false);
      fetchHolidayConfigs();
    } catch (error) {
      console.error("Error creating holiday:", error);
    } finally {
      setHolidayLoading(false);
    }
  };

  const handleUpdateHolidayConfig = async (values: any) => {
    try {
      setHolidayLoading(true);
      if (editHolidayConfig) {
        await updateHolidayConfig(editHolidayConfig, values);
      }
      setSelectedHolidayConfigEdit(null);
      setEditHolidayConfig(null);
      fetchHolidayConfigs();
    } catch (error) {
      console.error("Error updating holiday:", error);
    } finally {
      setHolidayLoading(false);
    }
  };

  const handleDeleteHolidayConfig = async (id: number) => {
    try {
      setDeleteHolidayLoading(id);
      await deleteHolidayConfig(id);
      fetchHolidayConfigs();
    } catch (error) {
      console.error("Error deleting holiday:", error);
    } finally {
      setDeleteHolidayLoading(null);
    }
  };

  useEffect(() => {
    fetchHolidayConfigs();
  }, [fetchHolidayConfigs]);

  useEffect(() => {
    if (editHolidayConfig) {
      const selectedHolidayConfig = holidayConfigs.filter(
        (holidayConfig: HolidayConfig) => holidayConfig.id === editHolidayConfig
      )[0];
      setSelectedHolidayConfigEdit(selectedHolidayConfig);
    }
  }, [editHolidayConfig, holidayConfigs]);

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
  };

  return (
    <Collapsible title="Leave Calendar">
      <motion.div 
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
        className="px-4 space-y-6 py-4"
      >
        {/* Holidays Section */}
        <section>
          <motion.div variants={fadeInUp} className="flex items-center gap-3 mb-4">
            <CalendarCheck size={22} weight="duotone" className="text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-800">Holidays</h3>
          </motion.div>

          {holidaysLoading ? (
            <LoadingSpinner
              icon={CalendarCheck}
              text="Loading holidays..."
              height="h-40"
              color="gray"
            />
          ) : (
            <motion.div variants={fadeInUp}>
              <AnimatePresence>
                {holidayConfigs.length > 0 ? (
                  <motion.div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                    {holidayConfigs.map((holiday: HolidayConfig, idx) => (
                      <motion.div
                        key={holiday.id || idx}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        transition={{ delay: idx * 0.05 }}
                        className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2 mb-2">
                            <CalendarCheck size={20} weight="duotone" className="text-gray-600" />
                            <h4 className="font-medium text-gray-800">{holiday.name}</h4>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => holiday.id !== undefined && handleDeleteHolidayConfig(holiday.id)}
                            isLoading={deleteHolidayLoading === holiday.id}
                            disabled={deleteHolidayLoading === holiday.id}
                            className="p-1 rounded-full text-gray-500 hover:bg-red-50 hover:text-red-500"
                          >
                            <TrashSimple size={16} weight="bold" />
                          </Button>
                        </div>
                        
                        <div className="mt-2">
                          <span className="flex items-center gap-1.5 text-sm text-gray-600">
                            <CalendarBlank size={16} weight="duotone" className="text-gray-500" />
                            {formatDate(holiday.date)}
                          </span>
                        </div>
                        
                        <div className="flex justify-end mt-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditHolidayConfig(holiday.id!)}
                            className="text-sm flex items-center gap-1 text-gray-600 hover:text-gray-800"
                          >
                            <Eye size={16} weight="bold" />
                            View Details
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                ) : (
                  <motion.div 
                    variants={fadeIn}
                    className="bg-gray-50 rounded-lg p-6 text-center border border-gray-200"
                  >
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.2, duration: 0.5 }}
                      className="flex justify-center mb-3"
                    >
                      <CalendarCheck size={40} weight="duotone" className="text-gray-400" />
                    </motion.div>
                    <p className="text-gray-500 mb-1">No holidays found</p>
                    <p className="text-gray-400 text-sm mb-4">Add holidays to the calendar</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          <motion.div variants={fadeIn} className="flex justify-end mt-4">
            <Button
              variant="primary" 
              onClick={() => setIsCreatingHolidayConfig(true)}
              className="flex items-center gap-2 bg-gray-800 hover:bg-gray-900 text-white"
            >
              <Plus size={16} weight="bold" />
              Add Holiday
            </Button>
          </motion.div>
        </section>

        {/* Leave Types Section */}
        <section className="mt-8">
          <motion.div variants={fadeInUp} className="flex items-center gap-3 mb-4">
            <Tag size={22} weight="duotone" className="text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-800">Leave Types</h3>
          </motion.div>

          {typesLoading ? (
            <LoadingSpinner
              icon={Tag}
              text="Loading leave types..."
              height="h-40"
              color="gray"
            />
          ) : (
            <motion.div variants={fadeInUp}>
              <AnimatePresence>
                {leaveTypes.length > 0 ? (
                  <motion.div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                    {leaveTypes.map((type: LeaveType, idx) => (
                      <motion.div
                        key={type.id || idx}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        transition={{ delay: idx * 0.05 }}
                        className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2 mb-2">
                            <Tag size={20} weight="duotone" className="text-gray-600" />
                            <h4 className="font-medium text-gray-800">{type.name}</h4>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => type.id !== undefined && handleDeleteLeaveType(type.id)}
                            isLoading={deleteTypeLoading === type.id}
                            disabled={deleteTypeLoading === type.id}
                            className="p-1 rounded-full text-gray-500 hover:bg-red-50 hover:text-red-500"
                          >
                            <TrashSimple size={16} weight="bold" />
                          </Button>
                        </div>
                        
                        <div className="mt-2">
                          <span className="flex items-center gap-1.5 text-sm bg-gray-100 px-2 py-1 rounded text-gray-700 w-fit">
                            <Clock size={16} weight="duotone" className="text-gray-500" />
                            Annual quota: {type.annual_quota} days
                          </span>
                        </div>
                        
                        <div className="flex justify-end mt-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditLeaveType(type.id!)}
                            className="text-sm flex items-center gap-1 text-gray-600 hover:text-gray-800"
                          >
                            <Eye size={16} weight="bold" />
                            View Details
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                ) : (
                  <motion.div 
                    variants={fadeIn}
                    className="bg-gray-50 rounded-lg p-6 text-center border border-gray-200"
                  >
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.2, duration: 0.5 }}
                      className="flex justify-center mb-3"
                    >
                      <Tag size={40} weight="duotone" className="text-gray-400" />
                    </motion.div>
                    <p className="text-gray-500 mb-1">No leave types found</p>
                    <p className="text-gray-400 text-sm mb-4">Add leave types to configure the leave system</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          <motion.div variants={fadeIn} className="flex justify-end mt-4">
            <Button
              variant="primary" 
              onClick={() => setIsCreatingLeaveType(true)}
              className="flex items-center gap-2 bg-gray-800 hover:bg-gray-900 text-white"
            >
              <Plus size={16} weight="bold" />
              Add Leave Type
            </Button>
          </motion.div>
        </section>

        <AnimatePresence>
          {isCreatingLeaveType && (
            <LeaveTypeCreateModal
              isOpen={isCreatingLeaveType}
              onSubmit={handleCreateLeaveType}
              onClose={() => setIsCreatingLeaveType(false)}
              isLoading={typeLoading}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {selectedLeaveTypeEdit && (
            <LeaveTypeUpdateModal
              isOpen={!!selectedLeaveTypeEdit}
              initialData={selectedLeaveTypeEdit}
              onSubmit={handleUpdateLeaveType}
              onClose={() => {
                setSelectedLeaveType(null);
                setEditLeaveType(null);
              }}
              isLoading={typeLoading}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isCreatingHolidayConfig && (
            <LeaveHolidayCreateModal
              isOpen={isCreatingHolidayConfig}
              onSubmit={handleCreateHolidayConfig}
              onClose={() => setIsCreatingHolidayConfig(false)}
              isLoading={holidayLoading}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {selectedHolidayConfigEdit && (
            <LeaveHolidayUpdateModal
              isOpen={!!selectedHolidayConfigEdit}
              initialData={selectedHolidayConfigEdit}
              onSubmit={handleUpdateHolidayConfig}
              onClose={() => {
                setSelectedHolidayConfigEdit(null);
                setEditHolidayConfig(null);
              }}
              isLoading={holidayLoading}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </Collapsible>
  );
}
