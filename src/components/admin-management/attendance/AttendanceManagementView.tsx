"use client";

import { useEffect, useState } from "react";
import Collapsible from "../CollapsibleComponent";
import AttendanceCreateModal, {
  AttendanceUpdateModal,
} from "./AttendanceModal";
import { Site, useSites } from "@/hooks/useAttendanceManagement";
import { TrashSimple } from "@phosphor-icons/react";

export default function AttendanceManagementView() {
  const { sites, loading, fetchSites, createSite, deleteSite, updateSite } =
    useSites();
  const [editSite, setEditSite] = useState<number | null>(null);
  const [isCreatingSite, setIsCreatingSite] = useState(false);
  const [selectedSiteEdit, setSelectedSiteEdit] = useState<Site | null>(null);

  const handleCreateSite = async (values: any) => {
    try {
      await createSite(values);
      alert("Site created!");
      setIsCreatingSite(false);
      fetchSites();
    } catch {
      alert("Error creating Site.");
    }
  };

  const handleUpdateSite = async (values: any) => {
    try {
      await updateSite(values);
      alert("Site updated!");
      setEditSite(null);
      setSelectedSiteEdit(null);
      fetchSites();
    } catch {
      alert("Error updating Site.");
    }
  };

  const handleDeleteSite = async (id: number) => {
    try {
      await deleteSite(id);
      alert("Site deleted!");
      fetchSites();
    } catch {
      alert("Error deleting Site.");
    }
  };

  useEffect(() => {
    fetchSites();
  }, [fetchSites]);

  useEffect(() => {
    if (editSite) {
      const selectedSite = sites.filter((site) => site.id === editSite)[0];
      setSelectedSiteEdit(selectedSite);
    }
  }, [editSite, sites]);

  return (
    <Collapsible title="Attendance Management">
      <div className="px-4 grid grid-cols-1">
        {sites.length > 0 ? (
          sites.map((site: Site) => (
            <div key={site.name} className="flex items-end gap-x-6">
              <div className="w-1/2 md:w-1/3 space-y-1">
                <p>Site Name</p>
                <div className="px-3 py-1 rounded-md bg-gray-300">
                  {site.name}
                </div>
              </div>
              <div className="w-1/2 md:w-1/3 space-y-1">
                <p>Description</p>
                <button
                  onClick={() => {
                    setEditSite(parseInt(site.id));
                  }}
                  className="w-full px-3 py-1 rounded-md bg-gray-300 text-left"
                >
                  View Details
                </button>
              </div>
              <button
                onClick={() => handleDeleteSite(parseInt(site.id))}
                className="p-1"
              >
                <TrashSimple className="text-red-600" size={24} />
              </button>
            </div>
          ))
        ) : (
          <div className="w-full flex items-center gap-x-6 text-center text-lg font-semibold">
            <p>No attendance records found.</p>
          </div>
        )}
        <button
          onClick={() => setIsCreatingSite(true)}
          type="button"
          className="mt-6 text-white text-xl bg-blue-500 rounded-full w-7 h-7 grid place-items-center"
        >
          +
        </button>
      </div>
      {selectedSiteEdit && (
        <AttendanceUpdateModal
          initialData={selectedSiteEdit}
          onSubmit={handleUpdateSite}
          onClose={() => setSelectedSiteEdit(null)}
        />
      )}
      {isCreatingSite && (
        <AttendanceCreateModal
          onSubmit={handleCreateSite}
          onClose={() => setIsCreatingSite(false)}
        />
      )}
    </Collapsible>
  );
}
