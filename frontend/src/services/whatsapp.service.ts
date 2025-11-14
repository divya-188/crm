import apiClient from '../lib/api-client';

export interface WhatsAppConnection {
  id: string;
  tenantId: string;
  name: string;
  type: 'meta_api' | 'baileys';
  status: 'connected' | 'disconnected' | 'connecting' | 'failed';
  phoneNumber?: string;
  phoneNumberId?: string;
  businessAccountId?: string;
  qrCode?: string;
  lastConnectedAt?: string;
  lastDisconnectedAt?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateConnectionDto {
  name: string;
  type: 'meta_api' | 'baileys';
  phoneNumberId?: string;
  businessAccountId?: string;
  accessToken?: string;
}

export interface ConnectionHealth {
  status: string;
  lastConnected: Date;
}

export const whatsappService = {
  // Get all connections
  getConnections: async (): Promise<WhatsAppConnection[]> => {
    const response = await apiClient.get('/whatsapp/connections');
    return response.data;
  },

  // Get single connection
  getConnection: async (id: string): Promise<WhatsAppConnection> => {
    const response = await apiClient.get(`/whatsapp/connections/${id}`);
    return response.data;
  },

  // Create connection
  createConnection: async (data: CreateConnectionDto): Promise<WhatsAppConnection> => {
    const response = await apiClient.post('/whatsapp/connections', data);
    return response.data;
  },

  // Update connection
  updateConnection: async (
    id: string,
    data: Partial<CreateConnectionDto>
  ): Promise<WhatsAppConnection> => {
    const response = await apiClient.patch(`/whatsapp/connections/${id}`, data);
    return response.data;
  },

  // Delete connection
  deleteConnection: async (id: string): Promise<void> => {
    await apiClient.delete(`/whatsapp/connections/${id}`);
  },

  // Disconnect connection
  disconnectConnection: async (id: string): Promise<WhatsAppConnection> => {
    const response = await apiClient.post(`/whatsapp/connections/${id}/disconnect`);
    return response.data;
  },

  // Reconnect connection
  reconnectConnection: async (id: string): Promise<WhatsAppConnection> => {
    const response = await apiClient.post(`/whatsapp/connections/${id}/reconnect`);
    return response.data;
  },

  // Get QR code
  getQRCode: async (id: string): Promise<string> => {
    const response = await apiClient.get(`/whatsapp/connections/${id}/qr`);
    return response.data;
  },

  // Check health
  checkHealth: async (id: string): Promise<ConnectionHealth> => {
    const response = await apiClient.get(`/whatsapp/connections/${id}/health`);
    return response.data;
  },

  // Send message
  sendMessage: async (
    connectionId: string,
    to: string,
    message: string
  ): Promise<any> => {
    const response = await apiClient.post(`/whatsapp/connections/${connectionId}/send`, {
      to,
      message,
    });
    return response.data;
  },
};
