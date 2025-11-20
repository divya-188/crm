import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Card from '../ui/Card';
import Input from '../ui/Input';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';
import Toast from '@/lib/toast-system';
import { Users, Plus, Trash2, Edit2 } from 'lucide-react';
import teamSettingsService, { TeamSettings, CreateDepartment } from '../../services/team-settings.service';

export default function TeamSettingsComponent() {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<TeamSettings>({
    defaultSettings: {
      defaultUserRole: 'agent',
      autoAssignConversations: false,
      assignmentStrategy: 'manual',
    },
    invitationSettings: {
      allowSelfRegistration: false,
      approvedEmailDomains: [],
      requireAdminApproval: true,
    },
    departments: [],
  });

  const [newDepartment, setNewDepartment] = useState<CreateDepartment>({
    name: '',
    description: '',
  });
  const [editingDepartment, setEditingDepartment] = useState<string | null>(null);
  const [emailDomain, setEmailDomain] = useState('');

  const { data: settings, isLoading } = useQuery({
    queryKey: ['team-settings'],
    queryFn: teamSettingsService.getSettings,
  });

  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  const updateMutation = useMutation({
    mutationFn: teamSettingsService.updateSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-settings'] });
      Toast.success('Team settings updated successfully');
    },
    onError: (error: any) => {
      Toast.error(error.response?.data?.message || 'Failed to update team settings');
    },
  });

  const createDepartmentMutation = useMutation({
    mutationFn: teamSettingsService.createDepartment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-settings'] });
      Toast.success('Department created successfully');
      setNewDepartment({ name: '', description: '' });
    },
    onError: (error: any) => {
      Toast.error(error.response?.data?.message || 'Failed to create department');
    },
  });

  const deleteDepartmentMutation = useMutation({
    mutationFn: teamSettingsService.deleteDepartment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-settings'] });
      Toast.success('Department deleted successfully');
    },
    onError: (error: any) => {
      Toast.error(error.response?.data?.message || 'Failed to delete department');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const handleAddDepartment = () => {
    if (!newDepartment.name.trim()) {
      Toast.error('Department name is required');
      return;
    }
    createDepartmentMutation.mutate(newDepartment);
  };

  const handleDeleteDepartment = (id: string) => {
    if (confirm('Are you sure you want to delete this department?')) {
      deleteDepartmentMutation.mutate(id);
    }
  };

  const handleAddEmailDomain = () => {
    if (!emailDomain.trim()) return;
    
    const domains = formData.invitationSettings?.approvedEmailDomains || [];
    if (!domains.includes(emailDomain)) {
      setFormData({
        ...formData,
        invitationSettings: {
          ...formData.invitationSettings,
          approvedEmailDomains: [...domains, emailDomain],
        },
      });
      setEmailDomain('');
    }
  };

  const handleRemoveEmailDomain = (domain: string) => {
    const domains = (formData.invitationSettings?.approvedEmailDomains || []).filter(
      d => d !== domain,
    );
    setFormData({
      ...formData,
      invitationSettings: {
        ...formData.invitationSettings,
        approvedEmailDomains: domains,
      },
    });
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex justify-center">
          <Spinner size="lg" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
          <Users className="w-5 h-5 text-primary-600" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-neutral-900">Team Settings</h2>
          <p className="text-sm text-neutral-600">Manage team configuration and departments</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Default Settings */}
        <div>
          <h3 className="text-sm font-semibold text-neutral-900 mb-4">Default Settings</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Default User Role
              </label>
              <select
                value={formData.defaultSettings?.defaultUserRole || 'agent'}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    defaultSettings: {
                      ...formData.defaultSettings,
                      defaultUserRole: e.target.value as 'agent' | 'user',
                    },
                  })
                }
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="agent">Agent</option>
                <option value="user">User</option>
              </select>
              <p className="text-xs text-neutral-500 mt-1">
                Role assigned to new team members by default
              </p>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="autoAssign"
                checked={formData.defaultSettings?.autoAssignConversations || false}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    defaultSettings: {
                      ...formData.defaultSettings,
                      autoAssignConversations: e.target.checked,
                    },
                  })
                }
                className="w-4 h-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
              />
              <label htmlFor="autoAssign" className="text-sm text-neutral-700">
                Auto-assign Conversations
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Assignment Strategy
              </label>
              <select
                value={formData.defaultSettings?.assignmentStrategy || 'manual'}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    defaultSettings: {
                      ...formData.defaultSettings,
                      assignmentStrategy: e.target.value as any,
                    },
                  })
                }
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                disabled={!formData.defaultSettings?.autoAssignConversations}
              >
                <option value="manual">Manual</option>
                <option value="round_robin">Round Robin</option>
                <option value="load_balanced">Load Balanced</option>
              </select>
              <p className="text-xs text-neutral-500 mt-1">
                How conversations are distributed among team members
              </p>
            </div>
          </div>
        </div>

        {/* Invitation Settings */}
        <div className="pt-6 border-t border-neutral-200">
          <h3 className="text-sm font-semibold text-neutral-900 mb-4">Invitation Settings</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="selfReg"
                checked={formData.invitationSettings?.allowSelfRegistration || false}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    invitationSettings: {
                      ...formData.invitationSettings,
                      allowSelfRegistration: e.target.checked,
                    },
                  })
                }
                className="w-4 h-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
              />
              <label htmlFor="selfReg" className="text-sm text-neutral-700">
                Allow Self-Registration
              </label>
            </div>

            {formData.invitationSettings?.allowSelfRegistration && (
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Approved Email Domains
                </label>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={emailDomain}
                    onChange={(e) => setEmailDomain(e.target.value)}
                    placeholder="example.com"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddEmailDomain();
                      }
                    }}
                  />
                  <Button type="button" onClick={handleAddEmailDomain} size="sm">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(formData.invitationSettings?.approvedEmailDomains || []).map((domain) => (
                    <span
                      key={domain}
                      className="inline-flex items-center gap-2 px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm"
                    >
                      {domain}
                      <button
                        type="button"
                        onClick={() => handleRemoveEmailDomain(domain)}
                        className="hover:text-primary-900"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="adminApproval"
                checked={formData.invitationSettings?.requireAdminApproval || false}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    invitationSettings: {
                      ...formData.invitationSettings,
                      requireAdminApproval: e.target.checked,
                    },
                  })
                }
                className="w-4 h-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
              />
              <label htmlFor="adminApproval" className="text-sm text-neutral-700">
                Require Admin Approval
              </label>
            </div>
          </div>
        </div>

        {/* Departments */}
        <div className="pt-6 border-t border-neutral-200">
          <h3 className="text-sm font-semibold text-neutral-900 mb-4">Departments</h3>
          
          {/* Add Department Form */}
          <div className="mb-4 p-4 bg-neutral-50 rounded-lg">
            <div className="grid grid-cols-2 gap-3 mb-3">
              <Input
                value={newDepartment.name}
                onChange={(e) => setNewDepartment({ ...newDepartment, name: e.target.value })}
                placeholder="Department name"
              />
              <Input
                value={newDepartment.description || ''}
                onChange={(e) =>
                  setNewDepartment({ ...newDepartment, description: e.target.value })
                }
                placeholder="Description (optional)"
              />
            </div>
            <Button
              type="button"
              onClick={handleAddDepartment}
              size="sm"
              disabled={createDepartmentMutation.isPending}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Department
            </Button>
          </div>

          {/* Departments List */}
          <div className="space-y-2">
            {(formData.departments || []).map((dept) => (
              <div
                key={dept.id}
                className="flex items-center justify-between p-3 border border-neutral-200 rounded-lg"
              >
                <div>
                  <p className="font-medium text-neutral-900">{dept.name}</p>
                  {dept.description && (
                    <p className="text-sm text-neutral-600">{dept.description}</p>
                  )}
                  <p className="text-xs text-neutral-500 mt-1">
                    {dept.memberIds?.length || 0} members
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingDepartment(dept.id)}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteDepartment(dept.id)}
                    disabled={deleteDepartmentMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
            {(!formData.departments || formData.departments.length === 0) && (
              <p className="text-sm text-neutral-500 text-center py-4">
                No departments yet. Add one above to get started.
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              if (settings) {
                setFormData(settings);
              }
            }}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={updateMutation.isPending}>
            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Card>
  );
}
