"use client";

import { Gear, File } from "@phosphor-icons/react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    SearchBar, 
    EmptyState, 
    PageHeader, 
    NavigationCard, 
    NavigationCardGrid,
} from "@/components/ui";
import { ADMIN_SECTIONS } from "@/lib/constants/navigation";

export default function AdminManagementPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedSection, setSelectedSection] = useState<string | null>(null);

    // FunnelSimple items based on search query
    const filteredSections = ADMIN_SECTIONS
        .map((section) => ({
            ...section,
            items: section.items.filter((item) =>
                item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()))
            ),
        }))
        .filter((section) =>
            section.items.length > 0 &&
            (selectedSection === null || section.title === selectedSection)
        );

    // Animation variants
    const pageVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                when: "beforeChildren",
                staggerChildren: 0.1
            }
        }
    };

    const sectionVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                staggerChildren: 0.05
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 10 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                type: "spring" as const,
                stiffness: 100,
                damping: 12
            }
        }
    };

    return (
        <motion.div
            className="p-4 sm:p-6 lg:p-8"
            initial="hidden"
            animate="visible"
            variants={pageVariants}
        >
            <motion.div variants={itemVariants}>
                <PageHeader
                    title="Admin Management"
                    description="Configure company settings and review historical logs and records"
                    icon={Gear}
                    iconColor="text-primary-600"
                />
            </motion.div>

            <motion.div
                className="mb-6"
                variants={itemVariants}
            >
                <SearchBar
                    value={searchQuery}
                    onChange={setSearchQuery}
                    placeholder="Search for configurations, logs or keywords..."
                />

                {/* Section filters */}
                <div className="flex flex-wrap gap-2 mt-4">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setSelectedSection(null)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors
                            ${!selectedSection
                                ? 'bg-primary-100 text-primary-700 shadow-sm dark:bg-primary-900/30 dark:text-primary-400'
                                : 'bg-surface-secondary text-foreground-secondary hover:bg-surface-hover'}`
                        }
                    >
                        All
                    </motion.button>

                    {ADMIN_SECTIONS.map((section) => (
                        <motion.button
                            key={section.title}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setSelectedSection(section.title)}
                            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors
                                ${selectedSection === section.title
                                    ? 'bg-primary-100 text-primary-700 shadow-sm dark:bg-primary-900/30 dark:text-primary-400'
                                    : 'bg-surface-secondary text-foreground-secondary hover:bg-surface-hover'}`
                            }
                        >
                            {section.title}
                        </motion.button>
                    ))}
                </div>
            </motion.div>

            {filteredSections.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <EmptyState
                        icon={File}
                        title="No items found"
                        description="Try searching with different keywords or browse all items"
                        action={{
                            label: "View all items",
                            onClick: () => {
                                setSearchQuery("");
                                setSelectedSection(null);
                            }
                        }}
                    />
                </motion.div>
            ) : (
                <AnimatePresence>
                    {filteredSections.map((section) => (
                        <motion.div
                            key={section.title}
                            className="mb-10"
                            variants={sectionVariants}
                            initial="hidden"
                            animate="visible"
                            exit="hidden"
                            layout
                        >
                            <motion.div
                                className="flex items-center mb-4"
                                variants={itemVariants}
                            >
                                <h2 className="text-xl font-bold text-foreground-primary mr-2">
                                    {section.title}
                                </h2>
                                <div className="h-px grow bg-border-primary"></div>
                            </motion.div>
                            <motion.p
                                className="text-foreground-secondary mb-6"
                                variants={itemVariants}
                            >
                                {section.description}
                            </motion.p>

                            <NavigationCardGrid columns={3}>
                                {section.items.map((item) => (
                                    <motion.div
                                        key={item.name}
                                        variants={itemVariants}
                                        layout
                                    >
                                        <NavigationCard {...item} />
                                    </motion.div>
                                ))}
                            </NavigationCardGrid>
                        </motion.div>
                    ))}
                </AnimatePresence>
            )}
        </motion.div>
    );
}
