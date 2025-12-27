"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTutorial } from "@/contexts/TutorialContext";

/**
 * TutorialOverlay - Creates a highlight ring around the target element
 * WITHOUT darkening the background
 */
export function TutorialOverlay() {
    const { isActive, currentStepData } = useTutorial();
    const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

    // Find and track target element position
    const updateTargetPosition = useCallback(() => {
        if (!currentStepData?.target) {
            setTargetRect(null);
            return;
        }

        const element = document.querySelector(currentStepData.target);
        if (element) {
            const rect = element.getBoundingClientRect();
            setTargetRect(rect);
        } else {
            setTargetRect(null);
        }
    }, [currentStepData?.target]);

    // Update position on step change and window resize
    useEffect(() => {
        if (!isActive) return;

        updateTargetPosition();

        // Also update on scroll and resize
        const handleUpdate = () => updateTargetPosition();
        window.addEventListener("resize", handleUpdate);
        window.addEventListener("scroll", handleUpdate, true);

        // Poll for element position (in case of animations)
        const interval = setInterval(handleUpdate, 100);

        return () => {
            window.removeEventListener("resize", handleUpdate);
            window.removeEventListener("scroll", handleUpdate, true);
            clearInterval(interval);
        };
    }, [isActive, currentStepData, updateTargetPosition]);

    if (!isActive) return null;

    return (
        <AnimatePresence>
            {isActive && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="fixed inset-0 z-9998 pointer-events-none"
                >
                    {/* Highlight ring around target - NO dark backdrop */}
                    {targetRect && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.2 }}
                            className="absolute border-2 border-primary-500 rounded-lg shadow-lg shadow-primary-500/30"
                            style={{
                                left: targetRect.left - 8,
                                top: targetRect.top - 8,
                                width: targetRect.width + 16,
                                height: targetRect.height + 16,
                                pointerEvents: "none",
                                boxShadow: "0 0 0 4px rgba(59, 130, 246, 0.2), 0 0 20px 2px rgba(59, 130, 246, 0.3)",
                            }}
                        />
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );
}

export default TutorialOverlay;
