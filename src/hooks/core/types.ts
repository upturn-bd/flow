export interface BaseEntity {
  id?: number | string;
  created_at?: string;
  updated_at?: string;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CrudHookResult<T> {
  // Data
  items: T[];
  item: T | null;
  
  // Loading states
  loading: boolean;
  creating: boolean;
  updating: boolean;
  deleting: boolean;
  
  // Error states
  error: string | null;
  
  // Actions
  fetchItems: () => Promise<void>;
  fetchItem: (id: string | number) => Promise<void>;
  createItem: (data: Partial<T>) => Promise<ApiResponse<T>>;
  updateItem: (id: string | number, data: Partial<T>) => Promise<ApiResponse<T>>;
  deleteItem: (id: string | number) => Promise<ApiResponse<boolean>>;
  clearError: () => void;
  clearItem: () => void;
}

export interface ModalState {
  isOpen: boolean;
  mode: 'create' | 'update' | 'view';
  selectedItem: any | null;
}

export interface ModalHookResult {
  modalState: ModalState;
  openCreateModal: () => void;
  openUpdateModal: (item: any) => void;
  openViewModal: (item: any) => void;
  closeModal: () => void;
}

export interface FormValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface ApiCallOptions {
  showSuccessMessage?: boolean;
  showErrorMessage?: boolean;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}
