import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { contactsService } from '@/services';
import { CreateContactDto, UpdateContactDto } from '@/types/models.types';
import { QueryOptions } from '@/types/api.types';
import Toast from '@/lib/toast-system';

/**
 * Query keys for contacts
 */
export const contactsKeys = {
  all: ['contacts'] as const,
  lists: () => [...contactsKeys.all, 'list'] as const,
  list: (filters?: QueryOptions) => [...contactsKeys.lists(), filters] as const,
  details: () => [...contactsKeys.all, 'detail'] as const,
  detail: (id: string) => [...contactsKeys.details(), id] as const,
};

/**
 * Hook to fetch contacts list
 */
export const useContacts = (options?: QueryOptions) => {
  return useQuery({
    queryKey: contactsKeys.list(options),
    queryFn: () => contactsService.getContacts(options),
  });
};

/**
 * Hook to fetch a single contact
 */
export const useContact = (id: string) => {
  return useQuery({
    queryKey: contactsKeys.detail(id),
    queryFn: () => contactsService.getContact(id),
    enabled: !!id,
  });
};

/**
 * Hook to create a contact
 */
export const useCreateContact = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateContactDto) => contactsService.createContact(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contactsKeys.lists() });
      Toast.success('Contact created successfully');
    },
  });
};

/**
 * Hook to update a contact
 */
export const useUpdateContact = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateContactDto }) =>
      contactsService.updateContact(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: contactsKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: contactsKeys.lists() });
      Toast.success('Contact updated successfully');
    },
  });
};

/**
 * Hook to delete a contact
 */
export const useDeleteContact = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => contactsService.deleteContact(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contactsKeys.lists() });
      Toast.success('Contact deleted successfully');
    },
  });
};

/**
 * Hook to add tags to a contact
 */
export const useAddContactTags = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, tags }: { id: string; tags: string[] }) =>
      contactsService.addTags(id, tags),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: contactsKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: contactsKeys.lists() });
      Toast.success('Tags added successfully');
    },
  });
};

/**
 * Hook to import contacts
 */
export const useImportContacts = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => contactsService.importContacts(file),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: contactsKeys.lists() });
      Toast.success(`Imported ${result.imported} contacts. ${result.failed} failed.`);
    },
  });
};
