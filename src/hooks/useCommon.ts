import { useState, useCallback } from 'react';
import { useToast } from '@chakra-ui/react';

// Generic form handling
export const useForm = <T extends object>(initialValues: T) => {
  const [values, setValues] = useState<T>(initialValues);

  const handleChange = useCallback((field: keyof T, value: any) => {
    setValues(prev => ({ ...prev, [field]: value }));
  }, []);

  const reset = useCallback(() => {
    setValues(initialValues);
  }, [initialValues]);

  return { values, handleChange, reset, setValues };
};

// Error handling with toast
export const useErrorHandler = () => {
  const toast = useToast();

  const handleError = useCallback((error: any, title = 'Error') => {
    toast({
      title,
      description: error instanceof Error ? error.message : 'An error occurred',
      status: 'error',
      duration: 5000,
      isClosable: true,
    });
  }, [toast]);

  return handleError;
};

// Success toast
export const useSuccessToast = () => {
  const toast = useToast();

  const showSuccess = useCallback((title: string) => {
    toast({
      title,
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
  }, [toast]);

  return showSuccess;
};

// Loading state
export const useLoading = (initialState = false) => {
  const [loading, setLoading] = useState(initialState);

  const withLoading = useCallback(async <T>(fn: () => Promise<T>): Promise<T> => {
    setLoading(true);
    try {
      return await fn();
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, setLoading, withLoading };
}; 