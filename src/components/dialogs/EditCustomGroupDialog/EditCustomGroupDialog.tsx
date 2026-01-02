import type { FC } from 'react';
import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Modal,
  Stack,
  SegmentedControl,
  TextInput,
  Textarea,
  Button,
  Group,
  Text,
  Alert,
  Box,
  LoadingOverlay,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import {
  IconInfoCircle,
  IconUsersGroup,
  IconUsers,
  IconShieldLock,
  IconAlertCircle,
} from '@tabler/icons-react';
import { useIdentity } from '../../../contexts';
import { ManageAccessTable } from '../../common/ManageAccessTable';
import type { PrincipalPermission } from '../../common/ManageAccessTable';
import { AddPrincipalDialog } from '../../common/AddPrincipalDialog';
import type { SelectedPrincipal } from '../../common/AddPrincipalDialog';
import type {
  CustomGroupResponse,
  PrincipalTypeEnum,
} from '../../../api/types';
import { PermissionActionEnum } from '../../../api/types';
import classes from './EditCustomGroupDialog.module.css';

interface EditCustomGroupDialogProps {
  opened: boolean;
  onClose: () => void;
  customGroupId: string | null;
  initialTab?: 'members' | 'details' | 'access';
  onSuccess?: () => void;
}

interface FormValues {
  name: string;
  description: string;
}

type TabValue = 'members' | 'details' | 'access';

export const EditCustomGroupDialog: FC<EditCustomGroupDialogProps> = ({
  opened,
  onClose,
  customGroupId,
  initialTab = 'members',
  onSuccess,
}) => {
  const { apiClient, selectedTenant } = useIdentity();
  const [activeTab, setActiveTab] = useState<TabValue>(initialTab);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customGroup, setCustomGroup] = useState<CustomGroupResponse | null>(null);

  // Principals state (for both members and access tabs - they show the same data)
  const [principals, setPrincipals] = useState<PrincipalPermission[]>([]);
  const [principalsLoading, setPrincipalsLoading] = useState(false);
  const [principalsError, setPrincipalsError] = useState<string | null>(null);
  const [principalsFetched, setPrincipalsFetched] = useState(false);

  // Add principal dialog state
  const [addPrincipalDialogOpen, setAddPrincipalDialogOpen] = useState(false);

  const form = useForm<FormValues>({
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

  // Fetch custom group details
  const fetchCustomGroup = useCallback(async () => {
    if (!apiClient || !selectedTenant || !customGroupId) return;

    setIsLoading(true);
    setError(null);
    try {
      const data = await apiClient.getCustomGroup(selectedTenant.id, customGroupId);
      setCustomGroup(data);
      form.setValues({
        name: data.name,
        description: data.description || '',
      });
      form.resetDirty();
    } catch {
      setError('Failed to load custom group');
    } finally {
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiClient, selectedTenant, customGroupId]);

  // Fetch principals for the custom group
  const fetchPrincipals = useCallback(async () => {
    if (!apiClient || !selectedTenant || !customGroupId) return;

    setPrincipalsLoading(true);
    setPrincipalsError(null);
    try {
      const response = await apiClient.getCustomGroupPrincipals(selectedTenant.id, customGroupId);
      const mapped: PrincipalPermission[] = response.principals.map((p) => ({
        id: p.principal_id,
        principalId: p.principal_id,
        principalType: p.principal_type as PrincipalTypeEnum,
        displayName: p.display_name,
        mail: p.mail,
        principalName: p.principal_name,
        description: p.description,
        roles: p.roles as PermissionActionEnum[],
      }));
      setPrincipals(mapped);
      setPrincipalsFetched(true);
    } catch {
      setPrincipalsError('Failed to load principals');
    } finally {
      setPrincipalsLoading(false);
    }
  }, [apiClient, selectedTenant, customGroupId]);

  // Load data when dialog opens
  useEffect(() => {
    if (opened && customGroupId) {
      setActiveTab(initialTab);
      fetchCustomGroup();
      setPrincipalsFetched(false);
      setPrincipals([]);
    }
  }, [opened, customGroupId, initialTab, fetchCustomGroup]);

  // Fetch principals when switching to members or access tab
  useEffect(() => {
    if ((activeTab === 'members' || activeTab === 'access') && !principalsFetched && customGroupId) {
      fetchPrincipals();
    }
  }, [activeTab, principalsFetched, customGroupId, fetchPrincipals]);

  // Handle form submit
  const handleSubmit = form.onSubmit(async (values) => {
    if (!apiClient || !selectedTenant || !customGroupId) return;

    setIsSubmitting(true);
    try {
      await apiClient.updateCustomGroup(selectedTenant.id, customGroupId, {
        name: values.name.trim(),
        description: values.description.trim() || undefined,
      });
      form.resetDirty();
      onSuccess?.();
    } catch {
      // Error is handled by the API client
    } finally {
      setIsSubmitting(false);
    }
  });

  // Handle role change
  const handleRoleChange = useCallback(
    async (principalId: string, principalType: PrincipalTypeEnum, newRole: PermissionActionEnum) => {
      if (!apiClient || !selectedTenant || !customGroupId) return;

      try {
        await apiClient.setCustomGroupPrincipal(selectedTenant.id, customGroupId, {
          principal_id: principalId,
          principal_type: principalType,
          role: newRole,
        });
        await fetchPrincipals();
      } catch {
        // Error handled by API client
      }
    },
    [apiClient, selectedTenant, customGroupId, fetchPrincipals]
  );

  // Handle delete principal
  const handleDeletePrincipal = useCallback(
    async (principalId: string, principalType: PrincipalTypeEnum) => {
      if (!apiClient || !selectedTenant || !customGroupId) return;

      try {
        // Get current role first
        const principal = principals.find(p => p.principalId === principalId);
        if (!principal) return;

        await apiClient.deleteCustomGroupPrincipal(selectedTenant.id, customGroupId, {
          principal_id: principalId,
          principal_type: principalType,
          role: principal.roles[0] || PermissionActionEnum.READ,
        });
        await fetchPrincipals();
      } catch {
        // Error handled by API client
      }
    },
    [apiClient, selectedTenant, customGroupId, principals, fetchPrincipals]
  );

  // Handle add principals
  const handleAddPrincipals = useCallback(
    async (selectedPrincipals: SelectedPrincipal[], roles: string[]) => {
      if (!apiClient || !selectedTenant || !customGroupId) return;

      try {
        for (const principal of selectedPrincipals) {
          // For custom groups, use the first role (single role per principal)
          const role = roles[0] as PermissionActionEnum || PermissionActionEnum.READ;
          await apiClient.setCustomGroupPrincipal(selectedTenant.id, customGroupId, {
            principal_id: principal.id,
            principal_type: principal.type,
            role: role,
          });
        }
        setAddPrincipalDialogOpen(false);
        await fetchPrincipals();
      } catch {
        // Error handled by API client
      }
    },
    [apiClient, selectedTenant, customGroupId, fetchPrincipals]
  );

  // Get existing principal IDs for the AddPrincipalDialog
  const existingPrincipalIds = useMemo(
    () => principals.map((p) => p.principalId),
    [principals]
  );

  // Handle close
  const handleClose = () => {
    form.reset();
    setCustomGroup(null);
    setError(null);
    setPrincipals([]);
    setPrincipalsFetched(false);
    setPrincipalsError(null);
    onClose();
  };

  // Check if form has changes
  const hasChanges = form.isDirty();

  return (
    <>
      <Modal
        opened={opened}
        onClose={handleClose}
        title={
          <Group gap="sm">
            <Box className={classes.titleIcon}>
              <IconUsersGroup size={20} />
            </Box>
            <Stack gap={2}>
              <Text fw={600} size="lg">
                {customGroup?.name || 'Custom Group'}
              </Text>
              <Text size="xs" c="dimmed" lineClamp={1}>
                {customGroup?.description || 'No description'}
              </Text>
            </Stack>
          </Group>
        }
        size={1100}
        centered
        classNames={{
          content: classes.modalContent,
          header: classes.modalHeader,
          body: classes.modalBody,
        }}
      >
        <LoadingOverlay visible={isLoading} zIndex={1000} overlayProps={{ blur: 2 }} />

        {error && (
          <Alert
            icon={<IconAlertCircle size={16} />}
            color="red"
            mb="md"
            onClose={() => setError(null)}
            withCloseButton
          >
            {error}
          </Alert>
        )}

        {!isLoading && (
          <Stack gap="md">
            {/* Tab Navigation */}
            <Box className={classes.tabContainer}>
              <SegmentedControl
                value={activeTab}
                onChange={(value) => setActiveTab(value as TabValue)}
                data={[
                  {
                    value: 'members',
                    label: (
                      <Group gap="xs" wrap="nowrap">
                        <IconUsers size={16} />
                        <span>Manage Members</span>
                      </Group>
                    ),
                  },
                  {
                    value: 'details',
                    label: (
                      <Group gap="xs" wrap="nowrap">
                        <IconInfoCircle size={16} />
                        <span>Details</span>
                      </Group>
                    ),
                  },
                  {
                    value: 'access',
                    label: (
                      <Group gap="xs" wrap="nowrap">
                        <IconShieldLock size={16} />
                        <span>Manage Access</span>
                      </Group>
                    ),
                  },
                ]}
                fullWidth
                className={classes.segmentedControl}
              />
            </Box>

            {/* Manage Members Tab */}
            {activeTab === 'members' && (
              <Stack gap="md">
                <Alert icon={<IconInfoCircle size={16} />} color="blue" variant="light">
                  <Text size="sm">
                    Members of this group will inherit permissions when this group is added to resources.
                    Add users or identity groups as members.
                  </Text>
                </Alert>

                <ManageAccessTable
                  principals={principals}
                  isLoading={principalsLoading}
                  hasFetched={principalsFetched}
                  error={principalsError}
                  onRoleChange={handleRoleChange}
                  onDeletePrincipal={handleDeletePrincipal}
                  onAddPrincipal={() => setAddPrincipalDialogOpen(true)}
                  addButtonLabel="Add Member"
                />

                <Group justify="flex-end" mt="md">
                  <Button variant="default" onClick={handleClose}>
                    Close
                  </Button>
                </Group>
              </Stack>
            )}

            {/* Details Tab */}
            {activeTab === 'details' && (
              <form onSubmit={handleSubmit}>
                <Stack gap="md">
                  <TextInput
                    label="Name"
                    placeholder="Enter group name"
                    required
                    {...form.getInputProps('name')}
                  />
                  <Textarea
                    label="Description"
                    placeholder="Enter group description (optional)"
                    minRows={3}
                    {...form.getInputProps('description')}
                  />
                  <Group justify="flex-end" mt="md">
                    <Button variant="default" onClick={handleClose}>
                      Close
                    </Button>
                    <Button
                      type="submit"
                      loading={isSubmitting}
                      disabled={!hasChanges}
                    >
                      Save Changes
                    </Button>
                  </Group>
                </Stack>
              </form>
            )}

            {/* Manage Access Tab */}
            {activeTab === 'access' && (
              <Stack gap="md">
                <Alert icon={<IconInfoCircle size={16} />} color="blue" variant="light">
                  <Text size="sm">
                    Manage who can view and modify this custom group itself. Principals with access can edit the group and manage its members.
                  </Text>
                </Alert>

                <ManageAccessTable
                  principals={principals}
                  isLoading={principalsLoading}
                  hasFetched={principalsFetched}
                  error={principalsError}
                  onRoleChange={handleRoleChange}
                  onDeletePrincipal={handleDeletePrincipal}
                  onAddPrincipal={() => setAddPrincipalDialogOpen(true)}
                />

                <Group justify="flex-end" mt="md">
                  <Button variant="default" onClick={handleClose}>
                    Close
                  </Button>
                </Group>
              </Stack>
            )}
          </Stack>
        )}
      </Modal>

      {/* Add Principal Dialog */}
      <AddPrincipalDialog
        opened={addPrincipalDialogOpen}
        onClose={() => setAddPrincipalDialogOpen(false)}
        onSubmit={handleAddPrincipals}
        existingPrincipalIds={existingPrincipalIds}
        entityName="custom group"
      />
    </>
  );
};
