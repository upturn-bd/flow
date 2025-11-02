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
import { useHolidayConfigs, useWeeklyHolidayConfigs } from "@/hooks/useLeaveManagement";
import { HolidayConfig, LeaveType } from "@/hooks/useLeaveManagement";
import { Button } from "@/components/ui/button";
import { AnimatePresence } from "framer-motion";

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

  const {
    weeklyHolidayConfigs,
    fetchWeeklyHolidayConfigs,
    createWeeklyHolidayConfig,
    deleteWeeklyHolidayConfig,
    updateWeeklyHolidayConfig,
    loading: weeklyHolidaysLoading
  } = useWeeklyHolidayConfigs();

  // At the top inside LeaveManagementView component
  const [weeklyHolidays, setWeeklyHolidays] = useState<number[]>([]); // store day_of_week as 0-6

  // Fetch existing weekly holidays from Supabase
  useEffect(() => {
    fetchWeeklyHolidayConfigs();
  }, [fetchWeeklyHolidayConfigs]);

  useEffect(() => {
    const loadWeeklyHolidays = async () => {
      const holidays = weeklyHolidayConfigs;
      // assuming holidays have a `day_of_week` column (0-6)
      const days = holidays.map((h: any) => h.day);
      setWeeklyHolidays(days);
    };
    loadWeeklyHolidays();
  }, [weeklyHolidayConfigs]);

  const toggleWeekday = async (dayIndex: number) => {
    let newHolidays: number[] = [];

    if (weeklyHolidays.includes(dayIndex)) {
      // remove holiday
      newHolidays = weeklyHolidays.filter(d => d !== dayIndex);
      // delete from Supabase
      const holidayToDelete = weeklyHolidayConfigs.find((h: any) => h.day === dayIndex);
      if (holidayToDelete?.id !== undefined) {
        await deleteWeeklyHolidayConfig(holidayToDelete.id);
      }
    } else {
      // add holiday
      newHolidays = [...weeklyHolidays, dayIndex];
      // create in Supabase
      await createWeeklyHolidayConfig({ day: dayIndex } as any);
    }

    setWeeklyHolidays(newHolidays);
  };

  const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];



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
    <Collapsible title="Holiday & Leave Calendar">
      <div
        
        
        
        className="px-4 space-y-6 py-4"
      >
        {/* Weekly Holidays Section */}
        <section className="mt-8">
          <div className="flex items-center gap-3 mb-4">
            <CalendarBlank size={22} weight="duotone" className="text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-800">Weekly Holidays</h3>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
            {weekdays.map((day, idx) => {
              const isSelected = weeklyHolidays.includes(idx);
              return (
                <div
                  key={day}
                  className={`cursor-pointer select-none rounded-lg py-2 text-center font-medium border ${isSelected
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                    }`}
                  onClick={() => toggleWeekday(idx)}
                >
                  {day.slice(0, 3)}
                </div>
              );
            })}
          </div>


          {weeklyHolidays.length > 0 && (
            <p className="mt-2 text-sm text-gray-500">
              Selected: {weeklyHolidays.map(d => weekdays[d]).join(", ")}
            </p>
          )}
        </section>

        {/* Holidays Section */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <CalendarCheck size={22} weight="duotone" className="text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-800">Other Holidays</h3>
          </div>

          {holidaysLoading ? (
            <LoadingSpinner
              icon={CalendarCheck}
              text="Loading holidays..."
              height="h-40"
              color="gray"
            />
          ) : (
            <div>
              <AnimatePresence>
                {holidayConfigs.length > 0 ? (
                  <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                    {holidayConfigs.map((holiday: HolidayConfig, idx) => (
                      <div
                        key={holiday.id || idx}
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
                            {holiday.start_day == holiday.end_day ? formatDate(holiday.start_day) : `${formatDate(holiday.start_day)} - ${formatDate(holiday.end_day)}`}
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
                      </div>
                    ))}
                  </div>
                ) : (
                  <div
                    
                    className="bg-gray-50 rounded-lg p-6 text-center border border-gray-200"
                  >
                    <div
                      className="flex justify-center mb-3"
                    >
                      <CalendarCheck size={40} weight="duotone" className="text-gray-400" />
                    </div>
                    <p className="text-gray-500 mb-1">No holidays found</p>
                    <p className="text-gray-400 text-sm mb-4">Add holidays to the calendar</p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          )}

          <div className="flex justify-end mt-4">
            <Button
              variant="primary"
              onClick={() => setIsCreatingHolidayConfig(true)}
              className="flex items-center gap-2 bg-gray-800 hover:bg-gray-900 text-white"
            >
              <Plus size={16} weight="bold" />
              Add Holiday
            </Button>
          </div>
        </section>

        {/* Leave Types Section */}
        <section className="mt-8">
          <div className="flex items-center gap-3 mb-4">
            <Tag size={22} weight="duotone" className="text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-800">Leave Types</h3>
          </div>

          {typesLoading ? (
            <LoadingSpinner
              icon={Tag}
              text="Loading leave types..."
              height="h-40"
              color="gray"
            />
          ) : (
            <div>
              <AnimatePresence>
                {leaveTypes.length > 0 ? (
                  <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                    {leaveTypes.map((type: LeaveType, idx) => (
                      <div
                        key={type.id || idx}
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
                      </div>
                    ))}
                  </div>
                ) : (
                  <div
                    
                    className="bg-gray-50 rounded-lg p-6 text-center border border-gray-200"
                  >
                    <div
                      className="flex justify-center mb-3"
                    >
                      <Tag size={40} weight="duotone" className="text-gray-400" />
                    </div>
                    <p className="text-gray-500 mb-1">No leave types found</p>
                    <p className="text-gray-400 text-sm mb-4">Add leave types to configure the leave system</p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          )}

          <div className="flex justify-end mt-4">
            <Button
              variant="primary"
              onClick={() => setIsCreatingLeaveType(true)}
              className="flex items-center gap-2 bg-gray-800 hover:bg-gray-900 text-white"
            >
              <Plus size={16} weight="bold" />
              Add Leave Type
            </Button>
          </div>
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
      </div>
    </Collapsible>
  );
}
