"use client";

import { useEffect, useState } from "react";
import Collapsible from "../CollapsibleComponent";
import LeaveTypeCreateModal, {
  LeaveHolidayCreateModal,
  LeaveHolidayUpdateModal,
  LeaveTypeUpdateModal,
} from "./LeaveModal";
import { useLeaveTypes } from "@/hooks/useConfigTypes";
import { TrashSimple } from "@phosphor-icons/react";
import { useHolidayConfigs } from "@/hooks/useLeaveManagement";
import { HolidayConfig, LeaveType } from "@/hooks/useLeaveManagement";

export default function LeaveManagementView() {
  const {
    leaveTypes,
    fetchLeaveTypes,
    createLeaveType,
    deleteLeaveType,
    updateLeaveType,
  } = useLeaveTypes();
  const [editLeaveType, setEditLeaveType] = useState<number | null>(null);
  const [isCreatingLeaveType, setIsCreatingLeaveType] = useState(false);
  const [selectedLeaveTypeEdit, setSelectedLeaveType] =
    useState<LeaveType | null>(null);

  const handleCreateLeaveType = async (values: any) => {
    try {
      await createLeaveType(values);
      alert("LeaveType created!");
      setIsCreatingLeaveType(false);
      fetchLeaveTypes();
    } catch {
      alert("Error creating LeaveType.");
    }
  };

  const handleUpdateLeaveType = async (values: any) => {
    try {
      await updateLeaveType(values);
      alert("LeaveType updated!");
      setSelectedLeaveType(null);
      setEditLeaveType(null);
      fetchLeaveTypes();
    } catch {
      alert("Error updating LeaveType.");
    }
  };

  const handleDeleteLeaveType = async (id: number) => {
    try {
      await deleteLeaveType(id);
      alert("LeaveType deleted!");
      fetchLeaveTypes();
    } catch {
      alert("Error deleting LeaveType.");
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
      console.log("Selected Leave Type:", selectedLeaveType);
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
  } = useHolidayConfigs();
  const [editHolidayConfig, setEditHolidayConfig] = useState<number | null>(
    null
  );
  const [isCreatingHolidayConfig, setIsCreatingHolidayConfig] = useState(false);
  const [selectedHolidayConfigEdit, setSelectedHolidayConfigEdit] =
    useState<HolidayConfig | null>(null);

  const handleCreateHolidayConfig = async (values: any) => {
    try {
      await createHolidayConfig(values);
      alert("HolidayConfig created!");
      setIsCreatingHolidayConfig(false);
      fetchHolidayConfigs();
    } catch {
      alert("Error creating HolidayConfig.");
    }
  };

  const handleUpdateHolidayConfig = async (values: any) => {
    try {
      await updateHolidayConfig(values);
      alert("HolidayConfig updated!");
      setSelectedHolidayConfigEdit(null);
      setEditHolidayConfig(null);
      fetchHolidayConfigs();
    } catch {
      alert("Error updating HolidayConfig.");
    }
  };

  const handleDeleteHolidayConfig = async (id: number) => {
    try {
      await deleteHolidayConfig(id);
      alert("HolidayConfig deleted!");
      fetchHolidayConfigs();
    } catch {
      alert("Error deleting HolidayConfig.");
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
      console.log("Selected Leave Type:", selectedHolidayConfig);
      setSelectedHolidayConfigEdit(selectedHolidayConfig);
    }
  }, [editHolidayConfig, holidayConfigs]);

  return (
    <Collapsible title="Leave Calendar">
      <div className="px-4 grid grid-cols-1">
        {holidayConfigs.length > 0 ? (
          holidayConfigs.map((holidayConfig: HolidayConfig) => (
            <div key={holidayConfig.name} className="flex items-end gap-x-6">
              <div className="w-1/2 md:w-1/3 space-y-1">
                <p>Holiday Name</p>
                <div className="px-3 py-1 rounded-md bg-gray-300">
                  {holidayConfig.name}
                </div>
              </div>
              <div className="w-1/2 md:w-1/3 space-y-1">
                <p>Description</p>
                <button
                  onClick={() => {
                    setEditHolidayConfig(holidayConfig.id!);
                  }}
                  className="w-full px-3 py-1 rounded-md bg-gray-300 text-left"
                >
                  View Details
                </button>
              </div>
              <button
                onClick={() =>
                  handleDeleteHolidayConfig(holidayConfig.id!)
                }
                className="p-1"
              >
                <TrashSimple className="text-red-600" size={24} />
              </button>
            </div>
          ))
        ) : (
          <div className="w-full flex items-center gap-x-6 text-center text-lg font-semibold">
            <p>No holidays found.</p>
          </div>
        )}
        <button
          onClick={() => setIsCreatingHolidayConfig(true)}
          type="button"
          className="mt-6 text-white text-xl bg-blue-500 rounded-full w-7 h-7 grid place-items-center"
        >
          +
        </button>
      </div>
      <div className="mt-4 px-4 grid grid-cols-1">
        {leaveTypes.length > 0 ? (
          leaveTypes.map((leaveType: LeaveType) => (
            <div key={leaveType.name} className="flex items-end gap-x-6">
              <div className="w-1/2 md:w-1/3 space-y-1">
                <p>Leave Type</p>
                <div className="px-3 py-1 rounded-md bg-gray-300">
                  {leaveType.name}
                </div>
              </div>
              <div className="w-1/2 md:w-1/3 space-y-1">
                <p>Description</p>
                <button
                  onClick={() => {
                    setEditLeaveType(leaveType.id!);
                  }}
                  className="w-full px-3 py-1 rounded-md bg-gray-300 text-left"
                >
                  View Details
                </button>
              </div>
              <button
                onClick={() => handleDeleteLeaveType(leaveType.id!)}
                className="p-1"
              >
                <TrashSimple className="text-red-600" size={24} />
              </button>
            </div>
          ))
        ) : (
          <div className="w-full flex items-center gap-x-6 text-center text-lg font-semibold">
            <p>No leave types found.</p>
          </div>
        )}
        <button
          onClick={() => setIsCreatingLeaveType(true)}
          type="button"
          className="mt-6 text-white text-xl bg-blue-500 rounded-full w-7 h-7 grid place-items-center"
        >
          +
        </button>
      </div>
      {selectedLeaveTypeEdit && (
        <LeaveTypeUpdateModal
          initialData={selectedLeaveTypeEdit}
          onSubmit={handleUpdateLeaveType}
          onClose={() => {
            setSelectedLeaveType(null);
            setEditLeaveType(null);
          }}
        />
      )}
      {isCreatingLeaveType && (
        <LeaveTypeCreateModal
          onSubmit={handleCreateLeaveType}
          onClose={() => setIsCreatingLeaveType(false)}
        />
      )}
      {selectedHolidayConfigEdit && (
        <LeaveHolidayUpdateModal
          initialData={selectedHolidayConfigEdit}
          onSubmit={handleUpdateHolidayConfig}
          onClose={() => {
            setSelectedHolidayConfigEdit(null);
            setEditHolidayConfig(null);
          }}
        />
      )}
      {isCreatingHolidayConfig && (
        <LeaveHolidayCreateModal
          onSubmit={handleCreateHolidayConfig}
          onClose={() => setIsCreatingHolidayConfig(false)}
        />
      )}
    </Collapsible>
  );
}
