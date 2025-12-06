"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, X, Clock, MapPin, PaperPlaneTilt } from "@phosphor-icons/react";
import Portal from '@/components/ui/Portal';

interface AttendanceStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: 'Present' | 'Late' | 'Wrong_Location';
  recordId?: number;
  onSendRequest?: (recordId: number, reason: string) => Promise<void>;
}

export default function AttendanceStatusModal({
  isOpen,
  onClose,
  status,
  recordId,
  onSendRequest,
}: AttendanceStatusModalProps) {
  const [isSendingRequest, setIsSendingRequest] = useState(false);
  const [reason, setReason] = useState('');
  const [reasonError, setReasonError] = useState('');

  const getStatusConfig = () => {
    switch (status) {
      case 'Present':
        return {
          icon: CheckCircle,
          iconColor: 'text-green-600 dark:text-green-400',
          bgColor: 'bg-green-100 dark:bg-green-900/30',
          title: 'Check-in Successful!',
          message: 'Your attendance has been recorded. You checked in on time at the correct location.',
          showRequestButton: false,
        };
      case 'Late':
        return {
          icon: Clock,
          iconColor: 'text-amber-600 dark:text-amber-400',
          bgColor: 'bg-amber-100 dark:bg-amber-900/30',
          title: 'Check-in Recorded (Late)',
          message: 'You have checked in late. If you have a valid reason, you can send a request to your supervisor for approval.',
          showRequestButton: true,
        };
      case 'Wrong_Location':
        return {
          icon: MapPin,
          iconColor: 'text-red-600 dark:text-red-400',
          bgColor: 'bg-red-100 dark:bg-red-900/30',
          title: 'Check-in Recorded (Wrong Location)',
          message: 'You checked in from outside the designated area. If you have a valid reason, you can send a request to your supervisor for approval.',
          showRequestButton: true,
        };
      default:
        return {
          icon: CheckCircle,
          iconColor: 'text-green-600',
          bgColor: 'bg-green-100',
          title: 'Check-in Successful',
          message: 'Your attendance has been recorded.',
          showRequestButton: false,
        };
    }
  };

  const config = getStatusConfig();
  const IconComponent = config.icon;

  const handleSendRequest = async () => {
    if (!recordId || !onSendRequest) return;
    
    // Validate reason
    if (!reason.trim()) {
      setReasonError('Please provide a reason for your request');
      return;
    }
    
    setIsSendingRequest(true);
    try {
      await onSendRequest(recordId, reason.trim());
      onClose();
      // Reset state
      setReason('');
      setReasonError('');
    } catch (error) {
      console.error('Failed to send request:', error);
    } finally {
      setIsSendingRequest(false);
    }
  };

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
                  {/* Status Icon with animation */}
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ 
                      type: 'spring', 
                      damping: 15, 
                      stiffness: 200,
                      delay: 0.1 
                    }}
                    className={`mx-auto w-20 h-20 ${config.bgColor} rounded-full flex items-center justify-center mb-6`}
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
                      <IconComponent className={`w-12 h-12 ${config.iconColor}`} weight="fill" />
                    </motion.div>
                  </motion.div>

                  {/* Title */}
                  <motion.h3
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-2xl font-bold text-foreground-primary mb-3"
                  >
                    {config.title}
                  </motion.h3>

                  {/* Message */}
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-foreground-secondary text-base mb-6"
                  >
                    {config.message}
                  </motion.p>

                  {/* Reason/Message Input for Late/Wrong Location */}
                  {config.showRequestButton && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.45 }}
                      className="mb-6 text-left"
                    >
                      <label 
                        htmlFor="reason" 
                        className="block text-sm font-medium text-foreground-primary mb-2"
                      >
                        Reason for Request <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        id="reason"
                        rows={4}
                        value={reason}
                        onChange={(e) => {
                          setReason(e.target.value);
                          if (reasonError) setReasonError('');
                        }}
                        placeholder="Please explain why you were late or at the wrong location..."
                        className={`w-full px-4 py-3 rounded-lg border ${
                          reasonError 
                            ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
                            : 'border-border-primary focus:ring-primary-500 focus:border-primary-500'
                        } bg-surface-primary text-foreground-primary placeholder-foreground-tertiary resize-none focus:outline-none focus:ring-2 transition-colors`}
                      />
                      {reasonError && (
                        <p className="mt-2 text-sm text-red-600">{reasonError}</p>
                      )}
                    </motion.div>
                  )}

                  {/* Action Buttons */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="flex flex-col sm:flex-row gap-3 justify-center"
                  >
                    {config.showRequestButton && recordId && onSendRequest && (
                      <button
                        onClick={handleSendRequest}
                        disabled={isSendingRequest}
                        className={`px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2 ${
                          isSendingRequest ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        <PaperPlaneTilt size={18} className={isSendingRequest ? 'animate-spin' : ''} />
                        {isSendingRequest ? 'Sending...' : 'Send Request'}
                      </button>
                    )}
                    
                    <button
                      onClick={onClose}
                      className={`px-6 py-3 font-medium rounded-lg transition-colors ${
                        config.showRequestButton
                          ? 'bg-background-secondary hover:bg-surface-hover text-foreground-primary border border-border-primary'
                          : 'bg-green-600 hover:bg-green-700 text-white'
                      }`}
                    >
                      {config.showRequestButton ? 'Close' : 'OK'}
                    </button>
                  </motion.div>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </Portal>
  );
}
