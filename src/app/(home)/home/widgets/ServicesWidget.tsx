'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, ChatCircle as MessageSquare, FileText, CurrencyDollar, Briefcase, UserPlus, UserMinus, CreditCard, ArrowRight, Icon } from "@phosphor-icons/react";
import { staggerContainer, fadeInUp } from '@/components/ui/animations';
import BaseWidget from './BaseWidget';
import { WidgetProps } from '@/lib/types/widgets';
import SectionHeader from '../components/SectionHeader';
import { useRouter } from 'next/navigation';
import { cn } from '@/components/ui/class';

// Service definitions
interface Service {
  name: string;
  description: string;
  icon: Icon;
  route: string;
  color: string;
  bgColor: string;
  hoverBgColor: string;
}

const services: Service[] = [
  {
    name: 'Leave Management',
    description: 'Request and manage leave applications',
    icon: Calendar,
    route: '/ops/leave',
    color: 'text-primary-600',
    bgColor: 'bg-surface-primary',
    hoverBgColor: 'hover:bg-surface-hover',
  },
  {
    name: 'Complaints',
    description: 'Submit and track employee complaints',
    icon: MessageSquare,
    route: '/ops/complaint',
    color: 'text-primary-600',
    bgColor: 'bg-surface-primary',
    hoverBgColor: 'hover:bg-surface-hover',
  },
  {
    name: 'Requisitions',
    description: 'Create and manage requisition requests',
    icon: FileText,
    route: '/ops/requisition',
    color: 'text-primary-600',
    bgColor: 'bg-surface-primary',
    hoverBgColor: 'hover:bg-surface-hover',
  },
  {
    name: 'Settlement',
    description: 'Handle employee settlements',
    icon: CurrencyDollar,
    route: '/ops/settlement',
    color: 'text-primary-600',
    bgColor: 'bg-surface-primary',
    hoverBgColor: 'hover:bg-surface-hover',
  },
  {
    name: 'Payroll',
    description: 'View payroll information',
    icon: CreditCard,
    route: '/ops/payroll',
    color: 'text-primary-600',
    bgColor: 'bg-surface-primary',
    hoverBgColor: 'hover:bg-surface-hover',
  },
  {
    name: 'Onboarding',
    description: 'Manage employee onboarding',
    icon: UserPlus,
    route: '/ops/onboarding',
    color: 'text-primary-600',
    bgColor: 'bg-surface-primary',
    hoverBgColor: 'hover:bg-surface-hover',
  },
  {
    name: 'Offboarding',
    description: 'Handle employee offboarding',
    icon: UserMinus,
    route: '/ops/offboarding',
    color: 'text-primary-600',
    bgColor: 'bg-surface-primary',
    hoverBgColor: 'hover:bg-surface-hover',
  },
  {
    name: 'HRIS',
    description: 'Access HRIS information',
    icon: Briefcase,
    route: '/ops/hris',
    color: 'text-primary-600',
    bgColor: 'bg-surface-primary',
    hoverBgColor: 'hover:bg-surface-hover',
  },
];

export default function ServicesWidget({ config, isEditMode, onToggle, onSizeChange }: WidgetProps) {
  const router = useRouter();

  const handleServiceClick = (route: string) => {
    router.push(route);
  };

  return (
    <BaseWidget config={config} isEditMode={isEditMode} onToggle={onToggle} onSizeChange={onSizeChange}>
      <div className="bg-surface-primary rounded-xl shadow-sm border border-border-primary h-full flex flex-col overflow-hidden">
        <div className="p-5 shrink-0">
          <SectionHeader title="Services" icon={Briefcase} iconColor="text-foreground-secondary" />
        </div>
        
        <div
          className="px-5 pb-5 flex-1 overflow-hidden flex flex-col"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1 overflow-y-auto min-h-0">
            {services.map((service) => (
              <motion.button
                key={service.route}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: 0.05 }}
                onClick={() => handleServiceClick(service.route)}
                className={cn(
                  'flex items-center justify-between p-4 rounded-lg transition-all text-left border border-border-primary',
                  service.bgColor,
                  service.hoverBgColor,
                  'group'
                )}
              >
                <div className="flex items-start gap-3 flex-1">
                  <div className={cn('p-2 rounded-lg bg-primary-50 dark:bg-primary-950/30 shadow-sm', service.color)}>
                    <service.icon size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className={cn('font-semibold text-sm mb-1 text-foreground-primary')}>
                      {service.name}
                    </h3>
                    <p className="text-xs text-foreground-secondary line-clamp-2">
                      {service.description}
                    </p>
                  </div>
                </div>
                <ArrowRight 
                  size={16} 
                  className={cn(
                    'shrink-0 ml-2 transition-transform group-hover:translate-x-1',
                    'text-primary-600 dark:text-primary-400'
                  )} 
                />
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    </BaseWidget>
  );
}
