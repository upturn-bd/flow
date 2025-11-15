# Home Page Widget System

This document describes the customizable widget system for the Flow HRIS home page.

## Overview

The home page uses a flexible widget-based system that allows users to customize their dashboard layout. Widgets can be enabled/disabled, reordered, and resized.

## Architecture

### Core Types

- **WidgetType**: Enum of available widget types (`attendance`, `notices`, `tasks`, `projects`, `stakeholder-issues`)
- **WidgetConfig**: Configuration for a widget instance (id, type, enabled, position, size, order, settings)
- **HomeLayoutConfig**: User's complete layout configuration stored in database
- **WidgetDefinition**: Metadata about each widget type (name, description, icon, component, permissions)

### Database Schema

Layout configurations are stored in the `home_layout_configs` table:
- `employee_id`: Owner of the layout
- `company_id`: Company context
- `widgets`: JSONB array of widget configurations
- `layout_version`: For handling future migrations

See `sql/home_layout_system.sql` for the complete schema.

### Hooks

- **useHomeLayout**: Manages loading and saving layout configurations
- **useStakeholderIssues**: Fetches and manages stakeholder issues
- **useProjects**: Fetches user's projects

## Available Widgets

### 1. Attendance Widget
- **Purpose**: Track daily check-in and check-out
- **Features**: Site selection, location tracking, late/early status
- **Permissions**: All employees

### 2. Notices Widget
- **Purpose**: View company notices and announcements
- **Features**: Filter by all/unread/urgent, mark as read
- **Permissions**: All employees

### 3. Tasks Widget
- **Purpose**: View assigned tasks
- **Features**: Shows incomplete tasks with due dates
- **Permissions**: All employees

### 4. Projects Widget (NEW)
- **Purpose**: View ongoing projects
- **Features**: Shows 5 most recent ongoing projects, click to view details
- **Permissions**: All employees

### 5. Stakeholder Issues Widget (NEW)
- **Purpose**: View and create stakeholder issues
- **Features**: 
  - View issues assigned to user
  - Create new issues (manager/admin only)
  - View issue details
  - Color-coded priority and status
- **Permissions**: All can view, manager/admin can create

## Default Layout

New users get the following default widget layout:
1. Notices (medium, top-left)
2. Attendance (medium, top-right)
3. Tasks (medium, bottom-left)
4. Projects (medium, bottom-right)

## Grid System

The layout uses a responsive grid:
- Mobile (sm): 1 column
- Tablet (md): 2 columns
- Desktop (lg): 2 columns
- Wide screens (xl): 3 columns

Widget sizes:
- **small**: 1 column
- **medium**: 1 column (default)
- **large**: 2 columns
- **full**: 3 columns

## Adding New Widgets

To add a new widget:

1. **Define the widget type** in `src/lib/types/widgets.ts`:
   ```typescript
   export type WidgetType = 
     | 'attendance'
     | 'notices'
     | 'tasks'
     | 'projects'
     | 'stakeholder-issues'
     | 'your-new-widget'; // Add here
   ```

2. **Create the widget component** in `src/app/(home)/home/widgets/YourWidget.tsx`:
   ```typescript
   export default function YourWidget({ config }: WidgetProps) {
     return (
       <BaseWidget config={config}>
         {/* Your widget content */}
       </BaseWidget>
     );
   }
   ```

3. **Register the widget** in `src/app/(home)/home/widgets/widgetRegistry.ts`:
   ```typescript
   export const WIDGET_REGISTRY: Record<string, WidgetDefinition> = {
     // ... existing widgets
     'your-new-widget': {
       type: 'your-new-widget',
       name: 'Your Widget Name',
       description: 'Widget description',
       icon: YourIcon,
       defaultSize: 'medium',
       requiresRole: ['employee', 'manager', 'admin'],
       component: YourWidget,
     },
   };
   ```

4. **Add rendering logic** in `src/app/(home)/home/page.tsx`:
   ```typescript
   case 'your-new-widget':
     return <YourWidget key={key} config={widgetConfig} />;
   ```

## Future Enhancements

Potential improvements for the widget system:

1. **Drag-and-Drop**: Allow users to rearrange widgets visually
2. **Widget Customization**: Per-widget settings (e.g., number of items to show)
3. **Widget Library**: UI to add/remove widgets
4. **Layout Templates**: Predefined layouts for different roles
5. **Export/Import**: Share layouts between users
6. **Analytics Widgets**: Dashboard metrics and charts
7. **Custom Widgets**: Allow admins to create custom widgets

## Technical Notes

- Widget configurations are saved to database on user preference changes
- Fallback to default layout if user has no saved configuration
- All widgets support role-based access control
- Widgets are lazy-loaded to improve initial page performance
- Layout is responsive and adapts to screen size

## Troubleshooting

**Widget not showing:**
- Check if widget is enabled in layout configuration
- Verify user has required role permissions
- Check browser console for errors

**Layout not saving:**
- Ensure `home_layout_configs` table exists
- Check database permissions
- Verify Supabase connection

**Performance issues:**
- Limit number of enabled widgets
- Consider pagination for data-heavy widgets
- Use React.memo for widget components
