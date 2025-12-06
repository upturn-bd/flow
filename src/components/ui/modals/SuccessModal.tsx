"use client";

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, X } from "@phosphor-icons/react";
import Portal from '@/components/ui/Portal';

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message?: string;
  autoCloseDuration?: number; // in milliseconds, default 3000
}

export default function SuccessModal({
  isOpen,
  onClose,
  title,
  message,
  autoCloseDuration = 3000,
}: SuccessModalProps) {
  useEffect(() => {
    if (isOpen && autoCloseDuration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, autoCloseDuration);

      return () => clearTimeout(timer);
    }
  }, [isOpen, autoCloseDuration, onClose]);

  return (
    <Portal>
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-9998"
            />

            {/* Modal */}
            <div className="fixed inset-0 flex items-center justify-center z-9999 p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="bg-surface-primary rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-border-primary"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Close button */}
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 p-2 rounded-lg hover:bg-background-secondary transition-colors text-foreground-tertiary hover:text-foreground-primary"
                >
                  <X size={20} />
                </button>

                {/* Content */}
                <div className="p-8 text-center">
                  {/* Success Icon with animation */}
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ 
                      type: 'spring', 
                      damping: 15, 
                      stiffness: 200,
                      delay: 0.1 
                    }}
                    className="mx-auto w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6"
                  >
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ 
                        type: 'spring', 
                        damping: 12, 
                        stiffness: 200,
                        delay: 0.2 
                      }}
                    >
                      <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" weight="fill" />
                    </motion.div>
                  </motion.div>

                  {/* Title */}
                  <motion.h3
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-2xl font-bold text-foreground-primary mb-3"
                  >
                    {title}
                  </motion.h3>

                  {/* Message */}
                  {message && (
                    <motion.p
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="text-foreground-secondary text-base"
                    >
                      {message}
                    </motion.p>
                  )}

                  {/* Auto-close indicator */}
                  {autoCloseDuration > 0 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 }}
                      className="mt-6"
                    >
                      <div className="h-1 bg-background-secondary rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: '100%' }}
                          animate={{ width: '0%' }}
                          transition={{ duration: autoCloseDuration / 1000, ease: 'linear' }}
                          className="h-full bg-green-500"
                        />
                      </div>
                    </motion.div>
                  )}

                  {/* OK Button */}
                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    onClick={onClose}
                    className="mt-6 px-8 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors w-full sm:w-auto"
                  >
                    OK
                  </motion.button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </Portal>
  );
}
