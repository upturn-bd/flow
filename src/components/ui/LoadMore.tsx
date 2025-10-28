"use client";

import { FC } from "react";
import { motion } from "framer-motion";

interface LoadMoreProps {
  isLoading?: boolean;
  hasMore?: boolean;
  onLoadMore: () => void;
  className?: string;
}

const LoadMore: FC<LoadMoreProps> = ({
  isLoading = false,
  hasMore = true,
  onLoadMore,
  className = "",
}) => {
  if (!hasMore) return null; // Hide if no more items

  return (
    <div className={`flex justify-center my-6 ${className}`}>
      <motion.button
        whileTap={{ scale: 0.99 }}
        whileHover={{ scale: 1.01}}
        onClick={onLoadMore}
        disabled={isLoading}
        className="px-6 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all"
      >
        {isLoading ? "Loading..." : "Load More"}
      </motion.button>
    </div>
  );
};

export default LoadMore;
