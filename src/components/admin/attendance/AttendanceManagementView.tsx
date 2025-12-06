"use client";

import { useEffect, useState } from "react";
import Collapsible from "../CollapsibleComponent";
import AttendanceCreateModal, {
  AttendanceUpdateModal,
} from "./AttendanceModal";
import { Site, useSites } from "@/hooks/useAttendanceManagement";
import { Buildings, Plus, MapPin, Clock } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { AnimatePresence } from "framer-motion";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { EntityCard, EntityCardGrid, EntityCardMetaItem, EmptyState } from "@/components/ui";

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
        </div>

        {loading ? (
          <LoadingSpinner
            icon={Buildings}
            text="Loading attendance sites..."
            height="h-40"
            color="gray"
          />
        ) : (
          <AnimatePresence>
            {sites.length > 0 ? (
              <EntityCardGrid columns={3}>
                {sites.map((site: Site, idx) => (
                  <EntityCard
                    key={site.id || idx}
                    title={site.name}
                    icon={Buildings}
                    onDelete={site.id !== undefined ? () => handleDeleteSite(site.id!) : undefined}
                    deleteLoading={deleteLoading === site.id}
                    onView={() => setEditSite(site.id!)}
                    metadata={
                      <>
                        <EntityCardMetaItem icon={MapPin}>
                          {parseFloat(site.latitude.toString()).toFixed(5)}, {parseFloat(site.longitude.toString()).toFixed(5)}
                        </EntityCardMetaItem>
                        <EntityCardMetaItem icon={Clock}>
                          {site.check_in} - {site.check_out}
                        </EntityCardMetaItem>
                      </>
                    }
                  />
                ))}
              </EntityCardGrid>
            ) : (
              <EmptyState
                icon={Buildings}
                title="No attendance sites found"
                description="Add sites to manage attendance locations"
              />
            )}
          </AnimatePresence>
        )}

        <div className="flex justify-end mt-4">
          <Button
            variant="primary" 
            onClick={() => setIsCreatingSite(true)}
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