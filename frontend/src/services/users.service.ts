import apiClient from '@/lib/api-client';
import { User } from '@/types/models.types';

export interface CreateUserDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'agent' | 'user';
  phone?: string;
}

export interface UpdateUserDto {
  firstName?: string;
  lastName?: string;
  role?: 'admin' | 'agent' | 'user';
  status?: 'active' | 'inactive' | 'suspended';
  phone?: string;
  avatar?: string;
}

export interface UserQuery {
  page?: number;
  limit?: number;
  role?: string;
  status?: string;
  search?: string;
}

export interface UserResponse {
  data: User[];
  total: number;
  page: number;
  limit: number;
}

class UsersService {
  /**
   * Get all users with pagination
   */
  async getUsers(query?: UserQuery): Promise<UserResponse> {
    const params = new URLSearchParams();
    if (query?.page) params.append('page', query.page.toString());
    if (query?.limit) params.append('limit', query.limit.toString());
    if (query?.role) params.append('role', query.role);
    if (query?.status) params.append('status', query.status);
    if (query?.search) params.append('search', query.search);

    const response = await apiClient.get<UserResponse>(`/users?${params.toString()}`);
    return response.data;
  }

  /**
   * Get user by ID
   */
  async getUser(id: string): Promise<User> {
    const response = await apiClient.get<User>(`/users/${id}`);
    return response.data;
  }

  /**
   * Create a new user
   */
  async createUser(data: CreateUserDto): Promise<User> {
    const response = await apiClient.post<User>('/users', data);
    return response.data;
  }

  /**
   * Update user
   */
  async updateUser(id: string, data: UpdateUserDto): Promise<User> {
    const response = await apiClient.patch<User>(`/users/${id}`, data);
    return response.data;
  }

  /**
   * Delete user
   */
  async deleteUser(id: string): Promise<void> {
    await apiClient.delete(`/users/${id}`);
  }
}

export const usersService = new UsersService();
