"use client";

import { useState, useEffect } from "react";
import { LockKey, Link as LinkIcon, Copy, CheckCircle, ShareNetwork, Export } from "@phosphor-icons/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface PublicAccessSectionProps {
  stakeholderName: string;
  companyName: string;
  accessCode?: string;
}

export default function PublicAccessSection({
  stakeholderName,
  companyName,
  accessCode,
}: PublicAccessSectionProps) {
  const [copied, setCopied] = useState<"code" | "linkWithCode" | "linkWithoutCode" | null>(null);
  const [canNativeShare, setCanNativeShare] = useState(false);

  // Check for native share support on mount
  useEffect(() => {
    setCanNativeShare(typeof navigator !== "undefined" && !!navigator.share);
  }, []);

  if (!accessCode) {
    return null;
  }

  // Generate URL-safe versions of names
  const encodedCompany = encodeURIComponent(companyName);
  const encodedStakeholder = encodeURIComponent(stakeholderName);
  
  // Build public page URLs
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const publicPageUrlWithoutCode = `${baseUrl}/public-tickets/${encodedCompany}/${encodedStakeholder}`;
  const publicPageUrlWithCode = `${publicPageUrlWithoutCode}?code=${accessCode}`;

  const copyToClipboard = async (text: string, type: "code" | "linkWithCode" | "linkWithoutCode") => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      toast.success("Copied to clipboard!");
      
      // Reset copied state after 2 seconds
      setTimeout(() => {
        setCopied(null);
      }, 2000);
    } catch (error) {
      toast.error("Failed to copy to clipboard");
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${stakeholderName} - Ticket Portal`,
          text: `Access the ticket portal for ${stakeholderName}.\n\nAccess Code: ${accessCode}`,
          url: publicPageUrlWithCode,
        });
      } catch (error) {
        // User cancelled sharing or share failed
        if ((error as Error).name !== "AbortError") {
          toast.error("Failed to share");
        }
      }
    } else {
      // Fallback to copy link with code
      copyToClipboard(publicPageUrlWithCode, "linkWithCode");
    }
  };

  return (
    <div className="bg-surface-primary rounded-lg border border-border-primary p-6 space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ShareNetwork size={20} weight="duotone" className="text-primary-600" />
          <h2 className="text-lg font-semibold text-foreground-primary">Public Ticket Access</h2>
        </div>
        <Button
          size="sm"
          variant="primary"
          onClick={handleNativeShare}
          className="flex items-center gap-2"
        >
          <Export size={16} weight="bold" />
          {canNativeShare ? "Share" : "Copy Link"}
        </Button>
      </div>

      <p className="text-sm text-foreground-secondary mb-4">
        Share this access code and link with the stakeholder to allow them to create and view their tickets directly.
      </p>

      {/* Access Code */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <LockKey size={16} className="text-foreground-tertiary" />
          <label className="text-xs font-medium text-foreground-secondary uppercase tracking-wide">
            Access Code
          </label>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 px-4 py-3 bg-surface-secondary border border-border-primary rounded-lg">
            <code className="text-lg font-mono font-bold tracking-widest text-foreground-primary">
              {accessCode}
            </code>
          </div>
          <button
            onClick={() => copyToClipboard(accessCode, "code")}
            className="p-3 bg-surface-secondary border border-border-primary rounded-lg 
                     hover:bg-surface-hover transition-colors shrink-0"
            title="Copy access code"
          >
            {copied === "code" ? (
              <CheckCircle size={20} weight="fill" className="text-success" />
            ) : (
              <Copy size={20} className="text-foreground-secondary" />
            )}
          </button>
        </div>
      </div>

      {/* Public URL with Code */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <LinkIcon size={16} className="text-foreground-tertiary" />
          <label className="text-xs font-medium text-foreground-secondary uppercase tracking-wide">
            Direct Link (with code)
          </label>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 px-3 py-2 bg-surface-secondary border border-border-primary rounded-lg overflow-hidden">
            <p className="text-xs font-mono text-foreground-secondary truncate">
              {publicPageUrlWithCode}
            </p>
          </div>
          <button
            onClick={() => copyToClipboard(publicPageUrlWithCode, "linkWithCode")}
            className="p-3 bg-surface-secondary border border-border-primary rounded-lg 
                     hover:bg-surface-hover transition-colors shrink-0"
            title="Copy direct link"
          >
            {copied === "linkWithCode" ? (
              <CheckCircle size={20} weight="fill" className="text-success" />
            ) : (
              <Copy size={20} className="text-foreground-secondary" />
            )}
          </button>
        </div>
        <p className="text-xs text-foreground-tertiary">
          Opens directly without asking for access code
        </p>
      </div>

      {/* Public URL without Code */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <LinkIcon size={16} className="text-foreground-tertiary" />
          <label className="text-xs font-medium text-foreground-secondary uppercase tracking-wide">
            Link (requires code entry)
          </label>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 px-3 py-2 bg-surface-secondary border border-border-primary rounded-lg overflow-hidden">
            <p className="text-xs font-mono text-foreground-secondary truncate">
              {publicPageUrlWithoutCode}
            </p>
          </div>
          <button
            onClick={() => copyToClipboard(publicPageUrlWithoutCode, "linkWithoutCode")}
            className="p-3 bg-surface-secondary border border-border-primary rounded-lg 
                     hover:bg-surface-hover transition-colors shrink-0"
            title="Copy link"
          >
            {copied === "linkWithoutCode" ? (
              <CheckCircle size={20} weight="fill" className="text-success" />
            ) : (
              <Copy size={20} className="text-foreground-secondary" />
            )}
          </button>
        </div>
        <p className="text-xs text-foreground-tertiary">
          Stakeholder will be prompted to enter the access code
        </p>
      </div>

      {/* Info Banner */}
      <div className="mt-4 p-3 bg-info/10 dark:bg-info/20 border border-info/30 rounded-lg">
        <p className="text-xs text-foreground-primary">
          <span className="font-medium">Note:</span> Stakeholders can use this access to view only their own tickets created from the public page. They cannot see tickets created by your internal team.
        </p>
      </div>
    </div>
  );
}
