"use client";

import { useEffect, useState } from "react";
import Collapsible from "../CollapsibleComponent";
import {
  LeaveTypeCreateModal,
  LeaveHolidayCreateModal,
  LeaveHolidayUpdateModal,
  LeaveTypeUpdateModal,
} from ".";
import { useLeaveTypes } from "@/hooks/useConfigTypes";
import { Tag, CalendarCheck, CalendarBlank, Plus, Clock } from "@/lib/icons";
import { useHolidayConfigs, useWeeklyHolidayConfigs } from "@/hooks/useLeaveManagement";
import { HolidayConfig, LeaveType } from "@/hooks/useLeaveManagement";
import { Button } from "@/components/ui/button";
import { AnimatePresence } from "framer-motion";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { EntityCard, EntityCardGrid, EntityCardBadge, EntityCardMetaItem, EmptyState } from "@/components/ui";

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
            <CalendarBlank size={22} weight="duotone" className="text-foreground-secondary" />
            <h3 className="text-lg font-semibold text-foreground-primary">Weekly Holidays</h3>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
            {weekdays.map((day, idx) => {
              const isSelected = weeklyHolidays.includes(idx);
              return (
                <div
                  key={day}
                  className={`cursor-pointer select-none rounded-lg py-2 text-center font-medium border ${isSelected
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-background-secondary dark:bg-background-tertiary text-foreground-secondary border-border-primary hover:bg-background-tertiary dark:bg-surface-secondary"
                    }`}
                  onClick={() => toggleWeekday(idx)}
                >
                  {day.slice(0, 3)}
                </div>
              );
            })}
          </div>

          {weeklyHolidays.length > 0 && (
            <p className="mt-2 text-sm text-foreground-tertiary">
              Selected: {weeklyHolidays.map(d => weekdays[d]).join(", ")}
            </p>
          )}
        </section>

        {/* Holidays Section */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <CalendarCheck size={22} weight="duotone" className="text-foreground-secondary" />
            <h3 className="text-lg font-semibold text-foreground-primary">Other Holidays</h3>
          </div>

          {holidaysLoading ? (
            <LoadingSpinner
              icon={CalendarCheck}
              text="Loading holidays..."
              height="h-40"
              color="gray"
            />
          ) : (
            <AnimatePresence>
              {holidayConfigs.length > 0 ? (
                <EntityCardGrid columns={3}>
                  {holidayConfigs.map((holiday: HolidayConfig, idx) => (
                    <EntityCard
                      key={holiday.id || idx}
                      title={holiday.name}
                      icon={CalendarCheck}
                      onDelete={holiday.id !== undefined ? () => handleDeleteHolidayConfig(holiday.id!) : undefined}
                      deleteLoading={deleteHolidayLoading === holiday.id}
                      onView={() => setEditHolidayConfig(holiday.id!)}
                      metadata={
                        <EntityCardMetaItem icon={CalendarBlank}>
                          {holiday.start_day == holiday.end_day ? formatDate(holiday.start_day) : `${formatDate(holiday.start_day)} - ${formatDate(holiday.end_day)}`}
                        </EntityCardMetaItem>
                      }
                    />
                  ))}
                </EntityCardGrid>
              ) : (
                <EmptyState
                  icon={CalendarCheck}
                  title="No holidays found"
                  description="Add holidays to the calendar"
                />
              )}
            </AnimatePresence>
          )}

          <div className="flex justify-end mt-4">
            <Button
              variant="primary"
              onClick={() => setIsCreatingHolidayConfig(true)}
              className="flex items-center gap-2 bg-primary-700 dark:bg-primary-600 hover:bg-primary-800 dark:hover:bg-primary-700 text-white"
            >
              <Plus size={16} weight="bold" />
              Add Holiday
            </Button>
          </div>
        </section>

        {/* Leave Types Section */}
        <section className="mt-8">
          <div className="flex items-center gap-3 mb-4">
            <Tag size={22} weight="duotone" className="text-foreground-secondary" />
            <h3 className="text-lg font-semibold text-foreground-primary">Leave Types</h3>
          </div>

          {typesLoading ? (
            <LoadingSpinner
              icon={Tag}
              text="Loading leave types..."
              height="h-40"
              color="gray"
            />
          ) : (
            <AnimatePresence>
              {leaveTypes.length > 0 ? (
                <EntityCardGrid columns={3}>
                  {leaveTypes.map((type: LeaveType, idx) => (
                    <EntityCard
                      key={type.id || idx}
                      title={type.name}
                      icon={Tag}
                      onDelete={type.id !== undefined ? () => handleDeleteLeaveType(type.id!) : undefined}
                      deleteLoading={deleteTypeLoading === type.id}
                      onView={() => setEditLeaveType(type.id!)}
                    >
                      <div className="mt-2">
                        <EntityCardBadge icon={Clock}>
                          Annual quota: {type.annual_quota} days
                        </EntityCardBadge>
                      </div>
                    </EntityCard>
                  ))}
                </EntityCardGrid>
              ) : (
                <EmptyState
                  icon={Tag}
                  title="No leave types found"
                  description="Add leave types to configure the leave system"
                />
              )}
            </AnimatePresence>
          )}

          <div className="flex justify-end mt-4">
            <Button
              variant="primary"
              onClick={() => setIsCreatingLeaveType(true)}
              className="flex items-center gap-2 bg-primary-700 dark:bg-primary-600 hover:bg-primary-800 dark:hover:bg-primary-700 text-white"
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
