"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    GraduationCap,
    CheckCircle,
    Circle,
    X,
    ClipboardText,
    ChartBar,
    SignIn,
    CalendarX,
    Bell,
    Clipboard,
    CurrencyDollar,
    WarningCircle,
    CreditCard,
    Building,
    UserPlus,
    UserMinus,
    Users,
} from "@phosphor-icons/react";
import { useTutorial } from "@/contexts/TutorialContext";
import { FEATURE_TUTORIALS } from "@/lib/constants/tutorial-steps";
import { useRouter } from "next/navigation";
import type { Icon } from "@phosphor-icons/react";

// Icon mapping
const ICON_MAP: Record<string, Icon> = {
    ClipboardText,
    ChartBar,
    SignIn,
    CalendarX,
    Bell,
    Clipboard,
    CurrencyDollar,
    WarningCircle,
    CreditCard,
    Building,
    UserPlus,
    UserMinus,
    Users,
};

/**
 * TutorialSelector - A modal/panel to browse and start any tutorial
 */
export function TutorialSelector() {
    const [isOpen, setIsOpen] = useState(false);
    const { startTutorial, isTutorialCompleted, getCompletedTutorials, isActive } = useTutorial();
    const router = useRouter();

    const completedCount = getCompletedTutorials().length;
    const totalCount = FEATURE_TUTORIALS.length;

    const handleStartTutorial = (tutorialId: string, route: string) => {
        setIsOpen(false);
        // Navigate to the tutorial's page first
        router.push(route);
        // Start tutorial after a short delay to allow navigation
        setTimeout(() => {
            startTutorial(tutorialId);
        }, 500);
    };

    if (isActive) return null;

    return (
        <>
            {/* Trigger Button */}
            <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-primary-600 text-white hover:bg-primary-700 shadow-sm transition-colors"
            >
                <GraduationCap size={20} weight="bold" />
                <span>Tutorials</span>
                <span className="ml-1 px-1.5 py-0.5 text-xs bg-white/20 rounded-full">
                    {completedCount}/{totalCount}
                </span>
            </motion.button>

            {/* Modal */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="fixed inset-0 z-[9990] bg-black/50"
                        />

                        {/* Panel */}
                        <motion.div
                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 20, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className="fixed inset-x-4 top-[10vh] mx-auto max-w-2xl z-[9991] bg-surface-primary rounded-2xl shadow-2xl border border-border-primary overflow-hidden"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between p-4 border-b border-border-primary bg-surface-secondary">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
                                        <GraduationCap size={24} weight="bold" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-semibold text-foreground-primary">
                                            Feature Tutorials
                                        </h2>
                                        <p className="text-sm text-foreground-secondary">
                                            {completedCount} of {totalCount} completed
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-2 rounded-lg text-foreground-tertiary hover:text-foreground-primary hover:bg-surface-hover transition-colors"
                                >
                                    <X size={20} weight="bold" />
                                </button>
                            </div>

                            {/* Progress Bar */}
                            <div className="px-4 py-3 border-b border-border-primary">
                                <div className="h-2 bg-surface-secondary rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(completedCount / totalCount) * 100}%` }}
                                        className="h-full bg-primary-500 rounded-full"
                                    />
                                </div>
                            </div>

                            {/* Tutorial List */}
                            <div className="max-h-[60vh] overflow-y-auto p-4 space-y-2">
                                {FEATURE_TUTORIALS.map((tutorial) => {
                                    const isCompleted = isTutorialCompleted(tutorial.id);
                                    const IconComponent = ICON_MAP[tutorial.icon] || Circle;

                                    return (
                                        <motion.button
                                            key={tutorial.id}
                                            whileHover={{ scale: 1.01 }}
                                            whileTap={{ scale: 0.99 }}
                                            onClick={() => handleStartTutorial(tutorial.id, tutorial.route)}
                                            className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors text-left ${isCompleted
                                                    ? "border-success/30 bg-success/5 hover:bg-success/10"
                                                    : "border-border-primary bg-surface-secondary hover:bg-surface-hover"
                                                }`}
                                        >
                                            {/* Icon */}
                                            <div
                                                className={`shrink-0 p-2 rounded-lg ${isCompleted
                                                        ? "bg-success/10 text-success"
                                                        : "bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400"
                                                    }`}
                                            >
                                                <IconComponent size={20} weight="bold" />
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium text-foreground-primary truncate">
                                                        {tutorial.name}
                                                    </span>
                                                    <span className="text-xs text-foreground-tertiary">
                                                        {tutorial.steps.length} steps
                                                    </span>
                                                </div>
                                                <p className="text-sm text-foreground-secondary truncate">
                                                    {tutorial.description}
                                                </p>
                                            </div>

                                            {/* Status */}
                                            <div className="shrink-0">
                                                {isCompleted ? (
                                                    <CheckCircle size={24} weight="fill" className="text-success" />
                                                ) : (
                                                    <Circle size={24} className="text-foreground-tertiary" />
                                                )}
                                            </div>
                                        </motion.button>
                                    );
                                })}
                            </div>

                            {/* Footer */}
                            <div className="p-4 border-t border-border-primary bg-surface-secondary">
                                <p className="text-xs text-foreground-tertiary text-center">
                                    Click any tutorial to navigate to its page and start learning.
                                </p>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}

export default TutorialSelector;
