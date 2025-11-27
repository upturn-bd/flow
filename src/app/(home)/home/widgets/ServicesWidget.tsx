'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  MessageSquare, 
  FileText, 
  DollarSign, 
  Briefcase,
  UserPlus,
  UserMinus,
  CreditCard,
  ArrowRight
} from 'lucide-react';

import BaseWidget from './BaseWidget';
import { WidgetProps } from '@/lib/types/widgets';
import SectionHeader from '../components/SectionHeader';
import { useRouter } from 'next/navigation';
import { cn } from '@/components/ui/class';

// Service definitions
interface Service {
  name: string;
  description: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
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
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    hoverBgColor: 'hover:bg-green-100',
  },
  {
    name: 'Complaints',
    description: 'Submit and track employee complaints',
    icon: MessageSquare,
    route: '/ops/complaint',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    hoverBgColor: 'hover:bg-orange-100',
  },
  {
    name: 'Requisitions',
    description: 'Create and manage requisition requests',
    icon: FileText,
    route: '/ops/requisition',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    hoverBgColor: 'hover:bg-blue-100',
  },
  {
    name: 'Settlement',
    description: 'Handle employee settlements',
    icon: DollarSign,
    route: '/ops/settlement',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
    hoverBgColor: 'hover:bg-indigo-100',
  },
  {
    name: 'Payroll',
    description: 'View payroll information',
    icon: CreditCard,
    route: '/ops/payroll',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    hoverBgColor: 'hover:bg-purple-100',
  },
  {
    name: 'Onboarding',
    description: 'Manage employee onboarding',
    icon: UserPlus,
    route: '/ops/onboarding',
    color: 'text-teal-600',
    bgColor: 'bg-teal-50',
    hoverBgColor: 'hover:bg-teal-100',
  },
  {
    name: 'Offboarding',
    description: 'Handle employee offboarding',
    icon: UserMinus,
    route: '/ops/offboarding',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    hoverBgColor: 'hover:bg-red-100',
  },
  {
    name: 'HRIS',
    description: 'Access HRIS information',
    icon: Briefcase,
    route: '/ops/hris',
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    hoverBgColor: 'hover:bg-gray-100',
  },
];

export default function ServicesWidget({ config, isEditMode, onToggle, onSizeChange }: WidgetProps) {
  const router = useRouter();

  const handleServiceClick = (route: string) => {
    router.push(route);
  };

  return (
    <BaseWidget config={config} isEditMode={isEditMode} onToggle={onToggle} onSizeChange={onSizeChange}>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 h-full flex flex-col overflow-hidden">
        <div className="p-5 flex-shrink-0">
          <SectionHeader title="Services" icon={Briefcase} iconColor="text-gray-600" />
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
                  'flex items-center justify-between p-4 rounded-lg transition-all text-left border border-gray-100',
                  service.bgColor,
                  service.hoverBgColor,
                  'group'
                )}
              >
                <div className="flex items-start gap-3 flex-1">
                  <div className={cn('p-2 rounded-lg bg-white shadow-sm', service.color)}>
                    <service.icon size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className={cn('font-semibold text-sm mb-1', service.color)}>
                      {service.name}
                    </h3>
                    <p className="text-xs text-gray-600 line-clamp-2">
                      {service.description}
                    </p>
                  </div>
                </div>
                <ArrowRight 
                  size={16} 
                  className={cn(
                    'flex-shrink-0 ml-2 transition-transform group-hover:translate-x-1',
                    service.color
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
