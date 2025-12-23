"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CaretLeft, CaretRight } from "@phosphor-icons/react";
import { useTutorial } from "@/contexts/TutorialContext";

type Placement = "top" | "bottom" | "left" | "right";

interface TooltipPosition {
    top: number;
    left: number;
    placement: Placement;
}

/**
 * TutorialTooltip - Displays the current step content with navigation controls
 * Waits for target element to exist before showing
 */
export function TutorialTooltip() {
    const {
        isActive,
        currentStepData,
        currentStep,
        totalSteps,
        isFirstStep,
        isLastStep,
        nextStep,
        prevStep,
        skipTutorial,
        currentTutorial,
        isWaitingForElement,
    } = useTutorial();

    const tooltipRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState<TooltipPosition>({
        top: 0,
        left: 0,
        placement: "bottom",
    });
    const [isPositioned, setIsPositioned] = useState(false);

    // Calculate tooltip position based on target element
    const updatePosition = useCallback(() => {
        if (!currentStepData?.target || !tooltipRef.current || isWaitingForElement) {
            setIsPositioned(false);
            return;
        }

        const target = document.querySelector(currentStepData.target);
        if (!target) {
            // If target not found, center the tooltip
            const windowWidth = window.innerWidth;
            const windowHeight = window.innerHeight;
            setPosition({
                top: windowHeight / 2 - 100,
                left: windowWidth / 2 - 175,
                placement: "bottom",
            });
            setIsPositioned(true);
            return;
        }

        const targetRect = target.getBoundingClientRect();
        const tooltipRect = tooltipRef.current.getBoundingClientRect();
        const preferredPlacement = currentStepData.placement || "bottom";

        const padding = 16;
        const arrowSize = 10;
        let finalPlacement: Placement = preferredPlacement;
        let top = 0;
        let left = 0;

        // Calculate position based on placement
        const calculatePlacement = (placement: Placement): { top: number; left: number; fits: boolean } => {
            let t = 0;
            let l = 0;
            let fits = true;

            switch (placement) {
                case "bottom":
                    t = targetRect.bottom + padding + arrowSize;
                    l = targetRect.left + targetRect.width / 2 - tooltipRect.width / 2;
                    fits = t + tooltipRect.height < window.innerHeight;
                    break;
                case "top":
                    t = targetRect.top - tooltipRect.height - padding - arrowSize;
                    l = targetRect.left + targetRect.width / 2 - tooltipRect.width / 2;
                    fits = t > 0;
                    break;
                case "right":
                    t = targetRect.top + targetRect.height / 2 - tooltipRect.height / 2;
                    l = targetRect.right + padding + arrowSize;
                    fits = l + tooltipRect.width < window.innerWidth;
                    break;
                case "left":
                    t = targetRect.top + targetRect.height / 2 - tooltipRect.height / 2;
                    l = targetRect.left - tooltipRect.width - padding - arrowSize;
                    fits = l > 0;
                    break;
            }

            // Keep tooltip in viewport
            l = Math.max(padding, Math.min(l, window.innerWidth - tooltipRect.width - padding));
            t = Math.max(padding, Math.min(t, window.innerHeight - tooltipRect.height - padding));

            return { top: t, left: l, fits };
        };

        // Try preferred placement first, then fallback
        const placements: Placement[] = [preferredPlacement, "bottom", "top", "right", "left"];
        for (const placement of placements) {
            const result = calculatePlacement(placement);
            if (result.fits || placement === placements[placements.length - 1]) {
                top = result.top;
                left = result.left;
                finalPlacement = placement;
                break;
            }
        }

        setPosition({ top, left, placement: finalPlacement });
        setIsPositioned(true);
    }, [currentStepData, isWaitingForElement]);

    // Update position on step change and window resize
    useEffect(() => {
        if (!isActive || isWaitingForElement) {
            setIsPositioned(false);
            return;
        }

        // Small delay to ensure DOM is updated after route change
        const timeout = setTimeout(updatePosition, 100);

        window.addEventListener("resize", updatePosition);
        window.addEventListener("scroll", updatePosition, true);

        return () => {
            clearTimeout(timeout);
            window.removeEventListener("resize", updatePosition);
            window.removeEventListener("scroll", updatePosition, true);
        };
    }, [isActive, currentStepData, isWaitingForElement, updatePosition]);

    // Don't render if waiting for element or not active
    if (!isActive || !currentStepData || isWaitingForElement) return null;

    // Arrow direction based on placement
    const getArrowStyles = (): React.CSSProperties => {
        const base: React.CSSProperties = {
            position: "absolute",
            width: 0,
            height: 0,
        };

        const arrowSize = 10;

        switch (position.placement) {
            case "bottom":
                return {
                    ...base,
                    top: -arrowSize,
                    left: "50%",
                    transform: "translateX(-50%)",
                    borderLeft: `${arrowSize}px solid transparent`,
                    borderRight: `${arrowSize}px solid transparent`,
                    borderBottom: `${arrowSize}px solid var(--theme-surface-primary)`,
                };
            case "top":
                return {
                    ...base,
                    bottom: -arrowSize,
                    left: "50%",
                    transform: "translateX(-50%)",
                    borderLeft: `${arrowSize}px solid transparent`,
                    borderRight: `${arrowSize}px solid transparent`,
                    borderTop: `${arrowSize}px solid var(--theme-surface-primary)`,
                };
            case "right":
                return {
                    ...base,
                    left: -arrowSize,
                    top: "50%",
                    transform: "translateY(-50%)",
                    borderTop: `${arrowSize}px solid transparent`,
                    borderBottom: `${arrowSize}px solid transparent`,
                    borderRight: `${arrowSize}px solid var(--theme-surface-primary)`,
                };
            case "left":
                return {
                    ...base,
                    right: -arrowSize,
                    top: "50%",
                    transform: "translateY(-50%)",
                    borderTop: `${arrowSize}px solid transparent`,
                    borderBottom: `${arrowSize}px solid transparent`,
                    borderLeft: `${arrowSize}px solid var(--theme-surface-primary)`,
                };
        }
    };

    return (
        <AnimatePresence>
            {isActive && !isWaitingForElement && (
                <motion.div
                    ref={tooltipRef}
                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                    animate={{
                        opacity: isPositioned ? 1 : 0,
                        scale: isPositioned ? 1 : 0.9,
                        y: isPositioned ? 0 : 10
                    }}
                    exit={{ opacity: 0, scale: 0.9, y: 10 }}
                    transition={{ duration: 0.2 }}
                    className="fixed z-[9999] w-[350px] max-w-[calc(100vw-32px)] bg-surface-primary border border-border-primary rounded-xl shadow-2xl"
                    style={{
                        top: position.top,
                        left: position.left,
                    }}
                >
                    {/* Arrow */}
                    <div style={getArrowStyles()} />

                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-border-primary">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-primary-600 bg-primary-100 dark:bg-primary-900/30 dark:text-primary-400 px-2 py-1 rounded-full">
                                {currentStep + 1} / {totalSteps}
                            </span>
                            {currentTutorial && (
                                <span className="text-xs text-foreground-tertiary truncate max-w-[150px]">
                                    {currentTutorial.name}
                                </span>
                            )}
                        </div>
                        <button
                            onClick={skipTutorial}
                            className="p-1 rounded-md text-foreground-tertiary hover:text-foreground-primary hover:bg-surface-hover transition-colors"
                            aria-label="Skip tutorial"
                        >
                            <X size={18} weight="bold" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-4">
                        <h3 className="text-base font-semibold text-foreground-primary mb-2">
                            {currentStepData.title}
                        </h3>
                        <p className="text-sm text-foreground-secondary leading-relaxed">
                            {currentStepData.content}
                        </p>
                    </div>

                    {/* Footer with navigation */}
                    <div className="flex items-center justify-between p-4 border-t border-border-primary bg-surface-secondary rounded-b-xl">
                        <button
                            onClick={skipTutorial}
                            className="text-sm text-foreground-tertiary hover:text-foreground-primary transition-colors"
                        >
                            Skip
                        </button>

                        <div className="flex gap-2">
                            <button
                                onClick={prevStep}
                                disabled={isFirstStep}
                                className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg border border-border-primary bg-surface-primary text-foreground-secondary hover:bg-surface-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <CaretLeft size={16} weight="bold" />
                                Back
                            </button>
                            <button
                                onClick={nextStep}
                                className="flex items-center gap-1 px-4 py-1.5 text-sm font-medium rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors"
                            >
                                {isLastStep ? "Finish" : "Next"}
                                {!isLastStep && <CaretRight size={16} weight="bold" />}
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

export default TutorialTooltip;
