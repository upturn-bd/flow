"use client";
import { useEffect, useState } from "react";
import RequisitionCreatePage, { RequisitionDraftPage } from "./RequisitionCreatePage";
import { useRequisitionTypes } from "@/hooks/useRequisitionTypes";

export default function UpcomingPage() {
  const [upcoming, setUpcoming] = useState([]);
  const [isCreatingRequisition, setIsCreatingRequisition] = useState(false);
  const { requisitionTypes, fetchRequisitionTypes } = useRequisitionTypes();
  const [displayDraftId, setDisplayDraftId] = useState<number | null>(null);

  function handleDeleteDraft(draftId) {
    const updatedUpcoming = upcoming.filter(
      (draft, i) => draft.draft_id !== draftId
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
  }, []);

  useEffect(() => {
    fetchRequisitionTypes();
  }, [fetchRequisitionTypes]);

  return (
    <div>
      {!isCreatingRequisition && !displayDraftId && (
        <div className="p-6 max-w-4xl mx-auto lg:mx-20">
          <div className="flex justify-end">
            <button
              onClick={() => setIsCreatingRequisition(true)}
              className="bg-yellow-500 px-4 py-2 rounded-md"
            >
              New Entry
            </button>
          </div>
          {upcoming.length === 0 && (
            <div className="mt-20 flex items-center justify-center">
              Sorry, no items available.
            </div>
          )}

          {upcoming.length > 0 && (
            <div className="grid grid-cols-1 gap-6">
              {upcoming.map((item, index) => (
                <div
                  key={index}
                  className="bg-white shadow-md rounded-lg p-4 flex flex-col gap-2"
                >
                  <h2 className="text-lg font-bold text-[#0052CC]">
                    Draft {index + 1}
                  </h2>
                  <p>
                    Category:
                    {requisitionTypes.find(
                      (type) => type.id === item.requisition_category_id
                    )?.name || "N/A"}
                  </p>
                  <p>{item.description}</p>
                  <div className="flex justify-end gap-4">
                    <button
                      onClick={() => {
                        setDisplayDraftId(item.draft_id);
                      }}
                      className="px-3 py-2 bg-blue-500 text-white hover:bg-blue-700"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteDraft(item.draft_id)}
                      className="px-3 py-2 bg-red-500 text-white hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {isCreatingRequisition && (
        <RequisitionCreatePage
          onClose={() => setIsCreatingRequisition(false)}
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
