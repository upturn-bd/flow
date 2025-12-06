"use client";
import { useEffect, useState } from "react";
import RequisitionCreatePage, { RequisitionDraftPage } from "./RequisitionCreatePage";
import { useRequisitionTypes } from "@/hooks/useConfigTypes";
import { Clock, FileText, TrashSimple, Scroll } from "@phosphor-icons/react";
import { motion } from "framer-motion";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { EmptyState } from "@/components/ui/EmptyState";

export default function UpcomingPage({ setActiveTab }: { setActiveTab: (tab:string) => void }) {
  const [upcoming, setUpcoming] = useState([]);
  const [isCreatingRequisition, setIsCreatingRequisition] = useState(false);
  const { requisitionTypes, fetchRequisitionTypes } = useRequisitionTypes();
  const [displayDraftId, setDisplayDraftId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  function handleDeleteDraft(draftId: number) {
    const updatedUpcoming = upcoming.filter(
      (draft: { draft_id: number }) => draft.draft_id !== draftId
    );
    setUpcoming(updatedUpcoming);
    localStorage.setItem("requisition-drafts", JSON.stringify(updatedUpcoming));
  }

  useEffect(() => {
    const drafts = localStorage.getItem("requisition-drafts");
    if (drafts) {
      const parsedDrafts = JSON.parse(drafts);
      setUpcoming(parsedDrafts);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchRequisitionTypes();
  }, [fetchRequisitionTypes]);

  const fadeIn = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.4 } }
  };

  return (
    <div className="min-h-[60vh]">
      {!isCreatingRequisition && !displayDraftId && (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          className="p-4 sm:p-6"
        >
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-xl font-semibold text-foreground-primary">Saved Drafts</h1>
            <button
              onClick={() => setIsCreatingRequisition(true)}
              className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md flex items-center gap-2 transition-colors shadow-sm"
            >
              <span className="hidden sm:inline">Create New</span>
              <span className="sm:hidden">New</span>
              <span className="hidden sm:inline">Requisition</span>
            </button>
          </div>

          {isLoading ? (
            <LoadingSpinner
              icon={Scroll}
              text="Loading drafts..."
              color="blue"
              height="h-60"
            />
          ) : upcoming.length === 0 ? (
            <EmptyState
              icon={Clock}
              title="No saved drafts found"
              description="Create your first requisition to get started."
              action={{
                label: "Create your first requisition",
                onClick: () => setIsCreatingRequisition(true)
              }}
            />
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {upcoming.map((item: any, index: number) => {
                const requisitionType = requisitionTypes.find(
                  (type) => type.id !== undefined && type.id === item.requisition_category_id
                );

                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-surface-primary shadow-sm hover:shadow-md transition-shadow rounded-lg overflow-hidden border border-border-primary"
                  >
                    <div className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h2 className="text-lg font-semibold text-blue-700 mb-1">
                            Draft {index + 1}
                          </h2>
                          {requisitionType && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {requisitionType.name || "N/A"}
                            </span>
                          )}
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setDisplayDraftId(item.draft_id)}
                            className="p-1.5 text-blue-600 hover:bg-primary-50 dark:hover:bg-primary-950 rounded-full transition-colors"
                            aria-label="PencilSimple draft"
                          >
                            <FileEdit className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteDraft(item.draft_id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                            aria-label="Delete draft"
                          >
                            <TrashSimple className="h-5 w-5" />
                          </button>
                        </div>
                      </div>

                      <div className="mt-3 text-foreground-secondary text-sm line-clamp-2">
                        {item.description || "No description provided."}
                      </div>

                      <div className="mt-4 pt-3 border-t border-border-primary flex justify-between items-center">
                        <div className="text-sm text-foreground-tertiary">
                          {item.is_one_off ? "One-off request" : "Regular request"}
                        </div>
                        <button
                          onClick={() => setDisplayDraftId(item.draft_id)}
                          className="text-sm font-medium text-blue-600 hover:text-blue-800"
                        >
                          Continue editing
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      )}

      {isCreatingRequisition && (
        <RequisitionCreatePage
          onClose={() => setIsCreatingRequisition(false)}
          setActiveTab={setActiveTab}
        />
      )}

      {displayDraftId && (
        <RequisitionDraftPage
          onClose={() => setDisplayDraftId(null)}
          draftId={displayDraftId}
        />
      )}
    </div>
  );
}
