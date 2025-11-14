import { QueryClient, DefaultOptions } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { getErrorMessage } from './api-client';

const queryConfig: DefaultOptions = {
  queries: {
    refetchOnWindowFocus: false,
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  },
  mutations: {
    onError: (error) => {
      const message = getErrorMessage(error);
      toast.error(message);
    },
  },
};

export const queryClient = new QueryClient({
  defaultOptions: queryConfig,
});
