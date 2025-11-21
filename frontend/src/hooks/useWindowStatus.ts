import { useQuery } from '@tanstack/react-query';
import { conversationsService } from '@/services';

export interface WindowStatus {
  isOpen: boolean;
  expiresAt: Date | null;
  hoursRemaining: number | null;
}

export const useWindowStatus = (conversationId: string) => {
  return useQuery<WindowStatus>({
    queryKey: ['window-status', conversationId],
    queryFn: async () => {
      const response = await conversationsService.getWindowStatus(conversationId);
      return response;
    },
    refetchInterval: 60000, // Refetch every minute
    enabled: !!conversationId,
  });
};
