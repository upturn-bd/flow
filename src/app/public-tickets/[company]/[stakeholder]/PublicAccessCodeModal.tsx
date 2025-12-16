"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/Card";
import BaseModal from "@/components/ui/modals/BaseModal";
import { FormField } from "@/components/forms";
import { LockKey, Warning } from "@phosphor-icons/react";

interface PublicAccessCodeModalProps {
  isOpen: boolean;
  companyName: string;
  stakeholderName: string;
  onVerify: (code: string) => void;
  loading?: boolean;
  error?: string | null;
}

export default function PublicAccessCodeModal({
  isOpen,
  companyName,
  stakeholderName,
  onVerify,
  loading = false,
  error = null,
}: PublicAccessCodeModalProps) {
  const [accessCode, setAccessCode] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (accessCode.trim()) {
      onVerify(accessCode.trim());
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={() => {}} // Prevent closing - user must enter valid code
      title="Enter Access Code"
      size="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mb-4">
            <LockKey size={32} weight="duotone" className="text-primary-600" />
          </div>
          <h2 className="text-xl font-bold text-foreground-primary mb-2">
            Verify Your Access
          </h2>
          <p className="text-sm text-foreground-secondary">
            Enter your 8-character access code to view and create tickets for:
          </p>
          <Card className="mt-3" padding="sm" hover={false}>
            <CardContent className="py-2">
              <p className="text-sm font-medium text-foreground-primary">
                {stakeholderName}
              </p>
              <p className="text-xs text-foreground-tertiary mt-1">
                {companyName}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-error/10 border border-error/30 text-error px-4 py-3 rounded-lg flex items-start gap-3">
            <Warning size={20} weight="fill" className="shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium mb-1">Verification Failed</p>
              <p>{error}</p>
            </div>
          </div>
        )}

        {/* Access Code Input */}
        <FormField label="Access Code" required>
          <input
            type="text"
            id="access-code"
            value={accessCode}
            onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
            placeholder="Enter 8-character code"
            maxLength={8}
            className="w-full px-4 py-3 text-center text-lg font-mono tracking-widest uppercase
                     bg-surface-primary border border-border-primary rounded-lg
                     text-foreground-primary placeholder-foreground-tertiary
                     focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
                     transition-colors"
            required
            autoFocus
            disabled={loading}
          />
          <p className="text-xs text-foreground-tertiary mt-2 text-center">
            The access code was provided to you by your account manager
          </p>
        </FormField>

        {/* Submit Button */}
        <Button
          type="submit"
          variant="primary"
          size="md"
          className="w-full"
          disabled={loading || accessCode.trim().length !== 8}
          isLoading={loading}
        >
          Verify Access
        </Button>

        {/* Help Text */}
        <div className="text-center">
          <p className="text-xs text-foreground-tertiary">
            Don't have an access code?{" "}
            <span className="text-primary-600 font-medium">
              Contact your account manager
            </span>
          </p>
        </div>
      </form>
    </BaseModal>
  );
}
