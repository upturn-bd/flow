/**
 * UI component type definitions
 */

// Base component props
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
  id?: string;
  testId?: string;
}

// Layout component types
export interface PageLayoutProps extends BaseComponentProps {
  title?: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
  sidebar?: React.ReactNode;
  footer?: React.ReactNode;
  loading?: boolean;
  error?: string;
}

export interface CardLayoutProps extends BaseComponentProps {
  title?: string;
  subtitle?: string;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  variant?: 'default' | 'bordered' | 'shadow';
}

export interface GridLayoutProps extends BaseComponentProps {
  columns?: 1 | 2 | 3 | 4 | 5 | 6;
  gap?: 'sm' | 'md' | 'lg';
  responsive?: boolean;
  autoFit?: boolean;
  minColumnWidth?: string;
}

// Navigation types
export interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ReactNode;
  isActive?: boolean;
}

export interface NavItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
  badge?: string | number;
  children?: NavItem[];
  isActive?: boolean;
  isDisabled?: boolean;
}

// Modal component types
export interface BaseModalProps extends BaseComponentProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  position?: 'center' | 'top';
  closeOnOverlayClick?: boolean;
  closeOnEsc?: boolean;
  showCloseButton?: boolean;
  header?: React.ReactNode;
  footer?: React.ReactNode;
}

export interface FormModalProps extends BaseModalProps {
  onSubmit?: () => void;
  submitLabel?: string;
  cancelLabel?: string;
  isSubmitting?: boolean;
  isDirty?: boolean;
  isValid?: boolean;
}

export interface ConfirmationModalProps extends BaseModalProps {
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'danger' | 'warning' | 'success';
  onConfirm: () => void;
  onCancel?: () => void;
}

// Button component types
export interface ButtonProps extends BaseComponentProps {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning' | 'ghost' | 'link';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  isLoading?: boolean;
  isDisabled?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  type?: 'button' | 'submit' | 'reset';
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

// Typography component types
export interface HeadingProps extends BaseComponentProps {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  color?: 'default' | 'muted' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  align?: 'left' | 'center' | 'right';
  truncate?: boolean;
}

export interface TextProps extends BaseComponentProps {
  variant?: 'body' | 'caption' | 'subtitle' | 'label' | 'helper' | 'error';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  color?: 'default' | 'muted' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  align?: 'left' | 'center' | 'right' | 'justify';
  truncate?: boolean;
  italic?: boolean;
  underline?: boolean;
}

// Table component types
export interface TableColumn<T = any> {
  key: keyof T | string;
  title: string;
  width?: string | number;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  render?: (value: any, record: T, index: number) => React.ReactNode;
  className?: string;
}

export interface TableProps<T = any> extends BaseComponentProps {
  data: T[];
  columns: TableColumn<T>[];
  loading?: boolean;
  empty?: React.ReactNode;
  pagination?: PaginationProps;
  selection?: TableSelectionProps<T>;
  sorting?: TableSortingProps;
  onRowClick?: (record: T, index: number) => void;
  rowKey?: keyof T | ((record: T) => string | number);
}

export interface PaginationProps {
  current: number;
  total: number;
  pageSize: number;
  showSizeChanger?: boolean;
  showQuickJumper?: boolean;
  showTotal?: boolean;
  onChange: (page: number, pageSize: number) => void;
}

export interface TableSelectionProps<T> {
  type: 'checkbox' | 'radio';
  selectedKeys: (string | number)[];
  onChange: (selectedKeys: (string | number)[], selectedRows: T[]) => void;
  getCheckboxProps?: (record: T) => { disabled?: boolean };
}

export interface TableSortingProps {
  field: string;
  order: 'asc' | 'desc';
  onChange: (field: string, order: 'asc' | 'desc') => void;
}

// Form component types
export interface FormFieldProps extends BaseComponentProps {
  label?: string;
  name: string;
  value: any;
  onChange: (value: any) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  helpText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export interface SelectOption {
  label: string;
  value: string | number;
  disabled?: boolean;
  group?: string;
}

export interface SelectFieldProps extends FormFieldProps {
  options: SelectOption[];
  multiple?: boolean;
  searchable?: boolean;
  clearable?: boolean;
  loading?: boolean;
  onSearch?: (query: string) => void;
}

export interface FileUploadProps extends FormFieldProps {
  accept?: string;
  multiple?: boolean;
  maxSize?: number;
  maxFiles?: number;
  preview?: boolean;
  dragAndDrop?: boolean;
  onUpload?: (files: File[]) => Promise<string[]>;
}

// Status and feedback component types
export interface AlertProps extends BaseComponentProps {
  variant: 'info' | 'success' | 'warning' | 'danger';
  title?: string;
  message: string;
  closable?: boolean;
  showIcon?: boolean;
  onClose?: () => void;
}

export interface ToastProps extends BaseComponentProps {
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  duration?: number;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface LoadingSpinnerProps extends BaseComponentProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'secondary' | 'current';
  text?: string;
}

export interface ProgressBarProps extends BaseComponentProps {
  value: number;
  max?: number;
  variant?: 'default' | 'success' | 'warning' | 'danger';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  label?: string;
  animated?: boolean;
}

// Animation types
export interface AnimationConfig {
  duration?: number;
  delay?: number;
  easing?: string;
  loop?: boolean;
  direction?: 'normal' | 'reverse' | 'alternate';
}

export interface MotionProps {
  initial?: any;
  animate?: any;
  exit?: any;
  transition?: AnimationConfig;
  whileHover?: any;
  whileTap?: any;
  whileFocus?: any;
}

// Theme types
export interface ThemeColors {
  primary: string;
  secondary: string;
  success: string;
  warning: string;
  danger: string;
  info: string;
  gray: Record<number, string>;
}

export interface ThemeSpacing {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
  '3xl': string;
  '4xl': string;
}

export interface ThemeBreakpoints {
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
}

export interface Theme {
  colors: ThemeColors;
  spacing: ThemeSpacing;
  breakpoints: ThemeBreakpoints;
  borderRadius: Record<string, string>;
  shadows: Record<string, string>;
  zIndex: Record<string, number>;
}

// Responsive types
export type ResponsiveValue<T> = T | {
  base?: T;
  sm?: T;
  md?: T;
  lg?: T;
  xl?: T;
  '2xl'?: T;
};

// Component state types
export interface ComponentState {
  loading: boolean;
  error: string | null;
  data: any;
}

export interface AsyncComponentState<T> extends ComponentState {
  data: T | null;
}

// Event handler types
export type ClickHandler = (event: React.MouseEvent<HTMLElement>) => void;
export type ChangeHandler<T = any> = (value: T) => void;
export type SubmitHandler<T = any> = (data: T) => void | Promise<void>;
export type ErrorHandler = (error: Error) => void;
