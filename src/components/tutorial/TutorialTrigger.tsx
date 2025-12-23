"use client";

import { Question, GraduationCap } from "@phosphor-icons/react";
import { motion } from "framer-motion";
import { useTutorial } from "@/contexts/TutorialContext";
import { getTutorialByRoute } from "@/lib/constants/tutorial-steps";
import { usePathname } from "next/navigation";

interface TutorialTriggerProps {
    /** Override tutorial ID (otherwise auto-detect from route) */
    tutorialId?: string;
    /** Button variant */
    variant?: "icon" | "button" | "text";
    /** Custom label */
    label?: string;
    /** Additional className */
    className?: string;
}

/**
 * TutorialTrigger - A button to start the tutorial for the current page
 */
export function TutorialTrigger({
    tutorialId,
    variant = "button",
    label,
    className = "",
}: TutorialTriggerProps) {
    const pathname = usePathname();
    const { startTutorial, isTutorialCompleted, isActive } = useTutorial();

    // Auto-detect tutorial from route if not provided
    const tutorial = tutorialId
        ? { id: tutorialId }
        : getTutorialByRoute(pathname);

    if (!tutorial || isActive) return null;

    const handleClick = () => {
        startTutorial(tutorial.id);
    };

    const isCompleted = isTutorialCompleted(tutorial.id);
    const buttonLabel = label || (isCompleted ? "Restart Tutorial" : "Start Tutorial");

    if (variant === "icon") {
        return (
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleClick}
                className={`p-2 rounded-lg bg-primary-100 text-primary-700 hover:bg-primary-200 dark:bg-primary-900/30 dark:text-primary-400 dark:hover:bg-primary-900/50 transition-colors ${className}`}
                title={buttonLabel}
            >
                <Question size={20} weight="bold" />
            </motion.button>
        );
    }

    if (variant === "text") {
        return (
            <button
                onClick={handleClick}
                className={`text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 underline underline-offset-2 transition-colors ${className}`}
            >
                {buttonLabel}
            </button>
        );
    }

    // Default: button variant
    return (
        <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleClick}
            className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg bg-primary-100 text-primary-700 hover:bg-primary-200 dark:bg-primary-900/30 dark:text-primary-400 dark:hover:bg-primary-900/50 transition-colors ${className}`}
        >
            <GraduationCap size={18} weight="bold" />
            {buttonLabel}
        </motion.button>
    );
}

export default TutorialTrigger;
