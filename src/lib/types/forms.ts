/**
 * Form-related type definitions
 */

// Form field base types
export interface BaseFormField {
  name: string;
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  readonly?: boolean;
  helpText?: string;
  className?: string;
}

export interface FormFieldError {
  field: string;
  message: string;
  code?: string;
}

export interface FormFieldValidation {
  required?: boolean | string;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp | string;
  email?: boolean;
  url?: boolean;
  number?: boolean;
  integer?: boolean;
  positive?: boolean;
  custom?: (value: any) => boolean | string;
}

// Form state management
export interface FormState<T = Record<string, any>> {
  values: T;
  errors: Record<keyof T, string>;
  touched: Record<keyof T, boolean>;
  dirty: Record<keyof T, boolean>;
  isSubmitting: boolean;
  isValidating: boolean;
  isValid: boolean;
  submitCount: number;
}

export interface FormConfig<T = Record<string, any>> {
  initialValues: T;
  validationSchema?: Record<keyof T, FormFieldValidation>;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  resetOnSubmit?: boolean;
  onSubmit: (values: T) => void | Promise<void>;
  onError?: (errors: FormFieldError[]) => void;
}

// Form field types
export interface TextFieldProps extends BaseFormField {
  type?: 'text' | 'email' | 'url' | 'tel' | 'search';
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  autoComplete?: string;
  maxLength?: number;
}

export interface NumberFieldProps extends BaseFormField {
  value: number | '';
  onChange: (value: number | '') => void;
  onBlur?: () => void;
  error?: string;
  min?: number;
  max?: number;
  step?: number;
  precision?: number;
  showControls?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export interface TextAreaFieldProps extends BaseFormField {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  rows?: number;
  maxLength?: number;
  resize?: 'none' | 'vertical' | 'horizontal' | 'both';
}

export interface SelectFieldProps extends BaseFormField {
  value: string | number | string[] | number[];
  onChange: (value: string | number | string[] | number[]) => void;
  onBlur?: () => void;
  error?: string;
  options: SelectOption[];
  multiple?: boolean;
  searchable?: boolean;
  clearable?: boolean;
  loading?: boolean;
  loadingText?: string;
  noOptionsText?: string;
  onSearch?: (query: string) => void;
  onLoadMore?: () => void;
}

export interface SelectOption {
  label: string;
  value: string | number;
  disabled?: boolean;
  description?: string;
  icon?: React.ReactNode;
  group?: string;
}

export interface CheckboxFieldProps extends BaseFormField {
  checked: boolean;
  onChange: (checked: boolean) => void;
  onBlur?: () => void;
  error?: string;
  indeterminate?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export interface RadioFieldProps extends BaseFormField {
  value: string | number;
  checked: boolean;
  onChange: (value: string | number) => void;
  onBlur?: () => void;
  error?: string;
  size?: 'sm' | 'md' | 'lg';
}

export interface RadioGroupProps extends BaseFormField {
  value: string | number;
  onChange: (value: string | number) => void;
  onBlur?: () => void;
  error?: string;
  options: RadioOption[];
  direction?: 'horizontal' | 'vertical';
  size?: 'sm' | 'md' | 'lg';
}

export interface RadioOption {
  label: string;
  value: string | number;
  disabled?: boolean;
  description?: string;
}

export interface ToggleFieldProps extends BaseFormField {
  checked: boolean;
  onChange: (checked: boolean) => void;
  onBlur?: () => void;
  error?: string;
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
}

export interface DateFieldProps extends BaseFormField {
  value: string | Date | null;
  onChange: (value: string | Date | null) => void;
  onBlur?: () => void;
  error?: string;
  format?: string;
  showTime?: boolean;
  showToday?: boolean;
  disabledDates?: Date[] | ((date: Date) => boolean);
  minDate?: Date;
  maxDate?: Date;
}

export interface TimeFieldProps extends BaseFormField {
  value: string | null;
  onChange: (value: string | null) => void;
  onBlur?: () => void;
  error?: string;
  format?: '12' | '24';
  step?: number;
  showSeconds?: boolean;
}

export interface FileUploadFieldProps extends BaseFormField {
  value: File[] | string[];
  onChange: (files: File[] | string[]) => void;
  onBlur?: () => void;
  error?: string;
  accept?: string;
  multiple?: boolean;
  maxSize?: number;
  maxFiles?: number;
  preview?: boolean;
  dragAndDrop?: boolean;
  uploadText?: string;
  onUpload?: (files: File[]) => Promise<string[]>;
  onRemove?: (file: File | string, index: number) => void;
}

export interface ColorFieldProps extends BaseFormField {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  format?: 'hex' | 'rgb' | 'hsl';
  presets?: ColorPreset[];
  showPresets?: boolean;
  showInput?: boolean;
}

export interface ColorPreset {
  name: string;
  value: string;
}

export interface SearchFieldProps extends BaseFormField {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  onSearch?: (value: string) => void;
  error?: string;
  loading?: boolean;
  clearable?: boolean;
  suggestions?: SearchSuggestion[];
  onSuggestionSelect?: (suggestion: SearchSuggestion) => void;
}

export interface SearchSuggestion {
  label: string;
  value: string;
  description?: string;
  icon?: React.ReactNode;
}

export interface MultiSelectFieldProps extends BaseFormField {
  value: (string | number)[];
  onChange: (value: (string | number)[]) => void;
  onBlur?: () => void;
  error?: string;
  options: SelectOption[];
  searchable?: boolean;
  clearable?: boolean;
  loading?: boolean;
  maxSelections?: number;
  tagRender?: (option: SelectOption, onRemove: () => void) => React.ReactNode;
  onSearch?: (query: string) => void;
}

// Specialized form field types
export interface MapFieldProps extends BaseFormField {
  value: {
    latitude: number;
    longitude: number;
    address?: string;
  } | null;
  onChange: (location: { latitude: number; longitude: number; address?: string } | null) => void;
  onBlur?: () => void;
  error?: string;
  height?: string;
  zoom?: number;
  searchPlaces?: boolean;
  markerDraggable?: boolean;
}

export interface HierarchyFieldProps extends BaseFormField {
  value: number | null;
  onChange: (value: number | null) => void;
  onBlur?: () => void;
  error?: string;
  options: HierarchyOption[];
  maxDepth?: number;
  showPath?: boolean;
  expandAll?: boolean;
}

export interface HierarchyOption {
  id: number;
  label: string;
  parentId?: number;
  level: number;
  children?: HierarchyOption[];
  disabled?: boolean;
}

export interface AssigneeFieldProps extends BaseFormField {
  value: string[];
  onChange: (value: string[]) => void;
  onBlur?: () => void;
  error?: string;
  employees: AssigneeOption[];
  departments?: DepartmentOption[];
  multiple?: boolean;
  searchable?: boolean;
  filterByDepartment?: boolean;
  showAvatar?: boolean;
  onSearch?: (query: string) => void;
}

export interface AssigneeOption {
  id: string;
  name: string;
  email?: string;
  department?: string;
  position?: string;
  avatar?: string;
  disabled?: boolean;
}

export interface DepartmentOption {
  id: number;
  name: string;
  employeeCount?: number;
}

// Form layout types
export interface FormLayoutProps {
  children: React.ReactNode;
  columns?: 1 | 2 | 3 | 4;
  gap?: 'sm' | 'md' | 'lg';
  className?: string;
}

export interface FormSectionProps {
  title?: string;
  description?: string;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  children: React.ReactNode;
  className?: string;
}

export interface FormStepProps {
  title: string;
  description?: string;
  isActive: boolean;
  isCompleted: boolean;
  isDisabled?: boolean;
  children: React.ReactNode;
  onStepClick?: () => void;
}

export interface FormStepperProps {
  currentStep: number;
  steps: FormStepData[];
  onStepChange: (step: number) => void;
  showStepNumbers?: boolean;
  clickableSteps?: boolean;
  className?: string;
}

export interface FormStepData {
  title: string;
  description?: string;
  isOptional?: boolean;
  isCompleted?: boolean;
  isDisabled?: boolean;
}

// Form validation types
export interface ValidationRule {
  required?: boolean | string;
  min?: number | string;
  max?: number | string;
  minLength?: number | string;
  maxLength?: number | string;
  pattern?: RegExp | string;
  email?: boolean | string;
  url?: boolean | string;
  number?: boolean | string;
  integer?: boolean | string;
  positive?: boolean | string;
  custom?: (value: any, values: Record<string, any>) => boolean | string | Promise<boolean | string>;
}

export interface ValidationSchema {
  [field: string]: ValidationRule;
}

export interface FormValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  warnings?: Record<string, string>;
}

// Form submission types
export interface FormSubmitOptions {
  resetOnSuccess?: boolean;
  showSuccessMessage?: boolean;
  redirectOnSuccess?: string;
  confirmBeforeSubmit?: boolean;
  validateBeforeSubmit?: boolean;
}

export interface FormSubmitResult {
  success: boolean;
  data?: any;
  errors?: FormFieldError[];
  message?: string;
}

// Form hook types
export interface UseFormOptions<T> extends FormConfig<T> {
  mode?: 'onChange' | 'onBlur' | 'onSubmit';
  reValidateMode?: 'onChange' | 'onBlur';
  shouldFocusError?: boolean;
  criteriaMode?: 'firstError' | 'all';
}

export interface UseFormReturn<T> {
  values: T;
  errors: Record<keyof T, string>;
  touched: Record<keyof T, boolean>;
  dirty: Record<keyof T, boolean>;
  isSubmitting: boolean;
  isValidating: boolean;
  isValid: boolean;
  submitCount: number;
  setValue: (field: keyof T, value: any) => void;
  setError: (field: keyof T, error: string) => void;
  setTouched: (field: keyof T, touched: boolean) => void;
  clearErrors: (fields?: (keyof T)[]) => void;
  resetForm: (values?: Partial<T>) => void;
  validateField: (field: keyof T) => Promise<boolean>;
  validateForm: () => Promise<boolean>;
  handleSubmit: (onSubmit?: (values: T) => void | Promise<void>) => (e?: React.FormEvent) => Promise<void>;
  getFieldProps: (field: keyof T) => any;
}
