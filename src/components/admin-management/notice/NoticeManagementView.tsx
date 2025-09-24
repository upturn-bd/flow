"use client";

import { useEffect, useState } from "react";
import Collapsible from "../CollapsibleComponent";
import NoticesCreateModal from "./NoticeModal";
import { NewspaperClipping, TrashSimple, Plus } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { fadeIn, fadeInUp, staggerContainer } from "@/components/ui/animations";
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
      <motion.div 
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
        className="px-4 space-y-6 py-4"
      >
        <motion.div variants={fadeInUp} className="flex items-center gap-3 mb-4">
          <NewspaperClipping size={22} weight="duotone" className="text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-800">News & Notice Types</h3>
        </motion.div>

        {loading ? (
          <LoadingSpinner
            icon={NewspaperClipping}
            text="Loading news & notice types..."
            height="h-40"
            color="gray"
          />
        ) : (
          <motion.div variants={fadeInUp}>
            <AnimatePresence>
              {newsAndNoticeTypes.length > 0 ? (
                <motion.div className="flex flex-wrap gap-2">
                  {newsAndNoticeTypes.map((type, idx) => (
                    <motion.div
                      key={type.id || idx}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ delay: idx * 0.05 }}
                      className="flex items-center bg-gray-100 rounded-lg px-3 py-2 border border-gray-200 shadow-sm"
                    >
                      <span className="text-gray-800 font-medium">{type.name}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => type.id !== undefined && handleDeleteNewsAndNoticeType(type.id)}
                        isLoading={deleteLoading === type.id}
                        disabled={deleteLoading === type.id}
                        className="ml-2 p-1 rounded-full text-gray-500 hover:bg-red-50 hover:text-red-500"
                      >
                        <TrashSimple size={16} weight="bold" />
                      </Button>
                    </motion.div>
                  ))}
                </motion.div>
              ) : (
                <motion.div 
                  variants={fadeIn}
                  className="bg-gray-50 rounded-lg p-6 text-center border border-gray-200"
                >
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                    className="flex justify-center mb-3"
                  >
                    <NewspaperClipping size={40} weight="duotone" className="text-gray-400" />
                  </motion.div>
                  <p className="text-gray-500 mb-1">No news & notice types found</p>
                  <p className="text-gray-400 text-sm mb-4">Add types to categorize news and notices</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        <motion.div variants={fadeIn} className="flex justify-end mt-4">
          <Button
            variant="primary" 
            onClick={() => setIsCreatingNewsAndNoticeType(true)}
            className="flex items-center gap-2 bg-gray-800 hover:bg-gray-900 text-white"
          >
            <Plus size={16} weight="bold" />
            Add Type
          </Button>
        </motion.div>

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
      </motion.div>
    </Collapsible>
  );
}
