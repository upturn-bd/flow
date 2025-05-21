"use client";

import { useEffect, useState } from "react";
import Collapsible from "../CollapsibleComponent";
import NewsAndNoticesCreateModal from "./NewsAndNoticeModal";
import { useNewsAndNoticesTypes } from "@/hooks/useNewsAndNotices";

export default function NewsAndNoticeView() {
  const {
    newsAndNoticeTypes,
    fetchNewsAndNoticesTypes,
    createNewsAndNoticesType,
    deleteNewsAndNoticesType,
  } = useNewsAndNoticesTypes();
  const [isCreatingNewsAndNoticeType, setIsCreatingNewsAndNoticeType] =
    useState(false);

  const handleCreateNewsAndNoticeType = async (values: any) => {
    try {
      await createNewsAndNoticesType(values);
      alert("NewsAndNoticeType created!");
      setIsCreatingNewsAndNoticeType(false);
      fetchNewsAndNoticesTypes();
    } catch {
      alert("Error creating NewsAndNoticeType.");
    }
  };

  const handleDeleteNewsAndNoticeType = async (id: number) => {
    try {
      await deleteNewsAndNoticesType(id);
      alert("NewsAndNoticeType deleted!");
      fetchNewsAndNoticesTypes();
    } catch {
      alert("Error deleting NewsAndNoticeType.");
    }
  };

  useEffect(() => {
    fetchNewsAndNoticesTypes();
  }, [fetchNewsAndNoticesTypes]);

  return (
    <Collapsible title="News & Notice">
      <div className="px-4 space-y-2 py-2">
        <label className="block font-bold text-blue-800 mb-2">
          News & Notice Type
        </label>
        <div className="flex flex-wrap gap-2">
          {newsAndNoticeTypes.length > 0 ? (
            newsAndNoticeTypes.map((type, idx) => (
              <div
                key={idx}
                className="flex items-center bg-white rounded-sm shadow-sm px-3 py-1"
              >
                {type.name}
                <button
                  type="button"
                  className="ml-2 text-gray-600"
                  onClick={() => handleDeleteNewsAndNoticeType(type.id!)}
                >
                  ✕
                </button>
              </div>
            ))
          ) : (
            <div className="w-full flex items-center gap-x-6 text-center text-lg font-semibold">
              <p>No news and notice type found.</p>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={() => setIsCreatingNewsAndNoticeType(true)}
          className="mt-4 text-white text-xl bg-blue-500 rounded-full w-7 h-7 grid place-items-center"
        >
          +
        </button>
        {isCreatingNewsAndNoticeType && (
          <NewsAndNoticesCreateModal
            onSubmit={handleCreateNewsAndNoticeType}
            onClose={() => setIsCreatingNewsAndNoticeType(false)}
          />
        )}
      </div>
    </Collapsible>
  );
}
