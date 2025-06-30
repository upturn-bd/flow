"use client";
import { Notice, useNotices } from "@/hooks/useNotice";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Pencil, Trash2, Plus, Clock, CalendarDays, Info } from "lucide-react";
import { toast } from "react-hot-toast";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { NoticeCreateModal, NoticeUpdateModal } from "@/components/operations-and-services/notice";

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
      toast.success("Notice created successfully!");
      setIsCreatingNotice(false);
      fetchNotices();
    } catch (error) {
      toast.error("Error creating notice. Please try again.");
      console.error(error);
    }
  };

  const handleUpdateNotice = async (values: any) => {
    try {
      if (editNotice?.id) {
        await updateNotice(editNotice.id, values);
        toast.success("Notice updated successfully!");
        setEditNotice(null);
        fetchNotices();
      }
    } catch (error) {
      toast.error("Error updating notice. Please try again.");
      console.error(error);
    }
  };

  const handleDeleteNotice = async (id: number) => {
    const confirmed = window.confirm("Are you sure you want to delete this notice?");
    if (!confirmed) return;
    
    try {
      await deleteNotice(id);
      toast.success("Notice deleted successfully!");
      fetchNotices();
    } catch (error) {
      toast.error("Error deleting notice. Please try again.");
      console.error(error);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, [fetchNotices]);

  const pageVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1, 
      transition: { 
        duration: 0.5,
        when: "beforeChildren"
      } 
    },
    exit: { 
      opacity: 0, 
      transition: { 
        duration: 0.3 
      } 
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { 
        type: "spring",
        stiffness: 260,
        damping: 20 
      } 
    },
    exit: { 
      opacity: 0, 
      y: -20, 
      transition: { 
        duration: 0.2 
      } 
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-4 sm:p-6 min-h-[70vh] flex items-center justify-center">
        <LoadingSpinner 
          text="Loading notices..." 
          icon={Bell} 
          color="amber"
        />
      </div>
    );
  }

  return (
    <div className="min-h-[70vh]">
      <AnimatePresence mode="wait">
        {!isCreatingNotice && !editNotice && (
          <motion.div 
            key="notice-main"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={pageVariants}
            className="max-w-6xl mx-auto p-4 sm:p-6"
          >
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8"
            >
              <div>
                <h1 className="text-2xl font-bold text-gray-800 flex items-center mb-2">
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0.5 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="mr-2 h-6 w-6 text-amber-500"
                  >
                    <Bell className="h-6 w-6" />
                  </motion.div>
                  Notices & Announcements
                </h1>
                <p className="text-gray-600 max-w-3xl">
                  View and manage company-wide notices and important announcements.
                </p>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={() => setIsCreatingNotice(true)}
                className="flex items-center justify-center gap-2 bg-amber-500 hover:brightness-110 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-sm"
              >
                <Plus className="h-4 w-4" />
                <span>Create Notice</span>
              </motion.button>
            </motion.div>

            {notices.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="mt-10 flex flex-col items-center justify-center p-10 bg-amber-50/50 rounded-xl border border-amber-100"
              >
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.4 }}
                >
                  <Info className="h-16 w-16 text-amber-300 mb-4" />
                </motion.div>
                <h3 className="text-xl font-medium text-gray-700 mb-2">No Notices Available</h3>
                <p className="text-gray-600 text-center max-w-md mb-5">
                  There are currently no notices or announcements. Create your first notice to keep everyone informed.
                </p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsCreatingNotice(true)}
                  className="px-5 py-2.5 bg-amber-500 text-white rounded-lg shadow-sm hover:bg-amber-600 transition-colors font-medium flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Create your first notice
                </motion.button>
              </motion.div>
            ) : (
              <motion.div 
                variants={containerVariants}
                className="grid grid-cols-1 gap-5"
              >
                {notices.map((notice) => (
                  <motion.div
                    key={notice.id}
                    variants={itemVariants}
                    layout
                    whileHover={{ 
                      y: -4,
                      boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)" 
                    }}
                    transition={{ layout: { duration: 0.3 } }}
                    className="bg-white shadow-sm rounded-xl overflow-hidden border border-gray-100"
                  >
                    <div className="p-6">
                      <div className="flex justify-between items-start">
                        <h2 className="text-lg font-semibold text-gray-800 mb-3">{notice.title}</h2>
                        <div className="flex space-x-1">
                          <motion.button
                            whileHover={{ scale: 1.1, backgroundColor: "rgba(59, 130, 246, 0.1)" }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setEditNotice(notice)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                            aria-label="Edit notice"
                          >
                            <Pencil className="h-4 w-4" />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1, backgroundColor: "rgba(239, 68, 68, 0.1)" }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleDeleteNotice(notice.id!)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                            aria-label="Delete notice"
                          >
                            <Trash2 className="h-4 w-4" />
                          </motion.button>
                        </div>
                      </div>
                      <p className="text-gray-700 mb-4">{notice.description}</p>
                      <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                        <div className="flex items-center text-sm text-gray-500">
                          <Clock className="h-4 w-4 mr-1.5" />
                          <span>
                            Posted on {new Date(notice.valid_from).toLocaleDateString()}
                          </span>
                        </div>
                        {notice.valid_till && (
                          <div className="flex items-center text-sm text-amber-600">
                            <CalendarDays className="h-4 w-4 mr-1.5" />
                            <span>
                              Expires on {new Date(notice.valid_till).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </motion.div>
        )}

        {isCreatingNotice && (
          <NoticeCreateModal 
            onClose={() => setIsCreatingNotice(false)}
            onSubmit={handleCreateNotice} 
          />
        )}

        {editNotice && (
          <NoticeUpdateModal 
            initialData={editNotice}
            onClose={() => setEditNotice(null)}
            onSubmit={handleUpdateNotice}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
