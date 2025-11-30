"use client";
import { useClaimTypes } from "@/hooks/useConfigTypes";
import { useEffect, useState } from "react";
import SettlementCreatePage from "./SettlementCreatePage";
import SettlementDraftPage from "./SettlementDraftPage";
import { Receipt, FileEdit, Trash, Clock } from "@/lib/icons";
import { motion } from "framer-motion";

export default function UpcomingPage({setActiveTab} : {setActiveTab: (tab:string) => void}) {
  const [upcoming, setUpcoming] = useState([]);
  const [isCreatingSettlement, setIsCreatingSettlement] = useState(false);
  const { claimTypes, fetchClaimTypes } = useClaimTypes();
  const [displayDraftId, setDisplayDraftId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  function handleDeleteDraft(draftId: number) {
    const updatedUpcoming = upcoming.filter(
      (draft: any) => draft.draft_id !== draftId
    );
    setUpcoming(updatedUpcoming);
    localStorage.setItem("settlement_drafts", JSON.stringify(updatedUpcoming));
  }

  useEffect(() => {
    const drafts = localStorage.getItem("settlement_drafts");
    if (drafts) {
      const parsedDrafts = JSON.parse(drafts);
      setUpcoming(parsedDrafts);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchClaimTypes();
  }, [fetchClaimTypes]);

  const fadeIn = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.4 } }
  };

  return (
    <div className="min-h-[60vh]">
      {!isCreatingSettlement && !displayDraftId && (
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          className="p-4 sm:p-6"
        >
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-xl font-semibold text-foreground-primary">Settlement Drafts</h1>
            <button
              onClick={() => setIsCreatingSettlement(true)}
              className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md flex items-center gap-2 transition-colors shadow-sm"
            >
              <Receipt className="h-4 w-4" />
              <span className="hidden sm:inline">Create New Settlement</span>
              <span className="sm:hidden">New Settlement</span>
            </button>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-60">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
            </div>
          ) : upcoming.length === 0 ? (
            <div className="mt-10 flex flex-col items-center justify-center p-8 bg-background-secondary dark:bg-background-tertiary rounded-lg border border-border-primary">
              <Clock className="h-12 w-12 text-foreground-tertiary mb-3" />
              <p className="text-foreground-secondary text-center">No settlement drafts found.</p>
              <button
                onClick={() => setIsCreatingSettlement(true)}
                className="mt-4 text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 font-medium"
              >
                Create your first settlement claim
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {upcoming.map((item: any, index: number) => {
                const claimType = claimTypes.find(
                  (type: any) => type.id === item.settlement_type_id
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
                          <h2 className="text-lg font-semibold text-primary-700 dark:text-primary-400 mb-1">
                            Draft {index + 1}
                          </h2>
                          {claimType && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-300">
                              {claimType.settlement_item || "N/A"}
                            </span>
                          )}
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setDisplayDraftId(item.draft_id)}
                            className="p-1.5 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-full transition-colors"
                            aria-label="Edit draft"
                          >
                            <FileEdit className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteDraft(item.draft_id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full transition-colors"
                            aria-label="Delete draft"
                          >
                            <Trash className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="mt-3 text-foreground-secondary text-sm line-clamp-2">
                        {item.description || "No description provided."}
                      </div>
                      
                      {item.amount && (
                        <div className="mt-2 font-medium text-green-700 dark:text-green-500">
                          Amount: ${parseFloat(item.amount).toFixed(2)}
                        </div>
                      )}
                      
                      <div className="mt-4 pt-3 border-t border-border-primary flex justify-between items-center">
                        <div className="text-sm text-foreground-tertiary">
                          {new Date(item.date || Date.now()).toLocaleDateString()}
                        </div>
                        <button
                          onClick={() => setDisplayDraftId(item.draft_id)}
                          className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300"
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
      
      {isCreatingSettlement && (
        <SettlementCreatePage 
          onClose={() => setIsCreatingSettlement(false)} 
          setActiveTab={setActiveTab}
          />
      )}
      
      {displayDraftId && (
        <SettlementDraftPage
          onClose={() => setDisplayDraftId(null)}
          draftId={displayDraftId}
        />
      )}
    </div>
  );
}
