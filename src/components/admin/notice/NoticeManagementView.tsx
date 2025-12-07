"use client";

import { useEffect, useState } from "react";
import Collapsible from "../CollapsibleComponent";
import NoticesCreateModal from "./NoticeModal";
import { NewspaperClipping, TrashSimple, Plus } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { AnimatePresence } from "framer-motion";

import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { useNoticeTypes } from "@/hooks/useNotice";

export default function NoticeView() {
  const {
    newsAndNoticeTypes,
    fetchNoticeTypes,
    createNoticeType,
    deleteNoticeType,
    loading
  } = useNoticeTypes();
  const [isCreatingNewsAndNoticeType, setIsCreatingNewsAndNoticeType] =
    useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState<number | null>(null);

  const handleCreateNewsAndNoticeType = async (values: any) => {
    try {
      setIsLoading(true);
      await createNoticeType(values);
      setIsCreatingNewsAndNoticeType(false);
      fetchNoticeTypes();
    } catch (error) {
      console.error("Error creating news & notice type:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteNewsAndNoticeType = async (id: number) => {
    try {
      setDeleteLoading(id);
      await deleteNoticeType(id);
      fetchNoticeTypes();
    } catch (error) {
      console.error("Error deleting news & notice type:", error);
    } finally {
      setDeleteLoading(null);
    }
  };

  useEffect(() => {
    fetchNoticeTypes();
  }, [fetchNoticeTypes]);

  return (
    <Collapsible title="News & Notice">
      <div className="px-4 space-y-6 py-4">
        <div className="flex items-center gap-3 mb-4">
          <NewspaperClipping size={22} weight="duotone" className="text-foreground-secondary" />
          <h3 className="text-lg font-semibold text-foreground-primary">News & Notice Types</h3>
        </div>

        {loading ? (
          <LoadingSpinner
            icon={NewspaperClipping}
            text="Loading news & notice types..."
            height="h-40"
            color="gray"
          />
        ) : (
          <div>
            <AnimatePresence>
              {newsAndNoticeTypes.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {newsAndNoticeTypes.map((type, idx) => (
                    <div
                      key={type.id || idx}
                      className="flex items-center bg-background-tertiary rounded-lg px-3 py-2 border border-border-primary shadow-sm"
                    >
                      <span className="text-foreground-primary font-medium">{type.name}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => type.id !== undefined && handleDeleteNewsAndNoticeType(type.id)}
                        isLoading={deleteLoading === type.id}
                        disabled={deleteLoading === type.id}
                        className="ml-2 p-1 rounded-full text-foreground-tertiary hover:bg-error/10 hover:text-error"
                      >
                        <TrashSimple size={16} weight="bold" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-background-secondary rounded-lg p-6 text-center border border-border-primary">
                  <div className="flex justify-center mb-3">
                    <NewspaperClipping size={40} weight="duotone" className="text-foreground-tertiary" />
                  </div>
                  <p className="text-foreground-tertiary mb-1">No news & notice types found</p>
                  <p className="text-foreground-tertiary text-sm mb-4">Add types to categorize news and notices</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        )}

        <div className="flex justify-end mt-4">
          <Button
            variant="primary" 
            onClick={() => setIsCreatingNewsAndNoticeType(true)}
            className="flex items-center gap-2 bg-gray-800 hover:bg-gray-900 text-white"
          >
            <Plus size={16} weight="bold" />
            Add Type
          </Button>
        </div>

        <AnimatePresence>
          {isCreatingNewsAndNoticeType && (
            <NoticesCreateModal
              onSubmit={handleCreateNewsAndNoticeType}
              onClose={() => setIsCreatingNewsAndNoticeType(false)}
              isOpen={isCreatingNewsAndNoticeType}
              isLoading={isLoading}
            />
          )}
        </AnimatePresence>
      </div>
    </Collapsible>
  );
}
