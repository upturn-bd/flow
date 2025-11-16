"use client";

import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/auth-context';
import { HomeLayoutConfig, WidgetConfig, DEFAULT_WIDGET_CONFIGS } from '@/lib/types/widgets';

const LAYOUT_VERSION = '1.0';

export function useHomeLayout() {
  const { employeeInfo } = useAuth();
  const [layout, setLayout] = useState<HomeLayoutConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Fetch user's home layout configuration
  const fetchLayout = useCallback(async () => {
    if (!employeeInfo) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('home_layout_configs')
        .select('*')
        .eq('employee_id', employeeInfo.id)
        .eq('company_id', typeof employeeInfo.company_id === 'string' ? parseInt(employeeInfo.company_id) : employeeInfo.company_id)
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (data) {
        setLayout(data);
      } else {
        // No layout found, create default
        const defaultLayout: HomeLayoutConfig = {
          employee_id: employeeInfo.id,
          company_id: typeof employeeInfo.company_id === 'string' ? parseInt(employeeInfo.company_id) : (employeeInfo.company_id || 0),
          widgets: DEFAULT_WIDGET_CONFIGS,
          layout_version: LAYOUT_VERSION,
        };
        setLayout(defaultLayout);
      }
    } catch (error) {
      console.error('Error fetching home layout:', error);
      
      // Fallback to default layout
      const defaultLayout: HomeLayoutConfig = {
        employee_id: employeeInfo.id!,
        company_id: typeof employeeInfo.company_id === 'string' ? parseInt(employeeInfo.company_id) : (employeeInfo.company_id || 0),
        widgets: DEFAULT_WIDGET_CONFIGS,
        layout_version: LAYOUT_VERSION,
      };
      setLayout(defaultLayout);
    } finally {
      setLoading(false);
    }
  }, [employeeInfo]);

  // Save layout configuration
  const saveLayout = useCallback(async (widgets: WidgetConfig[]) => {
    if (!employeeInfo || !layout) return;

    try {
      setSaving(true);
      const companyId = typeof employeeInfo.company_id === 'string' ? parseInt(employeeInfo.company_id) : (employeeInfo.company_id || 0);
      
      const updatedLayout: HomeLayoutConfig = {
        ...layout,
        widgets,
        layout_version: LAYOUT_VERSION,
      };

      const { data, error } = await supabase
        .from('home_layout_configs')
        .upsert({
          employee_id: employeeInfo.id,
          company_id: companyId,
          widgets,
          layout_version: LAYOUT_VERSION,
        }, {
          onConflict: 'employee_id,company_id'
        })
        .select()
        .single();

      if (error) throw error;

      setLayout(data);
      console.log('Home page layout saved successfully');
    } catch (error) {
      console.error('Error saving home layout:', error);
      throw error; // Re-throw to handle in UI
    } finally {
      setSaving(false);
    }
  }, [employeeInfo, layout]);

  // Update a specific widget configuration
  const updateWidget = useCallback((widgetId: string, updates: Partial<WidgetConfig>) => {
    if (!layout) return;

    const updatedWidgets = layout.widgets.map(widget =>
      widget.id === widgetId ? { ...widget, ...updates } : widget
    );

    setLayout({ ...layout, widgets: updatedWidgets });
    return updatedWidgets;
  }, [layout]);

  // Update all widgets at once (for reordering)
  const updateAllWidgets = useCallback((widgets: WidgetConfig[]) => {
    if (!layout) return;
    setLayout({ ...layout, widgets });
  }, [layout]);

  // Add a new widget
  const addWidget = useCallback((widget: WidgetConfig) => {
    if (!layout) return;

    const updatedWidgets = [...layout.widgets, widget];
    setLayout({ ...layout, widgets: updatedWidgets });
    return updatedWidgets;
  }, [layout]);

  // Remove a widget
  const removeWidget = useCallback((widgetId: string) => {
    if (!layout) return;

    const updatedWidgets = layout.widgets.filter(w => w.id !== widgetId);
    setLayout({ ...layout, widgets: updatedWidgets });
    return updatedWidgets;
  }, [layout]);

  // Reset to default layout
  const resetToDefault = useCallback(async () => {
    if (!employeeInfo) return;

    const companyId = typeof employeeInfo.company_id === 'string' ? parseInt(employeeInfo.company_id) : (employeeInfo.company_id || 0);
    
    const defaultLayout: HomeLayoutConfig = {
      employee_id: employeeInfo.id,
      company_id: companyId,
      widgets: DEFAULT_WIDGET_CONFIGS,
      layout_version: LAYOUT_VERSION,
    };

    setLayout(defaultLayout);
    await saveLayout(DEFAULT_WIDGET_CONFIGS);
  }, [employeeInfo, saveLayout]);

  // Fetch layout on mount
  useEffect(() => {
    fetchLayout();
  }, [fetchLayout]);

  return {
    layout,
    loading,
    saving,
    saveLayout,
    updateWidget,
    updateAllWidgets,
    addWidget,
    removeWidget,
    resetToDefault,
    refetch: fetchLayout,
  };
}
