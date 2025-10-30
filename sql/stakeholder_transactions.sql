-- Stakeholder Transactions System
-- This creates a bidirectional relationship between stakeholders and accounts
-- for tracking financial activities and transactions

-- Step 1: Add stakeholder_id to accounts table
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS stakeholder_id INTEGER REFERENCES stakeholders(id) ON DELETE SET NULL;

-- Create index for stakeholder_id in accounts
CREATE INDEX IF NOT EXISTS idx_accounts_stakeholder_id ON accounts(stakeholder_id);

-- Step 2: Create stakeholder_transactions view for easier querying
-- This view combines accounts data with stakeholder information
CREATE OR REPLACE VIEW stakeholder_transactions AS
SELECT 
  a.id,
  a.title,
  a.method,
  a.company_id,
  a.status,
  a.from_source,
  a.transaction_date,
  a.amount,
  a.currency,
  a.additional_data,
  a.stakeholder_id,
  a.created_at,
  a.updated_at,
  a.created_by,
  a.updated_by,
  s.name as stakeholder_name,
  s.address as stakeholder_address,
  s.is_completed as stakeholder_completed
FROM accounts a
LEFT JOIN stakeholders s ON a.stakeholder_id = s.id
WHERE a.stakeholder_id IS NOT NULL;

-- Step 3: Create a function to track transaction totals per stakeholder
CREATE OR REPLACE FUNCTION get_stakeholder_transaction_summary(p_stakeholder_id INTEGER)
RETURNS TABLE (
  total_transactions BIGINT,
  total_income NUMERIC,
  total_expense NUMERIC,
  net_amount NUMERIC,
  pending_transactions BIGINT,
  completed_transactions BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT as total_transactions,
    COALESCE(SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END), 0) as total_income,
    COALESCE(SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END), 0) as total_expense,
    COALESCE(SUM(amount), 0) as net_amount,
    COUNT(CASE WHEN status = 'Pending' THEN 1 END)::BIGINT as pending_transactions,
    COUNT(CASE WHEN status = 'Complete' THEN 1 END)::BIGINT as completed_transactions
  FROM accounts
  WHERE stakeholder_id = p_stakeholder_id;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Create trigger to sync stakeholder activity
-- This helps track when a stakeholder has recent transactions
CREATE OR REPLACE FUNCTION update_stakeholder_last_transaction()
RETURNS TRIGGER AS $$
BEGIN
  -- Update stakeholder's updated_at when a transaction is added/modified
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE stakeholders 
    SET updated_at = NOW()
    WHERE id = NEW.stakeholder_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to accounts table
DROP TRIGGER IF EXISTS sync_stakeholder_activity ON accounts;
CREATE TRIGGER sync_stakeholder_activity
  AFTER INSERT OR UPDATE OF stakeholder_id, amount, status
  ON accounts
  FOR EACH ROW
  WHEN (NEW.stakeholder_id IS NOT NULL)
  EXECUTE FUNCTION update_stakeholder_last_transaction();

-- Step 5: Add comments for documentation
COMMENT ON COLUMN accounts.stakeholder_id IS 'Reference to stakeholder associated with this transaction';
COMMENT ON VIEW stakeholder_transactions IS 'View combining account transactions with stakeholder information for easier querying';
COMMENT ON FUNCTION get_stakeholder_transaction_summary IS 'Returns transaction summary statistics for a specific stakeholder';
