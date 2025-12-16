# Public Stakeholder Ticketing System

## Overview

The Public Stakeholder Ticketing System allows external stakeholders to create and view support tickets through a secure, unauthenticated public page. Each stakeholder receives a unique access code that grants them access to their personalized ticket portal.

## Features

### 🔐 Secure Access
- **Unique Access Codes**: Each stakeholder gets an 8-character alphanumeric code
- **Company-Scoped**: Access codes are unique within each company
- **No Authentication Required**: Stakeholders don't need to create accounts
- **Restricted View**: Stakeholders can only see their own public tickets

### 🎫 Ticket Management
- **Create Tickets**: Simple form for title, description, priority, and category
- **File Attachments**: Support for uploading multiple files
- **Priority Levels**: Low, Medium, High, and Urgent
- **Status Tracking**: Pending, In Progress, Pending Approval, Resolved
- **Category Organization**: Optional categorization for better organization

### 📧 Notifications
- **In-App Notifications**: Real-time notifications to stakeholder's KAM
- **Email Alerts**: Professional HTML emails via Resend
- **Priority-Based**: Visual indicators for urgent and high-priority tickets
- **Automatic Delivery**: Sent immediately upon ticket creation

### 🎨 User Experience
- **Clean Interface**: Modern, intuitive design
- **Responsive**: Works seamlessly on mobile, tablet, and desktop
- **Theme Support**: Full light/dark mode compatibility
- **Copy-to-Clipboard**: Easy sharing of access links

## Architecture

### Database Schema

#### stakeholders Table
```sql
ALTER TABLE stakeholders
ADD COLUMN access_code VARCHAR(8) UNIQUE;
```

#### stakeholder_issues Table
```sql
ALTER TABLE stakeholder_issues
ADD COLUMN created_from_public_page BOOLEAN DEFAULT FALSE;
```

### URL Structure

```
/public-tickets/[company]/[stakeholder]
```

- `[company]`: Company name or code
- `[stakeholder]`: Stakeholder name

**Optional Query Parameter:**
- `?code=XXXXXXXX`: Pre-populated access code

### Examples

**With Code (Direct Access):**
```
https://flow.example.com/public-tickets/Acme%20Corp/ABC%20Industries?code=A1B2C3D4
```

**Without Code (Requires Entry):**
```
https://flow.example.com/public-tickets/Acme%20Corp/ABC%20Industries
```

## Setup Instructions

### 1. Database Migration

Run the SQL migration file:

```bash
psql -d your_database -f sql/add_stakeholder_public_access.sql
```

This migration will:
- Add the `access_code` column to stakeholders
- Add the `created_from_public_page` column to stakeholder_issues
- Create helper functions for code generation
- Set up automatic triggers
- Backfill existing stakeholders with codes

### 2. Environment Configuration

Add the Resend API key to your environment:

```bash
# .env or .env.local
RESEND_API_KEY=re_your_resend_api_key_here
```

Get your API key from [Resend](https://resend.com).

### 3. Verify Installation

1. Navigate to any stakeholder details page
2. Look for the "Public Ticket Access" section
3. You should see:
   - The stakeholder's access code
   - Direct link (with code)
   - Link requiring code entry
   - Copy buttons for easy sharing

## Usage Guide

### For Administrators

#### Sharing Access with Stakeholders

1. **Navigate to Stakeholder Details**
   - Go to Admin → Stakeholders
   - Click on a stakeholder

2. **Locate Public Access Section**
   - Find the "Public Ticket Access" card
   - It displays the access code and shareable links

3. **Share Access**
   - **Option 1**: Copy the direct link (includes code)
   - **Option 2**: Copy the link and access code separately
   - Send via email, SMS, or your preferred communication method

#### Identifying Public Tickets

Public tickets are marked with a "Public" badge in:
- Ticket cards
- Ticket lists
- Stakeholder issues tab
- Main tickets page

This helps your team quickly identify tickets that originated from stakeholders.

### For Stakeholders

#### Accessing the Ticket Portal

1. **Receive Access Information**
   - Get the public link and/or access code from your account manager

2. **Open the Link**
   - Click the link or paste it in your browser

3. **Enter Access Code (if required)**
   - If the link doesn't include the code, a modal will appear
   - Enter your 8-character code
   - Click "Verify Access"

#### Creating a Ticket

1. **Click "Create New Ticket"**

2. **Fill in the Details**
   - **Title**: Brief description of the issue
   - **Description**: Detailed explanation
   - **Priority**: Low, Medium, High, or Urgent
   - **Category**: Optional classification
   - **Contact Info**: Optional (name, email, phone)
   - **Attachments**: Optional files

3. **Submit**
   - Click "Create Ticket"
   - Confirmation message will appear
   - Your account manager will be notified

#### Viewing Tickets

- All your previously created tickets are displayed
- See status, priority, and creation date
- Download attachments
- Click "Refresh" to check for updates

## Technical Details

### Components

#### Public Page Components
- **`page.tsx`**: Main public tickets page
- **`PublicAccessCodeModal.tsx`**: Code verification modal
- **`PublicTicketForm.tsx`**: Ticket creation form
- **`PublicTicketList.tsx`**: List of stakeholder's tickets

#### Admin Components
- **`PublicAccessSection.tsx`**: Access code display in stakeholder details
- Updated **`TicketCard.tsx`**: Added public badge
- Updated **`StakeholderIssuesTab.tsx`**: Added public badge

### Hooks

#### `usePublicStakeholderAccess`
Custom hook for public ticket operations:
- `verifyStakeholderAccess`: Verify company + stakeholder + code
- `fetchPublicTickets`: Get stakeholder's public tickets
- `createPublicTicket`: Create ticket with notifications
- `getAttachmentUrl`: Get URL for downloading attachments

### Email Templates

#### `stakeholder-ticket-email.ts`
Professional HTML email template featuring:
- Priority badges with color coding
- Stakeholder name and ticket details
- Direct link to ticket in Flow
- Responsive design
- Plain text fallback

### Security Features

1. **Access Code Validation**
   - 8-character alphanumeric codes
   - Company-scoped uniqueness
   - Case-insensitive matching

2. **Data Isolation**
   - Stakeholders see only their own tickets
   - Only tickets created from public page
   - No access to internal tickets

3. **Input Sanitization**
   - All user input is escaped
   - XSS prevention in emails
   - SQL injection protection via Supabase

4. **Error Handling**
   - Sentry integration for monitoring
   - User-friendly error messages
   - Graceful degradation

## Troubleshooting

### Access Code Not Working

**Problem**: Stakeholder can't access with their code

**Solutions**:
1. Verify the code is correct (case-insensitive)
2. Check that the company name matches
3. Ensure the stakeholder name is correct
4. Confirm the stakeholder is active

### Emails Not Sending

**Problem**: Notifications aren't being received

**Solutions**:
1. Verify `RESEND_API_KEY` is set
2. Check Resend dashboard for delivery status
3. Verify stakeholder's KAM has an email address
4. Check spam/junk folders

### Tickets Not Appearing

**Problem**: Created tickets don't show up

**Solutions**:
1. Click the "Refresh" button
2. Verify the stakeholder ID matches
3. Check database for `created_from_public_page = true`
4. Look in browser console for errors

### Theme Issues

**Problem**: Colors or styling look wrong

**Solutions**:
1. Clear browser cache
2. Check CSS custom properties are loaded
3. Verify ThemeProvider is wrapping the app
4. Test in both light and dark modes

## Maintenance

### Regenerating Access Codes

If an access code needs to be changed:

```sql
-- Generate new code for specific stakeholder
UPDATE stakeholders
SET access_code = ensure_unique_access_code(company_id)
WHERE id = [stakeholder_id];
```

### Viewing Public Ticket Stats

```sql
-- Count public tickets by stakeholder
SELECT 
  s.name as stakeholder_name,
  COUNT(si.id) as public_ticket_count
FROM stakeholders s
LEFT JOIN stakeholder_issues si ON s.id = si.stakeholder_id 
  AND si.created_from_public_page = true
GROUP BY s.id, s.name
ORDER BY public_ticket_count DESC;
```

### Monitoring Email Delivery

Check Resend dashboard:
1. Log in to [Resend](https://resend.com)
2. Navigate to Emails
3. Filter by status (delivered, bounced, complained)
4. Review delivery rates and errors

## Best Practices

### For Administrators

1. **Share Access Securely**
   - Use secure channels (encrypted email, SMS)
   - Verify stakeholder identity before sharing
   - Consider separate codes for different contacts

2. **Monitor Public Tickets**
   - Check for high-priority tickets regularly
   - Set up dashboard widgets for visibility
   - Respond promptly to urgent issues

3. **Maintain Contact Information**
   - Keep stakeholder KAM assignments updated
   - Ensure KAM email addresses are valid
   - Review contact persons periodically

### For Stakeholders

1. **Keep Access Code Secure**
   - Don't share your code publicly
   - Store it in a safe place
   - Contact your account manager if compromised

2. **Provide Clear Details**
   - Write descriptive ticket titles
   - Include all relevant information
   - Attach supporting files when helpful

3. **Use Appropriate Priority**
   - Reserve "Urgent" for critical issues
   - Use "High" for important but not immediate
   - Choose "Low" or "Medium" for routine matters

## API Integration (Future)

The public ticketing system can be extended with a REST API:

```typescript
// Example API endpoints (not yet implemented)
POST /api/public-tickets/verify
POST /api/public-tickets/create
GET /api/public-tickets/list
GET /api/public-tickets/:id
```

This would enable:
- Mobile app integration
- Third-party system connections
- Webhook notifications
- Automated ticket creation

## Support

For issues or questions about the public ticketing system:

1. **Check Documentation**: Review this file and inline code comments
2. **Review Logs**: Check Sentry for error reports
3. **Database Queries**: Verify data integrity with SQL queries
4. **Contact Support**: Reach out to the Flow HRIS support team

## Changelog

### Version 1.0.0 (Initial Release)
- ✅ Secure access code system
- ✅ Public ticket creation portal
- ✅ Email notifications via Resend
- ✅ In-app notifications to KAM
- ✅ Visual badges for public tickets
- ✅ Shareable links with copy-to-clipboard
- ✅ Full theme support
- ✅ Sentry error tracking
- ✅ File attachment support
- ✅ Responsive design

## License

Part of the Flow HRIS system. All rights reserved.
