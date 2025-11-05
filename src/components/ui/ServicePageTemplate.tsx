"use client";

import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import TabView, { TabItem } from './TabView';
import { LucideIcon } from 'lucide-react';

interface ServicePageProps {
  title: string;
  description: string;
  icon: ReactNode;
  primaryColor: string;
  tabs: TabItem[];
  activeTab: string;
  setActiveTab: (key: string) => void;
  actionButtonLabel?: string;
  actionButtonIcon?: ReactNode;
  actionButtonOnClick?: () => void;
  isLinked?: boolean;
}

export default function ServicePageTemplate({
  title,
  description,
  icon,
  primaryColor,
  tabs,
  activeTab,
  setActiveTab,
  actionButtonLabel,
  actionButtonIcon,
  actionButtonOnClick,
  isLinked
}: ServicePageProps) {
  
  // Animation variants
  const pageVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1, 
      transition: { 
        duration: 0.5, 
        when: "beforeChildren",
        staggerChildren: 0.1
      } 
    },
    exit: { 
      opacity: 0, 
      transition: { duration: 0.3 } 
    }
  };

  const contentVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30
      }
    },
    exit: {
      opacity: 0,
      y: -20,
      transition: {
        duration: 0.3
      }
    }
  };

  return (
    <motion.div
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
              className={`mr-2 h-7 w-7 ${primaryColor}`}
            >
              {icon}
            </motion.div>
            {title}
          </h1>
          <p className="text-gray-600 max-w-3xl">
            {description}
          </p>
        </div>
        
        {actionButtonLabel && actionButtonIcon && actionButtonOnClick && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={actionButtonOnClick}
            className={`flex items-center justify-center gap-2 ${primaryColor.includes('text') ? primaryColor.replace('text', 'bg') : 'bg-blue-600'} hover:brightness-110 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-sm`}
          >
            {actionButtonIcon}
            <span>{actionButtonLabel}</span>
          </motion.button>
        )}
      </motion.div>

      <TabView 
        tabs={tabs}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        contentVariants={contentVariants}
        isLinked={isLinked}
      />
    </motion.div>
  );
} 