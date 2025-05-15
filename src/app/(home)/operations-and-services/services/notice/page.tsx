"use client";
import NoticeCreateModal, {
  NoticeUpdateModal,
} from "@/components/operations-and-services/notice/NoticeModal";
import { Notice, useNotices } from "@/hooks/useNotice";
import { useEffect, useState } from "react";

export default function NoticePage() {
  const {
    notices,
    loading,
    fetchNotices,
    createNotice,
    updateNotice,
    deleteNotice,
  } = useNotices();
  const [isCreatingNotice, setIsCreatingNotice] = useState(false);
  const [editNotice, setEditNotice] = useState<Notice | null>(null);

  const handleCreateNotice = async (values: any) => {
    try {
      await createNotice(values);
      alert("Notice created!");
      setIsCreatingNotice(false);
      fetchNotices();
    } catch {
      alert("Error creating Notice.");
    }
  };

  const handleUpdateNotice = async (values: any) => {
    try {
      await updateNotice(values);
      alert("Notice updated!");
      setEditNotice(null);
      setEditNotice(null);
      fetchNotices();
    } catch {
      alert("Error updating Notice.");
    }
  };

  const handleDeleteNotice = async (id: number) => {
    try {
      await deleteNotice(id);
      alert("Notice deleted!");
      fetchNotices();
    } catch {
      alert("Error deleting Notice.");
    }
  };

  useEffect(() => {
    fetchNotices();
  }, [fetchNotices]);

  if (loading) {
    return (
      <div className="mt-20 flex items-center justify-center">Loading...</div>
    );
  }

  return (
    <div>
      {!loading && !isCreatingNotice && !editNotice && (
        <div className="space-y-6 py-12 max-w-6xl mx-auto p-6">
          <h1 className="text-2xl font-bold text-blue-700">Notices</h1>
          <button
            type="button"
            onClick={() => setIsCreatingNotice(true)}
            className="mt-4 text-white text-xl bg-blue-500 rounded-full w-7 h-7 grid place-items-center"
          >
            +
          </button>
          <div className="grid grid-cols-1 gap-4">
            {notices.length > 0 &&
              notices.map((notice) => (
                <div
                  key={notice.id}
                  className="bg-gray-300 shadow-md rounded-lg p-4 flex flex-col gap-2"
                >
                  <h2 className="text-lg font-bold">{notice.title}</h2>
                  <p>{notice.description}</p>
                  <div className="flex justify-end gap-4">
                    <button
                      onClick={() => {
                        setEditNotice(notice);
                      }}
                      className="px-3 py-2 bg-blue-500 text-white hover:bg-blue-700"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteNotice(notice.id)}
                      className="px-3 py-2 bg-red-500 text-white hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            {notices.length === 0 && (
              <div className="flex items-center justify-center">
                Sorry, no items available.
              </div>
            )}
          </div>
        </div>
      )}
      {isCreatingNotice && (
        <NoticeCreateModal
          onSubmit={handleCreateNotice}
          onClose={() => setIsCreatingNotice(false)}
        />
      )}
      {editNotice && (
        <NoticeUpdateModal
          onSubmit={handleUpdateNotice}
          onClose={() => setEditNotice(null)}
          initialData={editNotice}
        />
      )}
    </div>
  );
}
