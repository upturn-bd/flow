/**
 * Pro-rata Calculation Utilities
 * 
 * This module provides utility functions for calculating pro-rata billing
 * when services are modified mid-billing-period.
 * 
 * Key Concepts:
 * - Standard billing period: 30 days
 * - Billing dates use day of month (1-28) to avoid end-of-month issues
 * - Pro-rata = (amount × days_active) / 30
 */

import {
  StakeholderServiceLineItem,
  StakeholderServiceHistory,
  ServiceHistoryPeriod,
  ProRataDetails,
  ProRataPeriod,
} from '@/lib/types/stakeholder-services';

// ==============================================================================
// CONSTANTS
// ==============================================================================

/**
 * Standard billing period in days (always 30 for consistent pro-rata)
 */
export const STANDARD_BILLING_PERIOD_DAYS = 30;

// ==============================================================================
// DATE UTILITIES
// ==============================================================================

/**
 * Parse a date string to Date object (handles ISO format)
 */
export function parseDate(dateStr: string): Date {
  return new Date(dateStr);
}

/**
 * Format a Date to ISO date string (YYYY-MM-DD)
 */
export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Calculate the number of days between two dates (inclusive of start, exclusive of end)
 */
export function daysBetween(startDate: Date | string, endDate: Date | string): number {
  const start = typeof startDate === 'string' ? parseDate(startDate) : startDate;
  const end = typeof endDate === 'string' ? parseDate(endDate) : endDate;
  
  const diffTime = end.getTime() - start.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return Math.max(0, diffDays);
}

/**
 * Get the day of month (1-31)
 */
export function getDayOfMonth(date: Date | string): number {
  const d = typeof date === 'string' ? parseDate(date) : date;
  return d.getDate();
}

/**
 * Get the day of week (1=Monday, 7=Sunday)
 */
export function getDayOfWeek(date: Date | string): number {
  const d = typeof date === 'string' ? parseDate(date) : date;
  const day = d.getDay();
  return day === 0 ? 7 : day; // Convert Sunday from 0 to 7
}

// ==============================================================================
// BILLING CYCLE CALCULATIONS
// ==============================================================================

/**
 * Calculate the next billing date based on cycle configuration
 */
export function calculateNextBillingDate(
  billingCycleType: 'monthly' | 'weekly' | 'yearly' | 'x_days',
  billingDayOfMonth?: number,
  billingDayOfWeek?: number,
  billingMonthOfYear?: number,
  billingIntervalDays?: number,
  lastBilledDate?: string,
  startDate?: string
): Date | null {
  const referenceDate = lastBilledDate 
    ? parseDate(lastBilledDate) 
    : startDate 
      ? new Date(parseDate(startDate).getTime() - 24 * 60 * 60 * 1000) // Day before start
      : new Date();

  switch (billingCycleType) {
    case 'monthly': {
      if (!billingDayOfMonth) return null;
      
      const nextMonth = new Date(referenceDate);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      nextMonth.setDate(billingDayOfMonth);
      
      // If the calculated date is still in the past or same as reference, add another month
      if (nextMonth <= referenceDate) {
        nextMonth.setMonth(nextMonth.getMonth() + 1);
      }
      
      return nextMonth;
    }
    
    case 'weekly': {
      if (!billingDayOfWeek) return null;
      
      const nextWeek = new Date(referenceDate);
      const currentDayOfWeek = getDayOfWeek(nextWeek);
      let daysToAdd = billingDayOfWeek - currentDayOfWeek;
      
      if (daysToAdd <= 0) {
        daysToAdd += 7;
      }
      
      nextWeek.setDate(nextWeek.getDate() + daysToAdd);
      
      return nextWeek;
    }
    
    case 'yearly': {
      if (!billingDayOfMonth || !billingMonthOfYear) return null;
      
      const nextYear = new Date(referenceDate);
      nextYear.setMonth(billingMonthOfYear - 1); // Months are 0-indexed
      nextYear.setDate(billingDayOfMonth);
      
      // If the calculated date is in the past, add a year
      if (nextYear <= referenceDate) {
        nextYear.setFullYear(nextYear.getFullYear() + 1);
      }
      
      return nextYear;
    }
    
    case 'x_days': {
      if (!billingIntervalDays) return null;
      
      const nextDate = new Date(referenceDate);
      nextDate.setDate(nextDate.getDate() + billingIntervalDays);
      
      return nextDate;
    }
    
    default:
      return null;
  }
}

/**
 * Calculate the previous billing date (start of current period)
 */
export function calculatePreviousBillingDate(
  billingCycleType: 'monthly' | 'weekly' | 'yearly' | 'x_days',
  billingDayOfMonth?: number,
  billingDayOfWeek?: number,
  billingMonthOfYear?: number,
  billingIntervalDays?: number,
  referenceDate?: string
): Date | null {
  const reference = referenceDate ? parseDate(referenceDate) : new Date();

  switch (billingCycleType) {
    case 'monthly': {
      if (!billingDayOfMonth) return null;
      
      const prevMonth = new Date(reference);
      
      // If current day is before billing day, go to previous month
      if (reference.getDate() < billingDayOfMonth) {
        prevMonth.setMonth(prevMonth.getMonth() - 1);
      }
      
      prevMonth.setDate(billingDayOfMonth);
      return prevMonth;
    }
    
    case 'weekly': {
      if (!billingDayOfWeek) return null;
      
      const prevWeek = new Date(reference);
      const currentDayOfWeek = getDayOfWeek(prevWeek);
      let daysToSubtract = currentDayOfWeek - billingDayOfWeek;
      
      if (daysToSubtract < 0) {
        daysToSubtract += 7;
      }
      
      prevWeek.setDate(prevWeek.getDate() - daysToSubtract);
      return prevWeek;
    }
    
    case 'yearly': {
      if (!billingDayOfMonth || !billingMonthOfYear) return null;
      
      const prevYear = new Date(reference);
      prevYear.setMonth(billingMonthOfYear - 1);
      prevYear.setDate(billingDayOfMonth);
      
      if (prevYear > reference) {
        prevYear.setFullYear(prevYear.getFullYear() - 1);
      }
      
      return prevYear;
    }
    
    case 'x_days': {
      // For x_days, we need the last_billed_date to calculate
      // This case should be handled by the calling code with last_billed_date
      return null;
    }
    
    default:
      return null;
  }
}

// ==============================================================================
// PRO-RATA CALCULATIONS
// ==============================================================================

/**
 * Calculate pro-rata amount for a given number of days
 * 
 * @param fullAmount - Full amount for the billing period
 * @param daysActive - Number of days the service was active
 * @param totalDays - Total days in the period (default: 30)
 * @returns Pro-rated amount rounded to 2 decimal places
 */
export function calculateProRataAmount(
  fullAmount: number,
  daysActive: number,
  totalDays: number = STANDARD_BILLING_PERIOD_DAYS
): number {
  if (totalDays === 0) return 0;
  if (daysActive >= totalDays) return fullAmount;
  
  return Math.round((fullAmount * daysActive / totalDays) * 100) / 100;
}

/**
 * Calculate total amount from line items
 */
export function calculateLineItemsTotal(lineItems: Array<{ quantity: number; unit_price: number }>): number {
  return lineItems.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
}

/**
 * Calculate tax amount
 */
export function calculateTaxAmount(subtotal: number, taxRate: number): number {
  return Math.round((subtotal * taxRate / 100) * 100) / 100;
}

/**
 * Calculate total with tax
 */
export function calculateTotalWithTax(subtotal: number, taxRate: number): number {
  const taxAmount = calculateTaxAmount(subtotal, taxRate);
  return Math.round((subtotal + taxAmount) * 100) / 100;
}

// ==============================================================================
// SERVICE HISTORY ANALYSIS
// ==============================================================================

/**
 * Parse line items from history value (stored as JSONB array)
 */
export function parseLineItemsFromHistory(
  historyValue: any
): Array<{ description: string; quantity: number; unit_price: number; amount: number }> {
  if (!historyValue) return [];
  if (Array.isArray(historyValue)) return historyValue;
  return [];
}

/**
 * Find overlapping history periods for a billing period
 * Returns periods with their days active within the billing period
 */
export function getHistoryPeriodsForBilling(
  history: StakeholderServiceHistory[],
  billingStart: string,
  billingEnd: string
): ServiceHistoryPeriod[] {
  const periodStart = parseDate(billingStart);
  const periodEnd = parseDate(billingEnd);
  
  // Filter to line_items_changed entries that overlap with billing period
  const relevantHistory = history.filter(h => {
    if (h.change_type !== 'line_items_changed') return false;
    
    const effectiveFrom = parseDate(h.effective_from);
    const effectiveTo = h.effective_to ? parseDate(h.effective_to) : new Date('2099-12-31');
    
    // Check if this history entry overlaps with the billing period
    return effectiveFrom <= periodEnd && effectiveTo >= periodStart;
  });
  
  // Sort by effective_from
  relevantHistory.sort((a, b) => 
    parseDate(a.effective_from).getTime() - parseDate(b.effective_from).getTime()
  );
  
  // Calculate days active for each period
  return relevantHistory.map(h => {
    const effectiveFrom = parseDate(h.effective_from);
    const effectiveTo = h.effective_to ? parseDate(h.effective_to) : new Date('2099-12-31');
    
    // Clamp to billing period
    const actualStart = effectiveFrom > periodStart ? effectiveFrom : periodStart;
    const actualEnd = effectiveTo < periodEnd ? effectiveTo : periodEnd;
    
    const daysActive = daysBetween(actualStart, actualEnd);
    
    return {
      history_id: h.id!,
      change_type: h.change_type,
      old_value: h.old_value,
      new_value: h.new_value,
      effective_from: h.effective_from,
      effective_to: h.effective_to,
      days_active: Math.min(daysActive, STANDARD_BILLING_PERIOD_DAYS),
    };
  });
}

/**
 * Calculate pro-rata invoice details when there are mid-period changes
 */
export function calculateProRataInvoice(
  currentLineItems: StakeholderServiceLineItem[],
  history: StakeholderServiceHistory[],
  billingStart: string,
  billingEnd: string,
  taxRate: number = 0
): {
  lineItems: Array<{
    description: string;
    quantity: number;
    unit_price: number;
    amount: number;
    pro_rata_days?: number;
    original_amount?: number;
  }>;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  proRataDetails: ProRataDetails | null;
} {
  const historyPeriods = getHistoryPeriodsForBilling(history, billingStart, billingEnd);
  
  // If no history or only one period covering entire billing cycle, no pro-rata needed
  if (historyPeriods.length <= 1) {
    const subtotal = calculateLineItemsTotal(currentLineItems);
    const taxAmount = calculateTaxAmount(subtotal, taxRate);
    
    return {
      lineItems: currentLineItems.map(item => ({
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        amount: item.quantity * item.unit_price,
      })),
      subtotal,
      taxAmount,
      totalAmount: subtotal + taxAmount,
      proRataDetails: null,
    };
  }
  
  // Calculate pro-rata for each period
  const periods: ProRataPeriod[] = [];
  const consolidatedLineItems: Map<string, {
    description: string;
    quantity: number;
    unit_price: number;
    amount: number;
    pro_rata_days: number;
    original_amount: number;
  }> = new Map();
  
  for (const period of historyPeriods) {
    const lineItems = parseLineItemsFromHistory(period.new_value);
    const periodSubtotal = calculateLineItemsTotal(lineItems);
    const proRataAmount = calculateProRataAmount(periodSubtotal, period.days_active);
    
    const periodEffectiveFrom = parseDate(period.effective_from);
    const periodEffectiveTo = period.effective_to 
      ? parseDate(period.effective_to) 
      : parseDate(billingEnd);
    
    // Clamp to billing period
    const billingStartDate = parseDate(billingStart);
    const billingEndDate = parseDate(billingEnd);
    const actualStart = periodEffectiveFrom > billingStartDate ? periodEffectiveFrom : billingStartDate;
    const actualEnd = periodEffectiveTo < billingEndDate ? periodEffectiveTo : billingEndDate;
    
    periods.push({
      start: formatDate(actualStart),
      end: formatDate(actualEnd),
      days: period.days_active,
      amount: proRataAmount,
      line_items: lineItems.map(item => ({
        description: item.description,
        original_amount: item.amount,
        pro_rata_amount: calculateProRataAmount(item.amount, period.days_active),
      })),
    });
    
    // Consolidate line items for invoice
    for (const item of lineItems) {
      const key = `${item.description}-${item.unit_price}`;
      const proRataItemAmount = calculateProRataAmount(item.amount, period.days_active);
      
      if (consolidatedLineItems.has(key)) {
        const existing = consolidatedLineItems.get(key)!;
        existing.amount += proRataItemAmount;
        existing.pro_rata_days += period.days_active;
        existing.original_amount += item.amount;
      } else {
        consolidatedLineItems.set(key, {
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          amount: proRataItemAmount,
          pro_rata_days: period.days_active,
          original_amount: item.amount,
        });
      }
    }
  }
  
  const lineItemsArray = Array.from(consolidatedLineItems.values());
  const subtotal = lineItemsArray.reduce((sum, item) => sum + item.amount, 0);
  const taxAmount = calculateTaxAmount(subtotal, taxRate);
  const totalDays = periods.reduce((sum, p) => sum + p.days, 0);
  
  return {
    lineItems: lineItemsArray,
    subtotal: Math.round(subtotal * 100) / 100,
    taxAmount,
    totalAmount: Math.round((subtotal + taxAmount) * 100) / 100,
    proRataDetails: {
      periods,
      total_days: totalDays,
      has_changes: true,
    },
  };
}

// ==============================================================================
// INVOICE NUMBER GENERATION (Client-side preview)
// ==============================================================================

/**
 * Generate a preview invoice number (actual generation happens server-side)
 * Format: PREFIX-YYYY-MM-DD-XXX
 */
export function generateInvoiceNumberPreview(
  prefix: string = 'INV',
  date: Date = new Date()
): string {
  const dateStr = formatDate(date);
  return `${prefix}-${dateStr}-XXX`;
}

// ==============================================================================
// BILLING PERIOD HELPERS
// ==============================================================================

/**
 * Get suggested billing period dates based on service configuration
 */
export function getSuggestedBillingPeriod(
  billingCycleType: 'monthly' | 'weekly' | 'yearly' | 'x_days',
  billingDayOfMonth?: number,
  billingDayOfWeek?: number,
  billingMonthOfYear?: number,
  billingIntervalDays?: number,
  lastBilledDate?: string,
  startDate?: string
): { start: Date; end: Date } | null {
  const start = lastBilledDate 
    ? parseDate(lastBilledDate)
    : calculatePreviousBillingDate(
        billingCycleType,
        billingDayOfMonth,
        billingDayOfWeek,
        billingMonthOfYear,
        billingIntervalDays,
        startDate
      );
  
  if (!start) return null;
  
  const end = calculateNextBillingDate(
    billingCycleType,
    billingDayOfMonth,
    billingDayOfWeek,
    billingMonthOfYear,
    billingIntervalDays,
    formatDate(start),
    startDate
  );
  
  if (!end) return null;
  
  // End date should be the day before the next billing date
  const actualEnd = new Date(end);
  actualEnd.setDate(actualEnd.getDate() - 1);
  
  return { start, end: actualEnd };
}

/**
 * Validate a billing period
 */
export function validateBillingPeriod(
  startDate: string,
  endDate: string
): { valid: boolean; error?: string } {
  const start = parseDate(startDate);
  const end = parseDate(endDate);
  
  if (isNaN(start.getTime())) {
    return { valid: false, error: 'Invalid start date' };
  }
  
  if (isNaN(end.getTime())) {
    return { valid: false, error: 'Invalid end date' };
  }
  
  if (end < start) {
    return { valid: false, error: 'End date must be after start date' };
  }
  
  const days = daysBetween(start, end);
  if (days > 366) {
    return { valid: false, error: 'Billing period cannot exceed one year' };
  }
  
  return { valid: true };
}
