"use client";

import { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Plus, Trash2 } from 'lucide-react';
import BaseModal from '@/components/ui/modals/BaseModal';
import { useFormState } from '@/hooks/useFormState';
import { useStakeholders } from '@/hooks/useStakeholders';
import { useEmployees } from '@/hooks/useEmployees';
import AssigneeField from '@/components/forms/AssigneeField';
import SingleEmployeeSelector from '@/components/forms/SingleEmployeeSelector';
import { StakeholderType } from '@/lib/types/schemas';
import { validateStakeholder, validationErrorsToObject } from '@/lib/validation/schemas/stakeholders';

interface StakeholderFormProps {
  isOpen: boolean;
  onClose: () => void;
  stakeholderTypes: StakeholderType[];
  onSuccess: () => void;
}

interface ContactFormData {
  name: string;
  role: string;
  phone: string;
  email: string;
  address: string;
}

export default function StakeholderForm({ 
  isOpen, 
  onClose, 
  stakeholderTypes, 
  onSuccess 
}: StakeholderFormProps) {
  const { createStakeholder } = useStakeholders();
  const { employees, fetchEmployees } = useEmployees();
  const [contacts, setContacts] = useState<ContactFormData[]>([
    { name: '', role: '', phone: '', email: '', address: '' }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Load employees when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchEmployees();
    }
  }, [isOpen, fetchEmployees]);

  const {
    formValues,
    errors,
    touched,
    isDirty,
    isValid,
    handleChange: baseHandleChange,
    handleBlur,
    resetForm
  } = useFormState({
    initialData: {
      name: '',
      address: '',
      stakeholder_type_id: '',
      manager_id: '',
      assigned_employees: [] as string[],
    },
    validateFn: (data) => {
      const formattedData = {
        ...data,
        stakeholder_type_id: data.stakeholder_type_id ? Number(data.stakeholder_type_id) : undefined,
        manager_id: data.manager_id || undefined, // Keep as string (UUID)
        contact_details: {
          contacts: contacts.filter(contact => 
            contact.name.trim() || contact.email.trim() || contact.phone.trim()
          )
        }
      };
      
      const validationErrors = validateStakeholder(formattedData);
      return {
        success: validationErrors.length === 0,
        errors: validationErrors
      };
    },
    validationErrorsToObject
  });

  const handleChange = useCallback(
    (e: React.ChangeEvent<any>) => {
      baseHandleChange(e);
    },
    [baseHandleChange]
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSubmitting(true);
      setSubmitError(null);

      const formattedData = {
        ...formValues,
        stakeholder_type_id: formValues.stakeholder_type_id ? Number(formValues.stakeholder_type_id) : undefined,
        manager_id: formValues.manager_id || undefined, // Keep as string (UUID)
        contact_details: {
          contacts: contacts.filter(contact => 
            contact.name.trim() || contact.email.trim() || contact.phone.trim()
          )
        }
      };

      const result = await createStakeholder(formattedData);
      
      if (result.success) {
        onSuccess();
      } else {
        setSubmitError(result.error || 'Failed to create stakeholder');
      }
      setIsSubmitting(false);
    },
    [formValues, contacts, createStakeholder, onSuccess]
  );

  const addContact = () => {
    setContacts([...contacts, { name: '', role: '', phone: '', email: '', address: '' }]);
  };

  const removeContact = (index: number) => {
    if (contacts.length > 1) {
      setContacts(contacts.filter((_, i) => i !== index));
    }
  };

  const updateContact = (index: number, field: keyof ContactFormData, value: string) => {
    const updatedContacts = [...contacts];
    updatedContacts[index] = { ...updatedContacts[index], [field]: value };
    setContacts(updatedContacts);
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Add New Stakeholder"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {submitError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{submitError}</p>
          </div>
        )}

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
          
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Stakeholder Name *
            </label>
            <input
              type="text"
              id="name"
              value={formValues.name}
              onChange={handleChange}
              name="name"
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                errors.name && touched.name
                  ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                  : 'border-gray-300 focus:ring-purple-500 focus:border-purple-500'
              }`}
              placeholder="Enter stakeholder name"
            />
            {errors.name && touched.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          <div>
            <label htmlFor="stakeholder_type_id" className="block text-sm font-medium text-gray-700 mb-1">
              Stakeholder Type
            </label>
            <select
              id="stakeholder_type_id"
              name="stakeholder_type_id"
              value={formValues.stakeholder_type_id}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                errors.stakeholder_type_id && touched.stakeholder_type_id
                  ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                  : 'border-gray-300 focus:ring-purple-500 focus:border-purple-500'
              }`}
            >
              <option value="">Select stakeholder type</option>
              {stakeholderTypes.map(type => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
            {errors.stakeholder_type_id && touched.stakeholder_type_id && (
              <p className="mt-1 text-sm text-red-600">{errors.stakeholder_type_id}</p>
            )}
          </div>

          <SingleEmployeeSelector
            value={formValues.manager_id}
            onChange={(managerId) => {
              const syntheticEvent = {
                target: {
                  name: 'manager_id',
                  value: managerId
                }
              } as any;
              handleChange(syntheticEvent);
            }}
            employees={employees}
            label="Manager"
            error={errors.manager_id && touched.manager_id ? errors.manager_id : undefined}
            placeholder="Search and select manager (optional)..."
          />

          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
              Address
            </label>
            <textarea
              id="address"
              name="address"
              value={formValues.address}
              onChange={handleChange}
              rows={3}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                errors.address && touched.address
                  ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                  : 'border-gray-300 focus:ring-purple-500 focus:border-purple-500'
              }`}
              placeholder="Enter address"
            />
            {errors.address && touched.address && (
              <p className="mt-1 text-sm text-red-600">{errors.address}</p>
            )}
          </div>

          {/* Assigned Employees */}
          <AssigneeField
            value={formValues.assigned_employees}
            onChange={(assignees) => {
              const syntheticEvent = {
                target: {
                  name: 'assigned_employees',
                  value: assignees
                }
              } as any;
              handleChange(syntheticEvent);
            }}
            employees={employees}
            label="Assigned Employees"
            error={errors.assigned_employees && touched.assigned_employees ? errors.assigned_employees : undefined}
            placeholder="Search and select employees to assign..."
          />
        </div>

        {/* Contact Information */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Contact Information</h3>
            <button
              type="button"
              onClick={addContact}
              className="inline-flex items-center px-3 py-1 text-sm font-medium text-purple-600 hover:text-purple-700"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Contact
            </button>
          </div>

          {contacts.map((contact, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 border border-gray-200 rounded-lg space-y-3"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-gray-700">Contact {index + 1}</h4>
                {contacts.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeContact(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    value={contact.name}
                    onChange={(e) => updateContact(index, 'name', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500"
                    placeholder="Contact name"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Role
                  </label>
                  <input
                    type="text"
                    value={contact.role}
                    onChange={(e) => updateContact(index, 'role', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500"
                    placeholder="Job title or role"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={contact.phone}
                    onChange={(e) => updateContact(index, 'phone', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500"
                    placeholder="+880XXXXXXXXX"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={contact.email}
                    onChange={(e) => updateContact(index, 'email', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500"
                    placeholder="email@example.com"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Address
                  </label>
                  <input
                    type="text"
                    value={contact.address}
                    onChange={(e) => updateContact(index, 'address', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500"
                    placeholder="Contact address"
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 rounded-lg transition-colors flex items-center"
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Creating...
            </>
          ) : (
            'Create Stakeholder'
          )}
        </button>
      </div>
    </form>
    </BaseModal>
  );
}