'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FolderKanban, Clock, RefreshCw } from 'lucide-react';
import { staggerContainer, fadeInUp } from '@/components/ui/animations';
import SectionHeader from '@/app/(home)/home/components/SectionHeader';
import SectionContainer from '@/app/(home)/home/components/SectionContainer';
import LoadingSection from '@/app/(home)/home/components/LoadingSection';
import EmptyState from '@/app/(home)/home/components/EmptyState';
import BaseWidget from './BaseWidget';
import { WidgetProps } from '@/lib/types/widgets';
import { useProjects } from '@/hooks/useProjects';
import { formatDateToDayMonth } from '@/lib/utils';
import { useRouter } from 'next/navigation';

export default function ProjectsWidget({ config }: WidgetProps) {
  const router = useRouter();
  const { fetchOngoingProjects, ongoingProjects, ongoingLoading } = useProjects();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProjects = async () => {
      setLoading(true);
      await fetchOngoingProjects(5, true); // Fetch 5 most recent ongoing projects
      setLoading(false);
    };
    loadProjects();
  }, [fetchOngoingProjects]);

  const handleRefresh = async () => {
    await fetchOngoingProjects(5, true);
  };

  const handleProjectClick = (projectId: string) => {
    router.push(`/ops/project`);
  };

  return (
    <BaseWidget config={config}>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 h-full flex flex-col">
        <div className="p-5">
          <SectionHeader title="My Projects" icon={FolderKanban} iconColor="text-purple-600" />
        </div>
        
        {loading || ongoingLoading ? (
          <div className="flex-1">
            <LoadingSection text="Loading projects..." icon={FolderKanban} />
          </div>
        ) : (
          <motion.div
            variants={staggerContainer}
            className="px-5 pb-5 flex-1"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-500">Ongoing Projects</h3>
              <motion.button
                whileHover={{ rotate: 180 }}
                transition={{ duration: 0.3 }}
                onClick={handleRefresh}
                className="rounded-full p-2 bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                <RefreshCw size={16} className="text-gray-600" />
              </motion.button>
            </div>

            <div className="space-y-3 min-h-[200px]">
              {ongoingProjects.length > 0 ? (
                ongoingProjects.slice(0, 5).map((project) => (
                  <motion.div
                    key={project.id}
                    variants={fadeInUp}
                    onClick={() => handleProjectClick(project.id!)}
                    className="flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-purple-50 rounded-lg transition-colors text-sm font-medium border border-gray-100 cursor-pointer"
                  >
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <div className="w-2 h-2 rounded-full bg-purple-500 flex-shrink-0"></div>
                      <span className="truncate">{project.project_title}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                      <Clock size={14} className="text-gray-400" />
                      <span className="whitespace-nowrap text-gray-600 text-xs">
                        {formatDateToDayMonth(project.end_date)}
                      </span>
                    </div>
                  </motion.div>
                ))
              ) : (
                <EmptyState 
                  icon={FolderKanban} 
                  message="No ongoing projects at this time" 
                />
              )}
            </div>

            {ongoingProjects.length > 5 && (
              <div className="mt-4 text-center">
                <button
                  onClick={() => router.push('/ops/project')}
                  className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                >
                  View all projects →
                </button>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </BaseWidget>
  );
}
