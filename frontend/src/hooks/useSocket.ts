import { useEffect, useState, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import { socketService } from '@/lib/socket';
import { useAuthStore } from '@/lib/auth.store';

interface UseSocketReturn {
  socket: Socket | null;
  isConnected: boolean;
  emit: (event: string, data?: any) => void;
  on: (event: string, callback: (...args: any[]) => void) => void;
  off: (event: string, callback?: (...args: any[]) => void) => void;
  joinRoom: (room: string) => void;
  leaveRoom: (room: string) => void;
}

/**
 * Custom hook for managing WebSocket connections
 */
export const useSocket = (): UseSocketReturn => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      // Disconnect if user is not authenticated
      socketService.disconnect();
      setSocket(null);
      setIsConnected(false);
      return;
    }

    // Connect to socket
    const socketInstance = socketService.connect();
    setSocket(socketInstance);

    // Listen to connection status changes
    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);

    socketInstance.on('connect', handleConnect);
    socketInstance.on('disconnect', handleDisconnect);

    // Set initial connection status
    setIsConnected(socketInstance.connected);

    // Cleanup on unmount
    return () => {
      socketInstance.off('connect', handleConnect);
      socketInstance.off('disconnect', handleDisconnect);
    };
  }, [isAuthenticated]);

  const emit = useCallback(
    (event: string, data?: any) => {
      socketService.emit(event, data);
    },
    []
  );

  const on = useCallback(
    (event: string, callback: (...args: any[]) => void) => {
      socketService.on(event, callback);
    },
    []
  );

  const off = useCallback(
    (event: string, callback?: (...args: any[]) => void) => {
      socketService.off(event, callback);
    },
    []
  );

  const joinRoom = useCallback((room: string) => {
    socketService.joinRoom(room);
  }, []);

  const leaveRoom = useCallback((room: string) => {
    socketService.leaveRoom(room);
  }, []);

  return {
    socket,
    isConnected,
    emit,
    on,
    off,
    joinRoom,
    leaveRoom,
  };
};
