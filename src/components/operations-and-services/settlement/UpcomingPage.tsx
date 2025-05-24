"use client";
import { useClaimTypes } from "@/hooks/useConfigTypes";
import { useEffect, useState } from "react";
import SettlementCreatePage from "./SettlementCreatePage";
import { Receipt, FileEdit, Trash2, Clock } from "lucide-react";
import { motion } from "framer-motion";

export default function UpcomingPage() {
  const [upcoming, setUpcoming] = useState([]);
  const [isCreatingSettlement, setIsCreatingSettlement] = useState(false);
  const { claimTypes, fetchClaimTypes } = useClaimTypes();
  const [displayDraftId, setDisplayDraftId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  function handleDeleteDraft(draftId) {
    const updatedUpcoming = upcoming.filter(
      (draft) => draft.draft_id !== draftId
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
          className="p-4 sm:p-6 max-w-4xl mx-auto"
        >
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-xl font-semibold text-gray-800">Settlement Drafts</h1>
            <button
              onClick={() => setIsCreatingSettlement(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center gap-2 transition-colors shadow-sm"
            >
              <Receipt className="h-4 w-4" />
              <span className="hidden sm:inline">Create New Settlement</span>
              <span className="sm:hidden">New Settlement</span>
            </button>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-60">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : upcoming.length === 0 ? (
            <div className="mt-10 flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg border border-gray-200">
              <Clock className="h-12 w-12 text-gray-400 mb-3" />
              <p className="text-gray-600 text-center">No settlement drafts found.</p>
              <button
                onClick={() => setIsCreatingSettlement(true)}
                className="mt-4 text-blue-600 hover:text-blue-800 font-medium"
              >
                Create your first settlement claim
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {upcoming.map((item, index) => {
                const claimType = claimTypes.find(
                  (type) => type.id === item.settlement_type_id
                );
                
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white shadow-sm hover:shadow-md transition-shadow rounded-lg overflow-hidden border border-gray-100"
                  >
                    <div className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h2 className="text-lg font-semibold text-blue-700 mb-1">
                            Draft {index + 1}
                          </h2>
                          {claimType && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {claimType.settlement_item || "N/A"}
                            </span>
                          )}
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setDisplayDraftId(item.draft_id)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                            aria-label="Edit draft"
                          >
                            <FileEdit className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteDraft(item.draft_id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                            aria-label="Delete draft"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="mt-3 text-gray-600 text-sm line-clamp-2">
                        {item.description || "No description provided."}
                      </div>
                      
                      {item.amount && (
                        <div className="mt-2 font-medium text-green-700">
                          Amount: ${parseFloat(item.amount).toFixed(2)}
                        </div>
                      )}
                      
                      <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center">
                        <div className="text-sm text-gray-500">
                          {new Date(item.date || Date.now()).toLocaleDateString()}
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
      
      {isCreatingSettlement && (
        <SettlementCreatePage onClose={() => setIsCreatingSettlement(false)} />
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
