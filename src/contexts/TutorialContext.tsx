"use client";

import {
    createContext,
    useContext,
    useState,
    useCallback,
    useEffect,
    ReactNode,
} from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { FEATURE_TUTORIALS, FeatureTutorial, TutorialStep } from "@/lib/constants/tutorial-steps";

// ============================================================================
// Types
// ============================================================================

interface TutorialState {
    activeTutorial: string | null;
    currentStep: number;
    isActive: boolean;
    isWaitingForElement: boolean;
}

interface TutorialContextValue extends TutorialState {
    // Actions
    startTutorial: (tutorialId: string) => void;
    endTutorial: () => void;
    nextStep: () => void;
    prevStep: () => void;
    skipTutorial: () => void;
    goToStep: (step: number) => void;

    // Computed
    currentTutorial: FeatureTutorial | null;
    currentStepData: TutorialStep | null;
    totalSteps: number;
    isFirstStep: boolean;
    isLastStep: boolean;
    isTutorialCompleted: (tutorialId: string) => boolean;
    getCompletedTutorials: () => string[];
}

// ============================================================================
// Constants
// ============================================================================

const STORAGE_KEY = "ops-tutorials-completed";

// ============================================================================
// Helpers
// ============================================================================

/**
 * Parse a route string into pathname and search params
 */
function parseRoute(route: string): { pathname: string; searchParams: URLSearchParams } {
    const [pathname, search] = route.split("?");
    return {
        pathname: pathname || "/",
        searchParams: new URLSearchParams(search || ""),
    };
}

/**
 * Check if current location matches step route (considering query params)
 */
function isOnCorrectRoute(
    currentPathname: string,
    currentSearchParams: URLSearchParams,
    stepRoute: string
): boolean {
    const { pathname: stepPathname, searchParams: stepSearchParams } = parseRoute(stepRoute);

    // Pathname must match
    if (currentPathname !== stepPathname) {
        return false;
    }

    // If step has no query params, pathname match is enough
    if (stepSearchParams.toString() === "") {
        return true;
    }

    // Check if all step query params exist in current URL
    for (const [key, value] of stepSearchParams.entries()) {
        if (currentSearchParams.get(key) !== value) {
            return false;
        }
    }

    return true;
}

// ============================================================================
// Context
// ============================================================================

const TutorialContext = createContext<TutorialContextValue | null>(null);

// ============================================================================
// Provider
// ============================================================================

interface TutorialProviderProps {
    children: ReactNode;
}

export function TutorialProvider({ children }: TutorialProviderProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const [state, setState] = useState<TutorialState>({
        activeTutorial: null,
        currentStep: 0,
        isActive: false,
        isWaitingForElement: false,
    });

    // Get completed tutorials from localStorage
    const getCompletedTutorials = useCallback((): string[] => {
        if (typeof window === "undefined") return [];
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch {
            return [];
        }
    }, []);

    // Mark tutorial as completed
    const markTutorialCompleted = useCallback((tutorialId: string) => {
        if (typeof window === "undefined") return;
        try {
            const completed = getCompletedTutorials();
            if (!completed.includes(tutorialId)) {
                completed.push(tutorialId);
                localStorage.setItem(STORAGE_KEY, JSON.stringify(completed));
            }
        } catch {
            // Silently fail if localStorage is not available
        }
    }, [getCompletedTutorials]);

    // Check if tutorial is completed
    const isTutorialCompleted = useCallback((tutorialId: string): boolean => {
        return getCompletedTutorials().includes(tutorialId);
    }, [getCompletedTutorials]);

    // Get current tutorial data
    const currentTutorial = state.activeTutorial
        ? FEATURE_TUTORIALS.find((t) => t.id === state.activeTutorial) || null
        : null;

    // Get current step data
    const currentStepData = currentTutorial?.steps[state.currentStep] || null;
    const totalSteps = currentTutorial?.steps.length || 0;
    const isFirstStep = state.currentStep === 0;
    const isLastStep = state.currentStep >= totalSteps - 1;

    // Navigate to step's route if needed
    const navigateToStepRoute = useCallback((step: TutorialStep) => {
        if (!step.route) return;

        const onCorrectRoute = isOnCorrectRoute(pathname, searchParams, step.route);

        if (!onCorrectRoute) {
            setState((prev) => ({ ...prev, isWaitingForElement: true }));
            router.push(step.route);
        }
    }, [pathname, searchParams, router]);

    // When pathname/searchParams change, check if we're on the right route
    useEffect(() => {
        if (!state.isActive || !currentStepData) return;

        const onCorrectRoute = isOnCorrectRoute(pathname, searchParams, currentStepData.route);

        if (onCorrectRoute) {
            // We're on the right route, wait for element
            setState((prev) => ({ ...prev, isWaitingForElement: true }));

            // Poll for element existence
            const checkElement = () => {
                const element = document.querySelector(currentStepData.target);
                if (element) {
                    setState((prev) => ({ ...prev, isWaitingForElement: false }));
                    return true;
                }
                return false;
            };

            // Try immediately
            if (checkElement()) return;

            // Poll every 100ms for up to 3 seconds
            let attempts = 0;
            const maxAttempts = 30;
            const interval = setInterval(() => {
                attempts++;
                if (checkElement() || attempts >= maxAttempts) {
                    clearInterval(interval);
                    if (attempts >= maxAttempts) {
                        // Element not found after 3 seconds, still show tooltip
                        setState((prev) => ({ ...prev, isWaitingForElement: false }));
                    }
                }
            }, 100);

            return () => clearInterval(interval);
        }
    }, [pathname, searchParams, state.isActive, currentStepData]);

    // Start a tutorial
    const startTutorial = useCallback((tutorialId: string) => {
        const tutorial = FEATURE_TUTORIALS.find((t) => t.id === tutorialId);
        if (!tutorial) {
            console.warn(`Tutorial "${tutorialId}" not found`);
            return;
        }

        setState({
            activeTutorial: tutorialId,
            currentStep: 0,
            isActive: true,
            isWaitingForElement: true,
        });

        // Navigate to first step's route
        const firstStep = tutorial.steps[0];
        if (firstStep?.route) {
            const onCorrectRoute = isOnCorrectRoute(pathname, searchParams, firstStep.route);
            if (!onCorrectRoute) {
                router.push(firstStep.route);
            }
        }
    }, [pathname, searchParams, router]);

    // End tutorial (complete)
    const endTutorial = useCallback(() => {
        if (state.activeTutorial) {
            markTutorialCompleted(state.activeTutorial);
        }
        setState({
            activeTutorial: null,
            currentStep: 0,
            isActive: false,
            isWaitingForElement: false,
        });
    }, [state.activeTutorial, markTutorialCompleted]);

    // Skip tutorial (also marks as completed to not show again)
    const skipTutorial = useCallback(() => {
        if (state.activeTutorial) {
            markTutorialCompleted(state.activeTutorial);
        }
        setState({
            activeTutorial: null,
            currentStep: 0,
            isActive: false,
            isWaitingForElement: false,
        });
    }, [state.activeTutorial, markTutorialCompleted]);

    // Navigate to next step
    const nextStep = useCallback(() => {
        if (!currentTutorial) return;

        if (state.currentStep >= currentTutorial.steps.length - 1) {
            // Last step, end tutorial
            endTutorial();
        } else {
            const nextStepIndex = state.currentStep + 1;
            const nextStepData = currentTutorial.steps[nextStepIndex];

            setState((prev) => ({
                ...prev,
                currentStep: nextStepIndex,
                isWaitingForElement: true,
            }));

            // Navigate if different route
            if (nextStepData?.route) {
                navigateToStepRoute(nextStepData);
            }
        }
    }, [currentTutorial, state.currentStep, endTutorial, navigateToStepRoute]);

    // Navigate to previous step
    const prevStep = useCallback(() => {
        if (!currentTutorial || state.currentStep <= 0) return;

        const prevStepIndex = state.currentStep - 1;
        const prevStepData = currentTutorial.steps[prevStepIndex];

        setState((prev) => ({
            ...prev,
            currentStep: prevStepIndex,
            isWaitingForElement: true,
        }));

        // Navigate if different route
        if (prevStepData?.route) {
            navigateToStepRoute(prevStepData);
        }
    }, [currentTutorial, state.currentStep, navigateToStepRoute]);

    // Go to specific step
    const goToStep = useCallback((step: number) => {
        if (!currentTutorial) return;
        if (step >= 0 && step < currentTutorial.steps.length) {
            const stepData = currentTutorial.steps[step];

            setState((prev) => ({
                ...prev,
                currentStep: step,
                isWaitingForElement: true,
            }));

            if (stepData?.route) {
                navigateToStepRoute(stepData);
            }
        }
    }, [currentTutorial, navigateToStepRoute]);

    // Handle escape key to skip tutorial
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" && state.isActive) {
                skipTutorial();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [state.isActive, skipTutorial]);

    const value: TutorialContextValue = {
        ...state,
        startTutorial,
        endTutorial,
        nextStep,
        prevStep,
        skipTutorial,
        goToStep,
        currentTutorial,
        currentStepData,
        totalSteps,
        isFirstStep,
        isLastStep,
        isTutorialCompleted,
        getCompletedTutorials,
    };

    return (
        <TutorialContext.Provider value={value}>
            {children}
        </TutorialContext.Provider>
    );
}

// ============================================================================
// Hook
// ============================================================================

export function useTutorial() {
    const context = useContext(TutorialContext);
    if (!context) {
        throw new Error("useTutorial must be used within a TutorialProvider");
    }
    return context;
}

export default TutorialContext;
