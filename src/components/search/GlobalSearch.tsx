"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { MagnifyingGlass, X, CaretRight } from "@phosphor-icons/react";
import { cn } from "@/components/ui/class";
import { useAuth } from "@/lib/auth/auth-context";
import { useTutorial } from "@/contexts/TutorialContext";
import Portal from "@/components/ui/Portal";
import { 
  ALL_OPS_ITEMS, 
  ADMIN_CONFIG_ITEMS, 
  ADMIN_LOG_ITEMS,
  NavigationItem 
} from "@/lib/constants/navigation";
import { FEATURE_TUTORIALS } from "@/lib/constants/tutorial-steps";
import * as PhosphorIcons from "@phosphor-icons/react";

interface SearchItem extends NavigationItem {
  category: string;
  isTutorial?: boolean;
  tutorialId?: string;
}

// Transform navigation items to search items with category
const transformToSearchItems = (items: NavigationItem[], category: string): SearchItem[] =>
  items.map(item => ({ ...item, category }));

// Transform tutorials to search items
const transformTutorialsToSearchItems = (): SearchItem[] => {
  return FEATURE_TUTORIALS.map(tutorial => {
    // Get icon component from Phosphor Icons
    const IconComponent = (PhosphorIcons as any)[tutorial.icon] || PhosphorIcons.GraduationCap;
    
    return {
      name: tutorial.name,
      path: tutorial.route,
      icon: IconComponent,
      description: tutorial.description,
      iconColor: "bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400",
      keywords: ["tutorial", "learn", "guide", "help", tutorial.name.toLowerCase(), ...tutorial.description.toLowerCase().split(" ")],
      category: "Tutorials",
      isTutorial: true,
      tutorialId: tutorial.id,
    };
  });
};

// Operations modules
const opsSearchItems: SearchItem[] = transformToSearchItems(ALL_OPS_ITEMS, "Operations");

// Admin configuration items
const adminConfigSearchItems: SearchItem[] = transformToSearchItems(ADMIN_CONFIG_ITEMS, "Admin Config");

// Admin log items
const adminLogSearchItems: SearchItem[] = transformToSearchItems(ADMIN_LOG_ITEMS, "Admin Logs");

// Tutorial items
const tutorialSearchItems: SearchItem[] = transformTutorialsToSearchItems();

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function GlobalSearch({ isOpen, onClose }: GlobalSearchProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { hasPermission } = useAuth();
  const { startTutorial } = useTutorial();

  // Check if user has admin access
  const hasAdminAccess = hasPermission("teams","can_write") || hasPermission("admin_config","can_write");

  // Build searchable items based on permissions
  const allItems: SearchItem[] = [
    ...opsSearchItems,
    ...(hasAdminAccess ? adminConfigSearchItems : []),
    ...(hasAdminAccess ? adminLogSearchItems : []),
    ...tutorialSearchItems,
  ];

  // FunnelSimple items based on query
  const filteredItems = query.trim()
    ? allItems.filter((item) => {
        const searchLower = query.toLowerCase();
        return (
          item.name.toLowerCase().includes(searchLower) ||
          item.description.toLowerCase().includes(searchLower) ||
          item.category.toLowerCase().includes(searchLower) ||
          item.keywords?.some((k) => k.toLowerCase().includes(searchLower))
        );
      })
    : allItems.slice(0, 8); // Show first 8 items when no query

  // Group items by category
  const groupedItems = filteredItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, SearchItem[]>);

  // Flatten for keyboard navigation
  const flatItems = Object.values(groupedItems).flat();

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setQuery("");
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) => Math.min(prev + 1, flatItems.length - 1));
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => Math.max(prev - 1, 0));
          break;
        case "Enter":
          e.preventDefault();
          if (flatItems[selectedIndex]) {
            navigateTo(flatItems[selectedIndex].path, flatItems[selectedIndex]);
          }
          break;
        case "Escape":
          e.preventDefault();
          onClose();
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, selectedIndex, flatItems, onClose]);

  const navigateTo = useCallback(
    (path: string, item?: SearchItem) => {
      if (item?.isTutorial && item.tutorialId) {
        // For tutorials, navigate first then start tutorial
        router.push(path);
        onClose();
        // Start tutorial after a short delay to allow navigation
        setTimeout(() => {
          startTutorial(item.tutorialId!);
        }, 500);
      } else {
        // Regular navigation
        router.push(path);
        onClose();
      }
    },
    [router, onClose, startTutorial]
  );

  if (!isOpen) return null;

  return (
    <Portal>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-100 flex items-start justify-center pt-[10vh] md:pt-[15vh] px-4"
          onClick={onClose}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

          {/* Search modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-xl bg-background-primary border border-border-primary rounded-xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search input */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border-primary">
              <MagnifyingGlass className="h-5 w-5 text-foreground-tertiary shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelectedIndex(0);
                }}
                placeholder="Search modules, logs, settings, tutorials..."
                className="flex-1 bg-transparent text-foreground-primary placeholder:text-foreground-tertiary outline-none text-base"
              />
              {query && (
                <button
                  onClick={() => {
                    setQuery("");
                    inputRef.current?.focus();
                  }}
                  className="p-1 rounded hover:bg-surface-hover text-foreground-tertiary"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-foreground-tertiary bg-surface-secondary rounded border border-border-primary">
                ESC
              </kbd>
            </div>

            {/* Results */}
            <div className="max-h-[60vh] overflow-y-auto">
              {flatItems.length === 0 ? (
                <div className="px-4 py-8 text-center text-foreground-secondary">
                  <MagnifyingGlass className="h-8 w-8 mx-auto mb-2 text-foreground-tertiary" />
                  <p>No results found for &quot;{query}&quot;</p>
                </div>
              ) : (
                Object.entries(groupedItems).map(([category, items]) => (
                  <div key={category}>
                    <div className="sticky top-0 px-4 py-2.5 text-sm font-bold text-foreground-tertiary uppercase tracking-wide bg-surface-secondary border-b border-border-primary shadow-sm">
                      {category}
                    </div>
                    {items.map((item) => {
                      const globalIndex = flatItems.indexOf(item);
                      const isSelected = globalIndex === selectedIndex;
                      const Icon = item.icon;

                      return (
                        <button
                          key={item.path}
                          onClick={() => navigateTo(item.path, item)}
                          onMouseEnter={() => setSelectedIndex(globalIndex)}
                          className={cn(
                            "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors",
                            isSelected
                              ? "bg-primary-50 dark:bg-primary-950/30"
                              : "hover:bg-surface-hover"
                          )}
                        >
                          <div
                            className={cn(
                              "shrink-0 p-2 rounded-lg",
                              isSelected
                                ? "bg-primary-100 dark:bg-primary-900/50 text-primary-600 dark:text-primary-400"
                                : "bg-surface-secondary text-foreground-secondary"
                            )}
                          >
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p
                              className={cn(
                                "font-medium truncate",
                                isSelected
                                  ? "text-primary-700 dark:text-primary-300"
                                  : "text-foreground-primary"
                              )}
                            >
                              {item.name}
                            </p>
                            <p className="text-sm text-foreground-tertiary truncate">
                              {item.description}
                            </p>
                          </div>
                          {isSelected && (
                            <CaretRight className="h-4 w-4 text-primary-500 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))
              )}
            </div>

            {/* Footer hints */}
            <div className="px-4 py-2 border-t border-border-primary bg-surface-secondary">
              <div className="flex items-center justify-between text-xs text-foreground-tertiary">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-background-primary border border-border-primary rounded text-[10px] font-medium shadow-sm">↑</kbd>
                    <kbd className="px-1.5 py-0.5 bg-background-primary border border-border-primary rounded text-[10px] font-medium shadow-sm">↓</kbd>
                    <span className="ml-1">Navigate</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-background-primary border border-border-primary rounded text-[10px] font-medium shadow-sm">Enter</kbd>
                    <span className="ml-1">Open</span>
                  </span>
                </div>
                <span className="hidden sm:flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-background-primary border border-border-primary rounded text-[10px] font-medium shadow-sm">Ctrl</kbd>
                  <span className="text-[10px]">+</span>
                  <kbd className="px-1.5 py-0.5 bg-background-primary border border-border-primary rounded text-[10px] font-medium shadow-sm">K</kbd>
                  <span className="ml-1">to open</span>
                </span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </Portal>
  );
}
