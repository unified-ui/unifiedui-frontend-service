import type { FC } from 'react';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Stack,
  Tabs,
  TextInput,
  Textarea,
  Button,
  Group,
  Paper,
  Text,
  Title,
  Badge,
  Alert,
  Loader,
  Center,
  Table,
  ActionIcon,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import {
  IconSettings,
  IconUsers,
  IconUsersGroup,
  IconCreditCard,
  IconTrash,
  IconInfoCircle,
  IconEdit,
} from '@tabler/icons-react';
import { MainLayout } from '../../components/layout/MainLayout';
import { PageContainer, ConfirmDeleteDialog, EditRolesDialog } from '../../components/common';
import { ManageTenantAccessTable, TENANT_ROLE_OPTIONS } from '../../components/common/ManageTenantAccessTable';
import type { TenantPrincipalPermission } from '../../components/common/ManageTenantAccessTable';
import { AddPrincipalDialog } from '../../components/common/AddPrincipalDialog';
import type { SelectedPrincipal, RoleOption } from '../../components/common/AddPrincipalDialog';
import {
  CreateCustomGroupDialog,
  EditCustomGroupDialog,
} from '../../components/dialogs';
import { useIdentity } from '../../contexts';
import type {
  TenantPermissionEnum,
  PrincipalTypeEnum,
  CustomGroupResponse,
} from '../../api/types';
import classes from './TenantSettingsPage.module.css';

type TabValue = 'settings' | 'iam' | 'custom-groups' | 'billing-and-licence';

const TAB_VALUES: TabValue[] = ['settings', 'iam', 'custom-groups', 'billing-and-licence'];
const DEFAULT_TAB: TabValue = 'settings';

const isValidTab = (value: string | null): value is TabValue => {
  return value !== null && TAB_VALUES.includes(value as TabValue);
};

interface TenantSettingsFormValues {
  name: string;
  description: string;
}

export const TenantSettingsPage: FC = () => {
  const { apiClient, selectedTenant, refreshIdentity } = useIdentity();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Read initial tab from URL, default to 'settings'
  const tabFromUrl = searchParams.get('tab');
  const initialTab = isValidTab(tabFromUrl) ? tabFromUrl : DEFAULT_TAB;
  const [activeTab, setActiveTab] = useState<TabValue>(initialTab);

  // Update URL when tab changes
  const handleTabChange = useCallback((value: string | null) => {
    if (value && isValidTab(value)) {
      setActiveTab(value);
      setSearchParams({ tab: value }, { replace: true });
    }
  }, [setSearchParams]);

  // ===== Tenant Settings State =====
  const [isSavingTenant, setIsSavingTenant] = useState(false);
  const [deleteDialogStep, setDeleteDialogStep] = useState<0 | 1 | 2>(0); // 0=closed, 1=first confirm, 2=second confirm
  const [isDeletingTenant, setIsDeletingTenant] = useState(false);

  const tenantForm = useForm<TenantSettingsFormValues>({
    initialValues: {
      name: '',
      description: '',
    },
    validate: {
      name: (value) => {
        if (!value.trim()) return 'Name is required';
        if (value.length > 255) return 'Name must be less than 255 characters';
        return null;
      },
      description: (value) => {
        if (value && value.length > 2000) return 'Description must be less than 2000 characters';
        return null;
      },
    },
  });

  // ===== Access Management State =====
  const [principals, setPrincipals] = useState<TenantPrincipalPermission[]>([]);
  const [principalsLoading, setPrincipalsLoading] = useState(false);
  const [principalsError, setPrincipalsError] = useState<string | null>(null);
  const [principalsFetched, setPrincipalsFetched] = useState(false);
  const [addPrincipalDialogOpen, setAddPrincipalDialogOpen] = useState(false);
  const [editPrincipal, setEditPrincipal] = useState<TenantPrincipalPermission | null>(null);

  // ===== Custom Groups State =====
  const [customGroups, setCustomGroups] = useState<CustomGroupResponse[]>([]);
  const [customGroupsLoading, setCustomGroupsLoading] = useState(false);
  const [customGroupsError, setCustomGroupsError] = useState<string | null>(null);
  const [customGroupsFetched, setCustomGroupsFetched] = useState(false);
  const [createGroupDialogOpen, setCreateGroupDialogOpen] = useState(false);
  const [editGroupId, setEditGroupId] = useState<string | null>(null);
  const [deleteGroupDialog, setDeleteGroupDialog] = useState<{
    open: boolean;
    id: string;
    name: string;
  }>({ open: false, id: '', name: '' });
  const [isDeletingGroup, setIsDeletingGroup] = useState(false);

  // ===== Load Tenant Details =====
  useEffect(() => {
    if (selectedTenant) {
      tenantForm.setValues({
        name: selectedTenant.name,
        description: selectedTenant.description || '',
      });
      tenantForm.resetDirty();
    }
  }, [selectedTenant]); // eslint-disable-line react-hooks/exhaustive-deps

  // ===== Fetch Principals =====
  const fetchPrincipals = useCallback(async () => {
    if (!apiClient || !selectedTenant) return;

    setPrincipalsLoading(true);
    setPrincipalsError(null);
    try {
      const response = await apiClient.getTenantPrincipals(selectedTenant.id);
      
      // Transform response: use display_name, mail, principal_name from principal level
      const principalMap = new Map<string, TenantPrincipalPermission>();
      
      for (const principal of response.principals) {
        const key = `${principal.principal_id}-${principal.principal_type}`;
        
        if (!principalMap.has(key)) {
          principalMap.set(key, {
            id: key,
            principalId: principal.principal_id,
            principalType: principal.principal_type,
            displayName: principal.display_name || null,
            mail: principal.mail || null,
            principalName: principal.principal_name || null,
            description: principal.description || null,
            roles: principal.roles.map(r => r.role),
          });
        }
      }
      
      setPrincipals(Array.from(principalMap.values()));
      setPrincipalsFetched(true);
    } catch {
      setPrincipalsError('Failed to load principals');
    } finally {
      setPrincipalsLoading(false);
    }
  }, [apiClient, selectedTenant]);

  // ===== Fetch Custom Groups =====
  const fetchCustomGroups = useCallback(async () => {
    if (!apiClient || !selectedTenant) return;

    setCustomGroupsLoading(true);
    setCustomGroupsError(null);
    try {
      const groups = await apiClient.listCustomGroups(selectedTenant.id, { limit: 999 });
      setCustomGroups(groups);
      setCustomGroupsFetched(true);
    } catch {
      setCustomGroupsError('Failed to load custom groups');
    } finally {
      setCustomGroupsLoading(false);
    }
  }, [apiClient, selectedTenant]);

  // ===== Load data based on active tab =====
  useEffect(() => {
    if (activeTab === 'iam' && !principalsFetched) {
      fetchPrincipals();
    }
    if (activeTab === 'custom-groups' && !customGroupsFetched) {
      fetchCustomGroups();
    }
  }, [activeTab, principalsFetched, customGroupsFetched, fetchPrincipals, fetchCustomGroups]);

  // ===== Tenant Settings Handlers =====
  const handleSaveTenant = tenantForm.onSubmit(async (values) => {
    if (!apiClient || !selectedTenant) return;

    setIsSavingTenant(true);
    try {
      await apiClient.updateTenant(selectedTenant.id, {
        name: values.name.trim(),
        description: values.description.trim() || undefined,
      });
      await refreshIdentity();
      tenantForm.resetDirty();
    } catch {
      // Error handled by API client
    } finally {
      setIsSavingTenant(false);
    }
  });

  const handleDeleteTenant = async () => {
    if (!apiClient || !selectedTenant) return;

    setIsDeletingTenant(true);
    try {
      await apiClient.deleteTenant(selectedTenant.id);
      await refreshIdentity();
      setDeleteDialogStep(0);
      // Navigation will happen automatically when tenant is gone
    } catch {
      // Error handled by API client
    } finally {
      setIsDeletingTenant(false);
    }
  };

  const handleFirstDeleteConfirm = () => {
    setDeleteDialogStep(2); // Move to second confirmation
  };

  // ===== Principal Handlers =====
  const handleManageAccess = useCallback((principal: TenantPrincipalPermission) => {
    setEditPrincipal(principal);
  }, []);

  const handleEditPrincipalRoles = useCallback(
    async (roles: string[]) => {
      if (!apiClient || !selectedTenant || !editPrincipal) return;

      try {
        // Get current roles and new roles
        const currentRoles = new Set(editPrincipal.roles);
        const newRoles = new Set(roles as TenantPermissionEnum[]);

        // Remove roles that are no longer selected
        for (const role of currentRoles) {
          if (!newRoles.has(role)) {
            await apiClient.deleteTenantPrincipal(selectedTenant.id, {
              principal_id: editPrincipal.principalId,
              principal_type: editPrincipal.principalType,
              role: role,
            });
          }
        }

        // Add roles that are newly selected
        for (const role of newRoles) {
          if (!currentRoles.has(role)) {
            await apiClient.setTenantPrincipal(selectedTenant.id, {
              principal_id: editPrincipal.principalId,
              principal_type: editPrincipal.principalType,
              role: role,
            });
          }
        }

        setEditPrincipal(null);
        await fetchPrincipals();
      } catch {
        // Error handled by API client
      }
    },
    [apiClient, selectedTenant, editPrincipal, fetchPrincipals]
  );

  const handleDeletePrincipal = useCallback(
    async (principalId: string, principalType: PrincipalTypeEnum) => {
      if (!apiClient || !selectedTenant) return;

      // Delete all roles for this principal
      const principal = principals.find(p => p.principalId === principalId);
      if (!principal) return;

      try {
        for (const role of principal.roles) {
          await apiClient.deleteTenantPrincipal(selectedTenant.id, {
            principal_id: principalId,
            principal_type: principalType,
            role: role,
          });
        }
        await fetchPrincipals();
      } catch {
        // Error handled by API client
      }
    },
    [apiClient, selectedTenant, principals, fetchPrincipals]
  );

  const handleAddPrincipals = useCallback(
    async (selectedPrincipals: SelectedPrincipal[], roles: string[]) => {
      if (!apiClient || !selectedTenant) return;

      try {
        for (const principal of selectedPrincipals) {
          // Add each selected role for each principal
          for (const role of roles) {
            await apiClient.setTenantPrincipal(selectedTenant.id, {
              principal_id: principal.id,
              principal_type: principal.type,
              role: role as TenantPermissionEnum,
            });
          }
        }
        setAddPrincipalDialogOpen(false);
        await fetchPrincipals();
      } catch {
        // Error handled by API client
      }
    },
    [apiClient, selectedTenant, fetchPrincipals]
  );

  // ===== Custom Group Handlers =====
  const handleDeleteGroup = async () => {
    if (!apiClient || !selectedTenant || !deleteGroupDialog.id) return;

    setIsDeletingGroup(true);
    try {
      await apiClient.deleteCustomGroup(selectedTenant.id, deleteGroupDialog.id);
      setDeleteGroupDialog({ open: false, id: '', name: '' });
      await fetchCustomGroups();
    } catch {
      // Error handled by API client
    } finally {
      setIsDeletingGroup(false);
    }
  };

  // Get existing principal IDs for AddPrincipalDialog
  const existingPrincipalIds = useMemo(
    () => principals.map((p) => p.principalId),
    [principals]
  );

  // Convert TENANT_ROLE_OPTIONS to RoleOption format for AddPrincipalDialog
  const tenantRoleOptions: RoleOption[] = useMemo(
    () => TENANT_ROLE_OPTIONS.map((r) => ({
      value: r.value,
      label: r.label,
      description: r.description,
    })),
    []
  );

  if (!selectedTenant) {
    return (
      <MainLayout>
        <Center py="xl">
          <Text>No tenant selected</Text>
        </Center>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <PageContainer>
        <Stack gap="lg">
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            classNames={{
              root: classes.tabs,
              list: classes.tabsList,
              tab: classes.tab,
              panel: classes.tabPanel,
            }}
          >
            <Tabs.List>
              <Tabs.Tab value="settings" leftSection={<IconSettings size={20} />}>
                Tenant Settings
              </Tabs.Tab>
              <Tabs.Tab value="iam" leftSection={<IconUsers size={20} />}>
                Manage Access
              </Tabs.Tab>
              <Tabs.Tab value="custom-groups" leftSection={<IconUsersGroup size={20} />}>
                Custom Groups
              </Tabs.Tab>
              <Tabs.Tab value="billing-and-licence" leftSection={<IconCreditCard size={20} />}>
                Billing & Licence
              </Tabs.Tab>
            </Tabs.List>

            {/* Tenant Settings Tab */}
            <Tabs.Panel value="settings">
              <Stack gap="lg">
                <Paper p="lg" withBorder>
                  <form onSubmit={handleSaveTenant}>
                    <Stack gap="md">
                      <Title order={4}>Tenant Information</Title>
                      <TextInput
                        label="Name"
                        placeholder="Enter tenant name"
                        required
                        {...tenantForm.getInputProps('name')}
                      />
                      <Textarea
                        label="Description"
                        placeholder="Enter tenant description (optional)"
                        minRows={3}
                        {...tenantForm.getInputProps('description')}
                      />
                      <Group justify="flex-end">
                        <Button
                          type="submit"
                          loading={isSavingTenant}
                          disabled={!tenantForm.isDirty()}
                        >
                          Save Changes
                        </Button>
                      </Group>
                    </Stack>
                  </form>
                </Paper>

                <Paper p="lg" withBorder className={classes.dangerZone}>
                  <Stack gap="md">
                    <Title order={4} c="red">
                      Danger Zone
                    </Title>
                    <Text size="sm" c="dimmed">
                      Deleting a tenant will permanently remove all data including applications,
                      credentials, conversations, and custom groups. This action cannot be undone.
                    </Text>
                    <Button
                      color="red"
                      variant="outline"
                      leftSection={<IconTrash size={16} />}
                      onClick={() => setDeleteDialogStep(1)}
                    >
                      Delete Tenant
                    </Button>
                  </Stack>
                </Paper>
              </Stack>
            </Tabs.Panel>

            {/* Access Management Tab */}
            <Tabs.Panel value="iam">
              <Stack gap="md">
                <Alert icon={<IconInfoCircle size={16} />} color="blue" variant="light">
                  <Text size="sm">
                    Manage who can access this tenant and what they can do. Each principal can have
                    multiple roles that define their permissions across different resources.
                  </Text>
                </Alert>

                <ManageTenantAccessTable
                  principals={principals}
                  isLoading={principalsLoading}
                  hasFetched={principalsFetched}
                  error={principalsError}
                  onManageAccess={handleManageAccess}
                  onDeletePrincipal={handleDeletePrincipal}
                  onAddPrincipal={() => setAddPrincipalDialogOpen(true)}
                />
              </Stack>
            </Tabs.Panel>

            {/* Custom Groups Tab */}
            <Tabs.Panel value="custom-groups">
              <Stack gap="md">
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">
                    Custom groups allow you to organize users and identity groups for easier
                    permission management across your tenant resources.
                  </Text>
                  <Button onClick={() => setCreateGroupDialogOpen(true)}>
                    Create Group
                  </Button>
                </Group>

                {customGroupsLoading && !customGroupsFetched ? (
                  <Center py="xl">
                    <Loader size="lg" />
                  </Center>
                ) : customGroupsError ? (
                  <Alert color="red">{customGroupsError}</Alert>
                ) : customGroups.length === 0 ? (
                  <Center py="xl">
                    <Text c="dimmed">
                      No custom groups yet. Create one to get started.
                    </Text>
                  </Center>
                ) : (
                  <Table striped highlightOnHover>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>Name</Table.Th>
                        <Table.Th>Description</Table.Th>
                        <Table.Th style={{ width: 100 }}>Actions</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {customGroups.map((group) => (
                        <Table.Tr key={group.id}>
                          <Table.Td>
                            <Text fw={500}>{group.name}</Text>
                          </Table.Td>
                          <Table.Td>
                            <Text size="sm" c="dimmed" lineClamp={1}>
                              {group.description || '-'}
                            </Text>
                          </Table.Td>
                          <Table.Td>
                            <Group gap="xs">
                              <ActionIcon
                                variant="subtle"
                                color="blue"
                                onClick={() => setEditGroupId(group.id)}
                              >
                                <IconEdit size={16} />
                              </ActionIcon>
                              <ActionIcon
                                variant="subtle"
                                color="red"
                                onClick={() =>
                                  setDeleteGroupDialog({
                                    open: true,
                                    id: group.id,
                                    name: group.name,
                                  })
                                }
                              >
                                <IconTrash size={16} />
                              </ActionIcon>
                            </Group>
                          </Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                )}
              </Stack>
            </Tabs.Panel>

            {/* Billing Tab */}
            <Tabs.Panel value="billing-and-licence">
              <Stack gap="lg">
                <Paper p="lg" withBorder>
                  <Stack gap="md">
                    <Group>
                      <Text fw={500}>Current Licence:</Text>
                      <Badge size="lg" color="blue" variant="light">
                        Standard
                      </Badge>
                    </Group>
                    <Text size="sm" c="dimmed">
                      Your current plan includes all standard features with unlimited users.
                    </Text>
                  </Stack>
                </Paper>

                <Paper p="lg" withBorder>
                  <Center py="xl">
                    <Stack align="center" gap="sm">
                      <IconCreditCard size={48} color="var(--mantine-color-gray-5)" />
                      <Title order={4} c="dimmed">
                        Billing & Upgrades
                      </Title>
                      <Text c="dimmed">Coming soon</Text>
                    </Stack>
                  </Center>
                </Paper>
              </Stack>
            </Tabs.Panel>
          </Tabs>
        </Stack>
      </PageContainer>

      {/* Delete Tenant - First Confirmation */}
      <ConfirmDeleteDialog
        opened={deleteDialogStep === 1}
        onClose={() => setDeleteDialogStep(0)}
        onConfirm={handleFirstDeleteConfirm}
        itemName={selectedTenant.name}
        itemType="Tenant"
        title="Delete Tenant (Step 1 of 2)"
        message="Are you sure you want to delete this tenant? This will permanently remove all data including applications, credentials, conversations, and custom groups."
      />

      {/* Delete Tenant - Second Confirmation */}
      <ConfirmDeleteDialog
        opened={deleteDialogStep === 2}
        onClose={() => setDeleteDialogStep(0)}
        onConfirm={handleDeleteTenant}
        itemName={selectedTenant.name}
        itemType="Tenant"
        title="Final Confirmation (Step 2 of 2)"
        message="This action is IRREVERSIBLE. All tenant data will be permanently deleted. Are you absolutely sure?"
        isLoading={isDeletingTenant}
        confirmButtonText="WIRKLICH LÖSCHEN"
        reverseButtons
      />

      {/* Add Principal Dialog */}
      <AddPrincipalDialog
        opened={addPrincipalDialogOpen}
        onClose={() => setAddPrincipalDialogOpen(false)}
        onSubmit={handleAddPrincipals}
        existingPrincipalIds={existingPrincipalIds}
        entityName="tenant"
        roleOptions={tenantRoleOptions}
        multiSelect={true}
        defaultRoles={['READER']}
      />

      {/* Edit Principal Roles Dialog */}
      <EditRolesDialog
        opened={!!editPrincipal}
        onClose={() => setEditPrincipal(null)}
        onSubmit={handleEditPrincipalRoles}
        principalName={editPrincipal?.displayName || editPrincipal?.principalId || ''}
        principalType={editPrincipal?.principalType || 'IDENTITY_USER'}
        principalEmail={editPrincipal?.mail || editPrincipal?.principalName}
        roleOptions={tenantRoleOptions}
        currentRoles={editPrincipal?.roles || []}
      />

      {/* Create Custom Group Dialog */}
      <CreateCustomGroupDialog
        opened={createGroupDialogOpen}
        onClose={() => setCreateGroupDialogOpen(false)}
        onSuccess={() => fetchCustomGroups()}
      />

      {/* Edit Custom Group Dialog */}
      <EditCustomGroupDialog
        opened={!!editGroupId}
        onClose={() => setEditGroupId(null)}
        customGroupId={editGroupId}
        onSuccess={() => fetchCustomGroups()}
      />

      {/* Delete Custom Group Confirmation */}
      <ConfirmDeleteDialog
        opened={deleteGroupDialog.open}
        onClose={() => setDeleteGroupDialog({ open: false, id: '', name: '' })}
        onConfirm={handleDeleteGroup}
        itemName={deleteGroupDialog.name}
        itemType="Custom Group"
        isLoading={isDeletingGroup}
      />
    </MainLayout>
  );
};
