"use client";

import { useState, useCallback } from "react";
import { ApiResponse, ApiCallOptions } from "./types";

interface ApiCallState {
  loading: boolean;
  error: string | null;
}

interface ApiCallHookResult {
  loading: boolean;
  error: string | null;
  callApi: <T>(
    apiFunction: () => Promise<T>,
    options?: ApiCallOptions
  ) => Promise<T | null>;
  clearError: () => void;
}

export function useApiCall(): ApiCallHookResult {
  const [state, setState] = useState<ApiCallState>({
    loading: false,
    error: null,
  });

  const callApi = useCallback(async <T,>(
    apiFunction: () => Promise<T>,
    options: ApiCallOptions = {}
  ): Promise<T | null> => {
    setState({ loading: true, error: null });
    
    try {
      const result = await apiFunction();
      setState({ loading: false, error: null });
      
      if (options.showSuccessMessage) {
        // TODO: Implement success toast notification
        console.log('API call successful');
      }
      
      if (options.onSuccess) {
        options.onSuccess();
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      setState({ loading: false, error: errorMessage });
      
      if (options.showErrorMessage) {
        // TODO: Implement error toast notification
        console.error('API call failed:', errorMessage);
      }
      
      if (options.onError) {
        options.onError(errorMessage);
      }
      
      return null;
    }
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    loading: state.loading,
    error: state.error,
    callApi,
    clearError,
  };
}

export default useApiCall;
