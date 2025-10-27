"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Building2, Mail, Phone, MapPin, Users, Filter, Search } from 'lucide-react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { Stakeholder, StakeholderType } from '@/lib/types/schemas';

interface StakeholderListProps {
  stakeholders: Stakeholder[];
  stakeholderTypes: StakeholderType[];
  loading: boolean;
  error: string | null;
}

export default function StakeholderList({ 
  stakeholders, 
  stakeholderTypes, 
  loading, 
  error 
}: StakeholderListProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<number | null>(null);

  // Filter stakeholders based on search and type
  const filteredStakeholders = stakeholders.filter(stakeholder => {
    const matchesSearch = stakeholder.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      stakeholder.address?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = selectedType === null || stakeholder.stakeholder_type_id === selectedType;
    
    return matchesSearch && matchesType;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner className="h-8 w-8 text-purple-600" />
        <span className="ml-3 text-gray-600">Loading stakeholders...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search stakeholders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <select
            value={selectedType || ''}
            onChange={(e) => setSelectedType(e.target.value ? Number(e.target.value) : null)}
            className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 appearance-none bg-white"
          >
            <option value="">All Types</option>
            {stakeholderTypes.map(type => (
              <option key={type.id} value={type.id}>
                {type.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Stakeholders Grid */}
      {filteredStakeholders.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Building2 className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No stakeholders found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || selectedType ? 'Try adjusting your filters' : 'Get started by adding your first stakeholder'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStakeholders.map((stakeholder, index) => (
            <motion.div
              key={stakeholder.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Building2 className="h-5 w-5 text-purple-600" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-medium text-gray-900 truncate">
                      {stakeholder.name}
                    </h3>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {stakeholder.stakeholder_type?.name || 'Unknown'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Address */}
              {stakeholder.address && (
                <div className="flex items-start mb-3">
                  <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <p className="ml-2 text-sm text-gray-600 line-clamp-2">
                    {stakeholder.address}
                  </p>
                </div>
              )}

              {/* Contacts */}
              {stakeholder.contact_details?.contacts && stakeholder.contact_details.contacts.length > 0 && (
                <div className="space-y-2 mb-4">
                  {stakeholder.contact_details.contacts.slice(0, 2).map((contact, contactIndex) => (
                    <div key={contactIndex} className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-900">{contact.name}</span>
                        <span className="text-xs text-gray-500">{contact.role}</span>
                      </div>
                      <div className="flex items-center space-x-4 text-xs text-gray-600">
                        {contact.email && (
                          <div className="flex items-center">
                            <Mail className="h-3 w-3 mr-1" />
                            <span className="truncate">{contact.email}</span>
                          </div>
                        )}
                        {contact.phone && (
                          <div className="flex items-center">
                            <Phone className="h-3 w-3 mr-1" />
                            <span>{contact.phone}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {stakeholder.contact_details.contacts.length > 2 && (
                    <p className="text-xs text-gray-500 text-center">
                      +{stakeholder.contact_details.contacts.length - 2} more contacts
                    </p>
                  )}
                </div>
              )}

              {/* Assigned Employees */}
              {stakeholder.assigned_employees && stakeholder.assigned_employees.length > 0 && (
                <div className="flex items-center text-sm text-gray-600">
                  <Users className="h-4 w-4 mr-2" />
                  <span>{stakeholder.assigned_employees.length} assigned employee(s)</span>
                </div>
              )}

              {/* Footer */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">
                    Added {new Date(stakeholder.created_at || '').toLocaleDateString()}
                  </span>
                  <button 
                    onClick={() => router.push(`/ops/stakeholder/${stakeholder.id}`)}
                    className="text-purple-600 hover:text-purple-800 text-sm font-medium"
                  >
                    View Details
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}