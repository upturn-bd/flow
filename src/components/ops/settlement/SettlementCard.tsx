"use client";

import { motion } from "framer-motion";
import { Card, CardHeader, CardContent, StatusBadge, InfoRow } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Calendar, DollarSign, User, FileText, Edit, Trash2, ExternalLink, AlertCircle } from "lucide-react";

interface Settlement {
  id: number;
  settlement_type_id: number;
  amount: number;
  event_date: string;
  requested_to: string;
  description: string;
  status: string;
  in_advance: boolean;
  claimant_id: string;
}

interface SettlementType {
  id: number;
  name: string;
  allowance?: number;
}

interface Employee {
  id: string;
  name: string;
}

interface SettlementCardProps {
  settlement: Settlement;
  settlementTypes: SettlementType[];
  employees: Employee[];
  onEdit?: () => void;
  onDelete?: () => void;
  onDetails?: () => void;
  isDeleting?: boolean;
  showEdit?: boolean;
  showDelete?: boolean;
  showDetails?: boolean;
}

export default function SettlementCard({
  settlement,
  settlementTypes,
  employees,
  onEdit,
  onDelete,
  onDetails,
  isDeleting = false,
  showEdit = false,
  showDelete = false,
  showDetails = false,
}: SettlementCardProps) {
  const settlementType = settlementTypes.find(type => type.id === settlement.settlement_type_id);
  const claimant = employees.find(emp => emp.id === settlement.claimant_id);
  const requestedTo = employees.find(emp => emp.id === settlement.requested_to);

  const getStatusVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return 'success';
      case 'pending':
        return 'warning';
      case 'rejected':
        return 'error';
      case 'draft':
        return 'info';
      default:
        return 'info';
    }
  };

  const actions = (
    <div className="flex items-center gap-2">
      {showEdit && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onEdit}
          className="p-2 h-8 w-8 hover:bg-blue-50 hover:text-blue-600"
        >
          <Edit size={14} />
        </Button>
      )}
      {showDelete && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
          isLoading={isDeleting}
          className="p-2 h-8 w-8 hover:bg-red-50 hover:text-red-600"
        >
          <Trash2 size={14} />
        </Button>
      )}
      {showDetails && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onDetails}
          className="p-2 h-8 w-8 hover:bg-gray-50 hover:text-gray-700"
        >
          <ExternalLink size={14} />
        </Button>
      )}
    </div>
  );

  return (
    <Card>
      <CardHeader
        title={settlementType?.name || "Settlement Request"}
        subtitle={settlement.description}
        icon={settlement.in_advance ? <AlertCircle size={20} className="text-orange-500" /> : <DollarSign size={20} className="text-green-500" />}
        action={actions}
      />
      
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          <InfoRow
            icon={<DollarSign size={16} />}
            label="Amount"
            value={`$${settlement.amount.toLocaleString()}`}
          />
          <InfoRow
            icon={<Calendar size={16} />}
            label="Event Date"
            value={settlement.event_date}
          />
          <InfoRow
            icon={<User size={16} />}
            label="Claimant"
            value={claimant?.name || "Unknown"}
          />
          <InfoRow
            icon={<User size={16} />}
            label="Requested To"
            value={requestedTo?.name || "Unknown"}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <StatusBadge 
            status={settlement.status} 
            variant={getStatusVariant(settlement.status)}
          />
          {settlement.in_advance && (
            <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full font-medium">
              Advance Payment
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
