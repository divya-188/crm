import { QueryClient, DefaultOptions } from '@tanstack/react-query';
import Toast from '@/lib/toast-system';
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
      Toast.error(message);
    },
  },
};

export const queryClient = new QueryClient({
  defaultOptions: queryConfig,
});
