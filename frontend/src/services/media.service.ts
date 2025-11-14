import apiClient from '@/lib/api-client';

class MediaService {
  /**
   * Upload a media file
   */
  async uploadFile(file: File): Promise<{ url: string; id: string }> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post<{ url: string; id: string }>(
      '/media/upload',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return response.data;
  }

  /**
   * Delete a media file
   */
  async deleteFile(id: string): Promise<void> {
    await apiClient.delete(`/media/${id}`);
  }

  /**
   * Get media file URL
   */
  getMediaUrl(id: string): string {
    return `${apiClient.defaults.baseURL}/media/${id}`;
  }
}

export const mediaService = new MediaService();
