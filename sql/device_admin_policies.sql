-- Add RLS policy for admins/managers to view all devices
DROP POLICY IF EXISTS "Admins can view all devices" ON user_devices;
CREATE POLICY "Admins can view all devices" ON user_devices
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM employees
            WHERE employees.id = auth.uid()
            AND employees.role IN ('Admin', 'Manager')
        )
    );

-- Add RLS policy for admins/managers to update device status
DROP POLICY IF EXISTS "Admins can update device status" ON user_devices;
CREATE POLICY "Admins can update device status" ON user_devices
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM employees
            WHERE employees.id = auth.uid()
            AND employees.role IN ('Admin', 'Manager')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM employees
            WHERE employees.id = auth.uid()
            AND employees.role IN ('Admin', 'Manager')
        )
    );

-- Add RLS policy for admins to delete devices
DROP POLICY IF EXISTS "Admins can delete devices" ON user_devices;
CREATE POLICY "Admins can delete devices" ON user_devices
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM employees
            WHERE employees.id = auth.uid()
            AND employees.role IN ('Admin', 'Manager')
        )
    );
