"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, TrashSimple, DotsSixVertical, CurrencyDollar, Hash, TextT, Package } from "@phosphor-icons/react";
import { StakeholderServiceLineItem, TemplateLineItem } from "@/lib/types/stakeholder-services";
import FormInputField from "@/components/ui/FormInputField";
import FormNumberField from "@/components/ui/FormNumberField";
import { formatCurrency } from "@/lib/utils";

interface LineItemFormData {
  id?: number;
  tempId?: string;
  description: string;
  quantity: number;
  unit_price: number;
}

interface ServiceLineItemsEditorProps {
  items: LineItemFormData[];
  onChange: (items: LineItemFormData[]) => void;
  currency: string;
  disabled?: boolean;
  error?: string;
}

export default function ServiceLineItemsEditor({
  items,
  onChange,
  currency,
  disabled = false,
  error,
}: ServiceLineItemsEditorProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const addItem = () => {
    const newItem: LineItemFormData = {
      tempId: `temp-${Date.now()}`,
      description: "",
      quantity: 1,
      unit_price: 0,
    };
    onChange([...items, newItem]);
  };

  const removeItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    onChange(newItems);
  };

  const updateItem = (index: number, field: keyof LineItemFormData, value: string | number) => {
    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      [field]: value,
    };
    onChange(newItems);
  };

  const calculateAmount = (item: LineItemFormData): number => {
    return (item.quantity || 0) * (item.unit_price || 0);
  };

  const calculateTotal = (): number => {
    return items.reduce((sum, item) => sum + calculateAmount(item), 0);
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newItems = [...items];
    const [draggedItem] = newItems.splice(draggedIndex, 1);
    newItems.splice(index, 0, draggedItem);
    onChange(newItems);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-semibold text-foreground-primary">
          Line Items
        </label>
        {!disabled && (
          <button
            type="button"
            onClick={addItem}
            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-primary-600 bg-primary-50 dark:bg-primary-950 border border-primary-200 dark:border-primary-800 rounded-md hover:bg-primary-100 dark:hover:bg-primary-900 transition-colors"
          >
            <Plus size={14} className="mr-1" />
            Add Item
          </button>
        )}
      </div>

      {error && (
        <p className="text-sm text-error">{error}</p>
      )}

      {items.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed border-border-primary rounded-lg bg-surface-secondary">
          <Package size={32} className="mx-auto text-foreground-tertiary mb-2" />
          <p className="text-sm text-foreground-secondary">No line items added</p>
          <p className="text-xs text-foreground-tertiary mt-1">
            Click "Add Item" to create line items for this service
          </p>
        </div>
      ) : (
        <>
          {/* Header */}
          <div className="hidden sm:grid grid-cols-12 gap-3 px-3 py-2 bg-surface-secondary rounded-t-lg border border-border-primary text-xs font-semibold text-foreground-secondary uppercase tracking-wide">
            <div className="col-span-1"></div>
            <div className="col-span-5">Description</div>
            <div className="col-span-2 text-right">Quantity</div>
            <div className="col-span-2 text-right">Unit Price</div>
            <div className="col-span-2 text-right">Amount</div>
          </div>

          {/* Line Items */}
          <div className="space-y-2 sm:space-y-0 sm:border-x sm:border-b border-border-primary sm:rounded-b-lg overflow-hidden">
            <AnimatePresence mode="popLayout">
              {items.map((item, index) => (
                <motion.div
                  key={item.id || item.tempId || index}
                  layout
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  draggable={!disabled}
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`
                    bg-surface-primary sm:border-b border border-border-primary sm:border-x-0 sm:border-t-0 last:border-b-0 rounded-lg sm:rounded-none
                    ${draggedIndex === index ? "opacity-50" : ""}
                    ${disabled ? "" : "cursor-move"}
                  `}
                >
                  {/* Mobile Layout */}
                  <div className="sm:hidden p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => updateItem(index, "description", e.target.value)}
                          placeholder="Item description"
                          disabled={disabled}
                          className="w-full px-3 py-2 text-sm border border-border-primary rounded-lg bg-surface-primary text-foreground-primary focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-surface-secondary disabled:cursor-not-allowed"
                        />
                      </div>
                      {!disabled && (
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="p-2 text-error hover:bg-error/10 rounded-lg transition-colors"
                          title="Remove item"
                        >
                          <TrashSimple size={18} />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="text-xs text-foreground-tertiary mb-1 block">Qty</label>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, "quantity", parseFloat(e.target.value) || 0)}
                          min={0}
                          step={1}
                          disabled={disabled}
                          className="w-full px-3 py-2 text-sm border border-border-primary rounded-lg bg-surface-primary text-foreground-primary text-right focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-surface-secondary disabled:cursor-not-allowed"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-foreground-tertiary mb-1 block">Price</label>
                        <input
                          type="number"
                          value={item.unit_price}
                          onChange={(e) => updateItem(index, "unit_price", parseFloat(e.target.value) || 0)}
                          min={0}
                          step={0.01}
                          disabled={disabled}
                          className="w-full px-3 py-2 text-sm border border-border-primary rounded-lg bg-surface-primary text-foreground-primary text-right focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-surface-secondary disabled:cursor-not-allowed"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-foreground-tertiary mb-1 block">Amount</label>
                        <div className="px-3 py-2 text-sm text-right font-medium text-foreground-primary bg-surface-secondary rounded-lg">
                          {formatCurrency(calculateAmount(item), currency)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Desktop Layout */}
                  <div className="hidden sm:grid grid-cols-12 gap-3 items-center px-3 py-3">
                    <div className="col-span-1 flex items-center justify-center">
                      {!disabled && (
                        <DotsSixVertical size={18} className="text-foreground-tertiary cursor-grab active:cursor-grabbing" />
                      )}
                    </div>
                    <div className="col-span-5">
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => updateItem(index, "description", e.target.value)}
                        placeholder="Item description"
                        disabled={disabled}
                        className="w-full px-3 py-2 text-sm border border-border-primary rounded-lg bg-surface-primary text-foreground-primary focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-surface-secondary disabled:cursor-not-allowed"
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, "quantity", parseFloat(e.target.value) || 0)}
                        min={0}
                        step={1}
                        disabled={disabled}
                        className="w-full px-3 py-2 text-sm border border-border-primary rounded-lg bg-surface-primary text-foreground-primary text-right focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-surface-secondary disabled:cursor-not-allowed"
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        value={item.unit_price}
                        onChange={(e) => updateItem(index, "unit_price", parseFloat(e.target.value) || 0)}
                        min={0}
                        step={0.01}
                        disabled={disabled}
                        className="w-full px-3 py-2 text-sm border border-border-primary rounded-lg bg-surface-primary text-foreground-primary text-right focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-surface-secondary disabled:cursor-not-allowed"
                      />
                    </div>
                    <div className="col-span-2 flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground-primary">
                        {formatCurrency(calculateAmount(item), currency)}
                      </span>
                      {!disabled && (
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="p-1.5 text-error hover:bg-error/10 rounded-lg transition-colors"
                          title="Remove item"
                        >
                          <TrashSimple size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Total */}
          <div className="flex justify-end mt-4">
            <div className="bg-surface-secondary border border-border-primary rounded-lg px-4 py-3 min-w-50">
              <div className="flex justify-between items-center text-sm">
                <span className="text-foreground-secondary font-medium">Subtotal:</span>
                <span className="text-foreground-primary font-semibold">
                  {formatCurrency(calculateTotal(), currency)}
                </span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Export helper to convert form data to API format
export function lineItemsFormToApi(
  items: LineItemFormData[],
  serviceId: number
): Omit<StakeholderServiceLineItem, "id" | "created_at">[] {
  return items.map((item, index) => ({
    service_id: serviceId,
    item_order: index + 1,
    description: item.description,
    quantity: item.quantity,
    unit_price: item.unit_price,
    amount: item.quantity * item.unit_price,
  }));
}

// Export helper to convert API data to form format
export function lineItemsApiToForm(
  items: StakeholderServiceLineItem[]
): LineItemFormData[] {
  return items
    .sort((a, b) => a.item_order - b.item_order)
    .map((item) => ({
      id: item.id,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
    }));
}

// Export helper for template line items
export function templateLineItemsToForm(
  items: TemplateLineItem[]
): LineItemFormData[] {
  return items.map((item, index) => ({
    tempId: `template-${index}`,
    description: item.description,
    quantity: item.quantity,
    unit_price: item.unit_price,
  }));
}

export type { LineItemFormData };
