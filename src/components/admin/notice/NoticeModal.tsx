"use client";

import { NoticeType } from "@/lib/types";
import { validateNewsAndNoticeType } from "@/lib/utils/validation";
import { NewspaperClipping } from "@phosphor-icons/react";
import { FormModal } from "@/components/ui/modals";
import { FormField } from "@/components/forms";

interface NoticeModalProps {
  onSubmit: (values: NoticeType) => void;
  onClose: () => void;
  isOpen: boolean;
  isLoading?: boolean;
}

export default function NoticesCreateModal({
  onSubmit,
  onClose,
  isOpen,
  isLoading = false,
}: NoticeModalProps) {
  const initialValues: NoticeType = {
    name: "",
  };

  return (
    <FormModal<NoticeType>
      title="Configure News & Notice Type"
      icon={<NewspaperClipping size={24} weight="duotone" />}
      initialValues={initialValues}
      validationFn={validateNewsAndNoticeType}
      onSubmit={onSubmit}
      onClose={onClose}
      isOpen={isOpen}
      isLoading={isLoading}
      submitButtonText="Create Type"
    >
      {({ values, errors, handleChange }) => (
        <FormField
          name="name"
          label="Type Name"
          icon={<NewspaperClipping size={18} weight="duotone" />}
          placeholder="Enter Type Name"
          value={values.name}
          error={errors.name}
          onChange={handleChange}
        />
      )}
    </FormModal>
  );
}
