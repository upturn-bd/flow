import { CURRENCY_SYMBOLS } from "@/lib/constants";
import { 
  StakeholderServiceInvoice, 
  StakeholderInvoiceLineItem 
} from "@/lib/types/stakeholder-services";
import { ContactPerson } from "@/lib/types/schemas";

export interface InvoiceEmailData {
  invoice: StakeholderServiceInvoice;
  items: StakeholderInvoiceLineItem[];
  companyName: string;
  companyAddress?: string;
  companyEmail?: string;
  companyPhone?: string;
  logoUrl?: string;
  locale?: string; // Optional locale for formatting (defaults to 'en-US')
}

/**
 * Generate HTML for invoice email
 */
export function generateInvoiceEmailHTML(data: InvoiceEmailData): string {
  const {
    invoice,
    items,
    companyName,
    companyAddress,
    companyEmail,
    companyPhone,
    logoUrl,
    locale = 'en-US', // Default to en-US if not provided
  } = data;

  const currencySymbol = CURRENCY_SYMBOLS[invoice.currency] || invoice.currency;

  // Get customer info from snapshot or stakeholder
  const customerName = invoice.customer_snapshot?.name || invoice.stakeholder?.name || 'Customer';
  const customerAddress = invoice.customer_snapshot?.address || invoice.stakeholder?.address;
  const customerContactPersons = invoice.customer_snapshot?.contact_persons || invoice.stakeholder?.contact_persons || [];

  // Format currency
  const formatCurrency = (amount: number) => {
    return `${currencySymbol} ${amount.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Format date
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Contact persons HTML
  const contactPersonsHTML = customerContactPersons
    .map(
      (contact: ContactPerson) => `
      <div style="margin-bottom: 8px;">
        <strong>${contact.name}</strong><br />
        ${contact.email ? `Email: ${contact.email}<br />` : ''}
        ${contact.phone ? `Phone: ${contact.phone}` : ''}
      </div>
    `
    )
    .join('');

  // Invoice items HTML
  const itemsHTML = items
    .map(
      (item, index) => `
      <tr style="${index % 2 === 0 ? 'background-color: #f9fafb;' : ''}">
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${index + 1}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${item.description}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">${formatCurrency(item.unit_price)}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;"><strong>${formatCurrency(item.amount)}</strong></td>
      </tr>
    `
    )
    .join('');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice ${invoice.invoice_number}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f3f4f6;">
  <div style="max-width: 800px; margin: 40px auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); overflow: hidden;">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; padding: 40px 30px; text-align: center;">
      ${logoUrl ? `<img src="${logoUrl}" alt="${companyName}" style="max-width: 150px; margin-bottom: 20px;" />` : ''}
      <h1 style="margin: 0 0 10px 0; font-size: 32px; font-weight: bold;">INVOICE</h1>
      <p style="margin: 0; font-size: 18px; opacity: 0.9;">${invoice.invoice_number}</p>
    </div>

    <!-- Content -->
    <div style="padding: 40px 30px;">
      
      <!-- Company and Customer Information -->
      <div style="display: flex; justify-content: space-between; margin-bottom: 40px;">
        <!-- From -->
        <div style="flex: 1; padding-right: 20px;">
          <h2 style="color: #667eea; font-size: 14px; font-weight: 600; text-transform: uppercase; margin: 0 0 15px 0; letter-spacing: 0.5px;">From</h2>
          <div style="font-size: 16px;">
            <strong style="font-size: 18px; display: block; margin-bottom: 8px;">${companyName}</strong>
            ${companyAddress ? `<p style="margin: 0 0 4px 0;">${companyAddress}</p>` : ''}
            ${companyEmail ? `<p style="margin: 0 0 4px 0;">Email: ${companyEmail}</p>` : ''}
            ${companyPhone ? `<p style="margin: 0 0 4px 0;">Phone: ${companyPhone}</p>` : ''}
          </div>
        </div>

        <!-- To -->
        <div style="flex: 1; padding-left: 20px;">
          <h2 style="color: #667eea; font-size: 14px; font-weight: 600; text-transform: uppercase; margin: 0 0 15px 0; letter-spacing: 0.5px;">Bill To</h2>
          <div style="font-size: 16px;">
            <strong style="font-size: 18px; display: block; margin-bottom: 8px;">${customerName}</strong>
            ${customerAddress ? `<p style="margin: 0 0 8px 0;">${customerAddress}</p>` : ''}
            ${contactPersonsHTML ? `<div style="margin-top: 12px;">${contactPersonsHTML}</div>` : ''}
          </div>
        </div>
      </div>

      <!-- Invoice Details -->
      <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
        <div style="display: flex; justify-content: space-between; flex-wrap: wrap;">
          <div style="margin-bottom: 10px;">
            <span style="color: #6b7280; font-size: 14px; display: block;">Invoice Date</span>
            <span style="font-weight: 600; font-size: 16px;">${formatDate(invoice.invoice_date)}</span>
          </div>
          ${invoice.due_date ? `
          <div style="margin-bottom: 10px;">
            <span style="color: #6b7280; font-size: 14px; display: block;">Due Date</span>
            <span style="font-weight: 600; font-size: 16px;">${formatDate(invoice.due_date)}</span>
          </div>
          ` : ''}
          <div style="margin-bottom: 10px;">
            <span style="color: #6b7280; font-size: 14px; display: block;">Billing Period</span>
            <span style="font-weight: 600; font-size: 16px;">${formatDate(invoice.billing_period_start)} - ${formatDate(invoice.billing_period_end)}</span>
          </div>
        </div>
      </div>

      <!-- Invoice Items -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
        <thead>
          <tr style="background-color: #667eea; color: #ffffff;">
            <th style="padding: 12px; text-align: left; font-weight: 600; width: 5%;">#</th>
            <th style="padding: 12px; text-align: left; font-weight: 600; width: 45%;">Description</th>
            <th style="padding: 12px; text-align: center; font-weight: 600; width: 15%;">Qty</th>
            <th style="padding: 12px; text-align: right; font-weight: 600; width: 17.5%;">Unit Price</th>
            <th style="padding: 12px; text-align: right; font-weight: 600; width: 17.5%;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHTML}
        </tbody>
      </table>

      <!-- Totals -->
      <div style="text-align: right; margin-bottom: 30px;">
        <div style="display: inline-block; text-align: left; min-width: 300px;">
          <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
            <span style="color: #6b7280;">Subtotal:</span>
            <span style="font-weight: 600;">${formatCurrency(invoice.subtotal)}</span>
          </div>
          ${invoice.tax_amount > 0 ? `
          <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
            <span style="color: #6b7280;">Tax (${invoice.tax_rate}%):</span>
            <span style="font-weight: 600;">${formatCurrency(invoice.tax_amount)}</span>
          </div>
          ` : ''}
          <div style="display: flex; justify-content: space-between; padding: 15px 0; border-top: 2px solid #667eea; margin-top: 5px;">
            <span style="font-size: 18px; font-weight: bold; color: #667eea;">Total:</span>
            <span style="font-size: 18px; font-weight: bold; color: #667eea;">${formatCurrency(invoice.total_amount)}</span>
          </div>
          ${invoice.paid_amount > 0 ? `
          <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
            <span style="color: #10b981;">Paid:</span>
            <span style="font-weight: 600; color: #10b981;">-${formatCurrency(invoice.paid_amount)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 10px 0;">
            <span style="font-weight: bold;">Balance Due:</span>
            <span style="font-weight: bold; color: ${invoice.total_amount - invoice.paid_amount > 0 ? '#ef4444' : '#10b981'};">
              ${formatCurrency(invoice.total_amount - invoice.paid_amount)}
            </span>
          </div>
          ` : ''}
        </div>
      </div>

      <!-- Notes -->
      ${invoice.notes ? `
      <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 4px; margin-bottom: 30px;">
        <h3 style="margin: 0 0 10px 0; color: #92400e; font-size: 14px; font-weight: 600; text-transform: uppercase;">Notes</h3>
        <p style="margin: 0; color: #78350f; font-size: 14px; line-height: 1.6;">${invoice.notes}</p>
      </div>
      ` : ''}

      <!-- Footer Message -->
      <div style="text-align: center; padding: 20px 0; border-top: 1px solid #e5e7eb; margin-top: 30px;">
        <p style="margin: 0; color: #6b7280; font-size: 14px;">Thank you for your business!</p>
        <p style="margin: 5px 0 0 0; color: #9ca3af; font-size: 12px;">
          If you have any questions about this invoice, please contact us.
        </p>
      </div>
    </div>

    <!-- Footer -->
    <div style="background-color: #f9fafb; padding: 20px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
      <p style="margin: 0; color: #6b7280; font-size: 12px;">
        This is an automatically generated invoice from ${companyName}
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Generate plain text version of invoice email (for email clients that don't support HTML)
 */
export function generateInvoiceEmailText(data: InvoiceEmailData): string {
  const { invoice, items, companyName, locale = 'en-US' } = data;
  const currencySymbol = CURRENCY_SYMBOLS[invoice.currency] || invoice.currency;

  // Get customer info from snapshot or stakeholder
  const customerName = invoice.customer_snapshot?.name || invoice.stakeholder?.name || 'Customer';
  const customerAddress = invoice.customer_snapshot?.address || invoice.stakeholder?.address;
  const customerContactPersons = invoice.customer_snapshot?.contact_persons || invoice.stakeholder?.contact_persons || [];

  const formatCurrency = (amount: number) => {
    return `${currencySymbol} ${amount.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const contactPersons = customerContactPersons
    .map((contact: ContactPerson) => {
      return `${contact.name}\n${contact.email ? `Email: ${contact.email}\n` : ''}${contact.phone ? `Phone: ${contact.phone}` : ''}`;
    })
    .join('\n\n');

  const itemsList = items
    .map(
      (item, index) =>
        `${index + 1}. ${item.description}\n   Qty: ${item.quantity} x ${formatCurrency(item.unit_price)} = ${formatCurrency(item.amount)}`
    )
    .join('\n\n');

  return `
INVOICE ${invoice.invoice_number}

FROM:
${companyName}
${data.companyAddress || ''}
${data.companyEmail ? `Email: ${data.companyEmail}` : ''}
${data.companyPhone ? `Phone: ${data.companyPhone}` : ''}

BILL TO:
${customerName}
${customerAddress || ''}
${contactPersons}

INVOICE DETAILS:
Invoice Date: ${formatDate(invoice.invoice_date)}
${invoice.due_date ? `Due Date: ${formatDate(invoice.due_date)}` : ''}
Billing Period: ${formatDate(invoice.billing_period_start)} - ${formatDate(invoice.billing_period_end)}

ITEMS:
${itemsList}

TOTALS:
Subtotal: ${formatCurrency(invoice.subtotal)}
${invoice.tax_amount > 0 ? `Tax (${invoice.tax_rate}%): ${formatCurrency(invoice.tax_amount)}` : ''}
---
Total: ${formatCurrency(invoice.total_amount)}
${invoice.paid_amount > 0 ? `\nPaid: -${formatCurrency(invoice.paid_amount)}\nBalance Due: ${formatCurrency(invoice.total_amount - invoice.paid_amount)}` : ''}

${invoice.notes ? `\nNOTES:\n${invoice.notes}` : ''}

---
Thank you for your business!

This is an automatically generated invoice from ${companyName}
  `.trim();
}
