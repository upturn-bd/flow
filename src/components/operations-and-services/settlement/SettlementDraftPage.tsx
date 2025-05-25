"use client";

import React from 'react';
import SettlementCreatePage from './SettlementCreatePage';

interface SettlementDraftPageProps {
  onClose: () => void;
  draftId: number;
}

export default function SettlementDraftPage({ onClose, draftId }: SettlementDraftPageProps) {
  return (
    <SettlementCreatePage 
      onClose={onClose}
      draftId={draftId}
    />
  );
} 