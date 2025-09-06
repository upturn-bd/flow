-- Notification System Tables
-- Comprehensive but not over-engineered structure following Flow HRIS patterns

-- Notification Types Table
CREATE TABLE notification_types (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(50), -- For UI icons (e.g., 'bell', 'user', 'calendar')
  color VARCHAR(20), -- For UI styling (e.g., 'blue', 'green', 'red')
  company_id INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Main Notifications Table
CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  
  -- Content
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  
  -- Type and Priority
  type_id INTEGER REFERENCES notification_types(id),
  priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  
  -- Recipients and Sender
  recipient_id VARCHAR(255) NOT NULL, -- Employee ID who receives the notification
  sender_id VARCHAR(255), -- Employee ID who sent/triggered the notification (nullable for system notifications)
  
  -- Status and Tracking
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  action_url VARCHAR(500), -- Optional URL for action (e.g., link to specific page/record)
  metadata JSONB, -- Flexible field for additional data (e.g., related record IDs, custom data)
  
  -- Context and Scoping
  context VARCHAR(100), -- Context like 'leave_request', 'project_update', 'system_alert'
  reference_id INTEGER, -- ID of related record if applicable
  reference_table VARCHAR(100), -- Table name of related record
  
  -- Company and Department Scoping (following existing patterns)
  company_id INTEGER NOT NULL,
  department_id INTEGER, -- Optional department scoping
  
  -- Expiry and Scheduling
  expires_at TIMESTAMP WITH TIME ZONE, -- Optional expiry date
  scheduled_for TIMESTAMP WITH TIME ZONE, -- Optional scheduled delivery time
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for Performance
CREATE INDEX idx_notifications_recipient_company ON notifications(recipient_id, company_id);
CREATE INDEX idx_notifications_unread ON notifications(recipient_id, is_read, company_id);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_context ON notifications(context, company_id);
CREATE INDEX idx_notifications_reference ON notifications(reference_table, reference_id);

-- Insert Default Notification Types
INSERT INTO notification_types (name, description, icon, color) VALUES
('System Alert', 'System-generated notifications', 'alert-circle', 'red'),
('Leave Request', 'Leave request related notifications', 'calendar', 'blue'),
('Project Update', 'Project and task related notifications', 'briefcase', 'green'),
('Employee Update', 'Employee profile and HR related notifications', 'user', 'purple'),
('Attendance', 'Attendance and check-in related notifications', 'clock', 'orange'),
('General', 'General purpose notifications', 'bell', 'gray');

-- Notification Preferences Table (Optional for future enhancement)
CREATE TABLE notification_preferences (
  id SERIAL PRIMARY KEY,
  employee_id VARCHAR(255) NOT NULL,
  company_id INTEGER NOT NULL,
  
  -- Preferences by type
  email_enabled BOOLEAN DEFAULT TRUE,
  push_enabled BOOLEAN DEFAULT TRUE,
  notification_types JSONB DEFAULT '{}', -- Per-type preferences
  
  -- Timing preferences
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(employee_id, company_id)
);

-- Comments for documentation
COMMENT ON TABLE notifications IS 'Main notifications table for the Flow HRIS notification system';
COMMENT ON COLUMN notifications.metadata IS 'JSONB field for flexible additional data storage';
COMMENT ON COLUMN notifications.context IS 'Categorizes the notification context for better organization';
COMMENT ON COLUMN notifications.reference_id IS 'Links notification to specific records in other tables';