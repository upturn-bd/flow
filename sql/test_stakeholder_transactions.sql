-- Example SQL queries to test the stakeholder transactions system

-- 1. View all transactions with stakeholder information
SELECT * FROM stakeholder_transactions;

-- 2. Get transaction summary for a specific stakeholder (replace 1 with actual stakeholder_id)
SELECT * FROM get_stakeholder_transaction_summary(1);

-- 3. Get all accounts for a specific stakeholder
SELECT 
  a.*,
  s.name as stakeholder_name,
  s.is_completed as stakeholder_completed
FROM accounts a
INNER JOIN stakeholders s ON a.stakeholder_id = s.id
WHERE s.id = 1
ORDER BY a.transaction_date DESC;

-- 4. Create a sample transaction for a stakeholder
-- First, let's create a test stakeholder if needed
INSERT INTO stakeholders (
  name,
  address,
  contact_persons,
  process_id,
  current_step_order,
  is_active,
  is_completed,
  company_id
) VALUES (
  'Test Stakeholder Corp',
  '123 Business St, Dhaka',
  '[{"name": "John Doe", "phone": "+8801712345678", "email": "john@test.com"}]'::jsonb,
  1, -- Replace with valid process_id
  1,
  true,
  false,
  1 -- Replace with valid company_id
) RETURNING id;

-- 5. Create a transaction for the stakeholder (replace stakeholder_id and company_id)
INSERT INTO accounts (
  title,
  method,
  status,
  from_source,
  transaction_date,
  amount,
  currency,
  stakeholder_id,
  company_id,
  created_by
) VALUES (
  'Payment from Test Stakeholder Corp',
  'Bank',
  'Complete',
  'Client Payment',
  CURRENT_DATE,
  50000.00,
  'BDT',
  1, -- stakeholder_id from previous insert
  1, -- company_id
  'EMP001'
);

-- 6. Verify the trigger worked - stakeholder's updated_at should be recent
SELECT 
  id,
  name,
  updated_at,
  updated_at > (NOW() - INTERVAL '1 minute') as recently_updated
FROM stakeholders
WHERE id = 1;

-- 7. Get financial summary for all stakeholders
SELECT 
  s.id,
  s.name,
  COUNT(a.id) as transaction_count,
  COALESCE(SUM(CASE WHEN a.amount > 0 THEN a.amount ELSE 0 END), 0) as total_income,
  COALESCE(SUM(CASE WHEN a.amount < 0 THEN ABS(a.amount) ELSE 0 END), 0) as total_expense,
  COALESCE(SUM(a.amount), 0) as net_amount
FROM stakeholders s
LEFT JOIN accounts a ON s.id = a.stakeholder_id
WHERE s.company_id = 1 -- Replace with your company_id
GROUP BY s.id, s.name
ORDER BY net_amount DESC;

-- 8. Find stakeholders with pending transactions
SELECT DISTINCT
  s.id,
  s.name,
  COUNT(a.id) as pending_count,
  SUM(a.amount) as pending_amount
FROM stakeholders s
INNER JOIN accounts a ON s.id = a.stakeholder_id
WHERE a.status = 'Pending'
  AND s.company_id = 1 -- Replace with your company_id
GROUP BY s.id, s.name
ORDER BY pending_count DESC;

-- 9. Get stakeholder activity timeline (recent transactions)
SELECT 
  s.name as stakeholder,
  a.title as transaction_title,
  a.amount,
  a.currency,
  a.status,
  a.transaction_date,
  a.created_at
FROM accounts a
INNER JOIN stakeholders s ON a.stakeholder_id = s.id
WHERE s.company_id = 1 -- Replace with your company_id
  AND a.transaction_date >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY a.transaction_date DESC, a.created_at DESC;

-- 10. Update a transaction's stakeholder (testing bidirectional update)
UPDATE accounts
SET stakeholder_id = 2 -- Change to different stakeholder
WHERE id = 1; -- Replace with actual account id

-- Verify both stakeholders' updated_at changed
SELECT id, name, updated_at
FROM stakeholders
WHERE id IN (1, 2)
ORDER BY updated_at DESC;
