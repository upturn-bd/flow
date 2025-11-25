"use client";

import { useEffect, useState } from "react";
import Collapsible from "../CollapsibleComponent";
import AttendanceCreateModal, {
  AttendanceUpdateModal,
} from "./AttendanceModal";
import { Site, useSites } from "@/hooks/useAttendanceManagement";
import { TrashSimple, Buildings, Plus, MapPin, Clock, Eye } from "@/lib/icons";
import { Button } from "@/components/ui/button";
import { AnimatePresence } from "framer-motion";

import LoadingSpinner from "@/components/ui/LoadingSpinner";

export default function AttendanceManagementView() {
  const { sites, fetchSites, createSite, deleteSite, updateSite, loading } =
    useSites();
  const [editSite, setEditSite] = useState<number | null>(null);
  const [isCreatingSite, setIsCreatingSite] = useState(false);
  const [selectedSiteEdit, setSelectedSiteEdit] = useState<Site | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState<number | null>(null);

  const handleCreateSite = async (values: any) => {
    try {
      setIsLoading(true);
      await createSite(values);
      setIsCreatingSite(false);
      fetchSites();
    } catch (error) {
      console.error("Error creating site:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateSite = async (values: any) => {
    try {
      setIsLoading(true);
      if (editSite) {
        await updateSite(editSite, values);
      }
      setEditSite(null);
      setSelectedSiteEdit(null);
      fetchSites();
    } catch (error) {
      console.error("Error updating site:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSite = async (id: number) => {
    try {
      setDeleteLoading(id);
      await deleteSite(id);
      fetchSites();
    } catch (error) {
      console.error("Error deleting site:", error);
    } finally {
      setDeleteLoading(null);
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
      <div className="px-4 space-y-6 py-4">
        <div className="flex items-center gap-3 mb-4">
          <Buildings size={22} weight="duotone" className="text-foreground-secondary" />
          <h3 className="text-lg font-semibold text-foreground-primary">Attendance Sites</h3>
          <Buildings size={22} weight="duotone" className="text-foreground-secondary" />
          <h3 className="text-lg font-semibold text-foreground-primary">Attendance Sites</h3>
        </div>

        {loading ? (
          <LoadingSpinner
            icon={Buildings}
            text="Loading attendance sites..."
            height="h-40"
            color="gray"
          />
        ) : (
          <div>
            <AnimatePresence>
              {sites.length > 0 ? (
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                  {sites.map((site: Site, idx) => (
                    <div
                      key={site.id || idx}
                      className="bg-surface-primary p-4 rounded-lg border border-border-primary shadow-sm hover:shadow-md transition-all"
                      className="bg-surface-primary p-4 rounded-lg border border-border-primary shadow-sm hover:shadow-md transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2 mb-2">
                          <Buildings size={20} weight="duotone" className="text-foreground-secondary" />
                          <h4 className="font-medium text-foreground-primary">{site.name}</h4>
                          <Buildings size={20} weight="duotone" className="text-foreground-secondary" />
                          <h4 className="font-medium text-foreground-primary">{site.name}</h4>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => site.id !== undefined && handleDeleteSite(site.id)}
                          isLoading={deleteLoading === site.id}
                          disabled={deleteLoading === site.id}
                          className="p-1 rounded-full text-foreground-tertiary hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-500"
                        >
                          <TrashSimple size={16} weight="bold" />
                        </Button>
                      </div>
                      
                      <div className="mt-2 space-y-1.5">
                        <div className="flex items-center gap-1.5 text-sm text-foreground-secondary">
                          <MapPin size={16} weight="duotone" className="text-foreground-tertiary" />
                        <div className="flex items-center gap-1.5 text-sm text-foreground-secondary">
                          <MapPin size={16} weight="duotone" className="text-foreground-tertiary" />
                          <span className="truncate">
                            {parseFloat(site.latitude.toString()).toFixed(5)}, {parseFloat(site.longitude.toString()).toFixed(5)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-sm text-foreground-secondary">
                          <Clock size={16} weight="duotone" className="text-foreground-tertiary" />
                        <div className="flex items-center gap-1.5 text-sm text-foreground-secondary">
                          <Clock size={16} weight="duotone" className="text-foreground-tertiary" />
                          <span>
                            {site.check_in} - {site.check_out}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex justify-end mt-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditSite(site.id!)}
                          className="text-sm flex items-center gap-1 text-foreground-secondary hover:text-foreground-primary"
                          className="text-sm flex items-center gap-1 text-foreground-secondary hover:text-foreground-primary"
                        >
                          <Eye size={16} weight="bold" />
                          View Details
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-background-secondary dark:bg-background-tertiary rounded-lg p-6 text-center border border-border-primary">
                <div className="bg-background-secondary dark:bg-background-tertiary rounded-lg p-6 text-center border border-border-primary">
                  <div className="flex justify-center mb-3">
                    <Buildings size={40} weight="duotone" className="text-foreground-tertiary" />
                    <Buildings size={40} weight="duotone" className="text-foreground-tertiary" />
                  </div>
                  <p className="text-foreground-tertiary mb-1">No attendance sites found</p>
                  <p className="text-foreground-tertiary text-sm mb-4">Add sites to manage attendance locations</p>
                  <p className="text-foreground-tertiary mb-1">No attendance sites found</p>
                  <p className="text-foreground-tertiary text-sm mb-4">Add sites to manage attendance locations</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        )}

        <div className="flex justify-end mt-4">
          <Button
            variant="primary" 
            onClick={() => setIsCreatingSite(true)}
            className="flex items-center gap-2 bg-primary-700 dark:bg-primary-600 hover:bg-primary-800 dark:hover:bg-primary-700 text-white"
            className="flex items-center gap-2 bg-primary-700 dark:bg-primary-600 hover:bg-primary-800 dark:hover:bg-primary-700 text-white"
          >
            <Plus size={16} weight="bold" />
            Add Site
          </Button>
        </div>

        <AnimatePresence>
          {selectedSiteEdit && (
            <AttendanceUpdateModal
              initialData={selectedSiteEdit}
              onSubmit={handleUpdateSite}
              onClose={() => {
                setSelectedSiteEdit(null);
                setEditSite(null);
              }}
              isLoading={isLoading}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isCreatingSite && (
            <AttendanceCreateModal
              onSubmit={handleCreateSite}
              onClose={() => setIsCreatingSite(false)}
              isLoading={isLoading}
            />
          )}
        </AnimatePresence>
      </div>
    </Collapsible>
  );
} 