import type { FC } from 'react';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Text,
  Center,
  Group,
  ActionIcon,
  Breadcrumbs,
  Anchor,
  Stack,
  Select,
  Badge,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconArrowLeft } from '@tabler/icons-react';
import { MainLayout } from '../../../components/layout/MainLayout';
import {
  PageContainer,
  PageHeader,
  DetailPageTabs,
  EntityDetailsForm,
  ManageAccessTable,
  AddPrincipalDialog,
} from '../../../components/common';
import type { FieldConfig, PrincipalPermission, SelectedPrincipal } from '../../../components/common';
import { useIdentity } from '../../../contexts';
import type {
  ApplicationResponse,
  UpdateApplicationRequest,
  PermissionActionEnum,
  PrincipalTypeEnum,
  ApplicationTypeEnum,
} from '../../../api/types';

const APPLICATION_TYPES = [
  { value: 'N8N', label: 'N8N Workflow' },
  { value: 'MICROSOFT_FOUNDRY', label: 'Microsoft Foundry' },
  { value: 'REST_API', label: 'REST API' },
];

export const ApplicationDetailPage: FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { apiClient, selectedTenant } = useIdentity();

  // Application data
  const [application, setApplication] = useState<ApplicationResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Principals data
  const [principals, setPrincipals] = useState<PrincipalPermission[]>([]);
  const [isPrincipalsLoading, setIsPrincipalsLoading] = useState(false);
  const [principalsError, setPrincipalsError] = useState<string | null>(null);

  // Dialog state
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  // Fetch application data
  const fetchApplication = useCallback(async () => {
    if (!apiClient || !selectedTenant || !id) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await apiClient.getApplication(selectedTenant.id, id);
      setApplication(data);
    } catch (err) {
      console.error('Failed to fetch application:', err);
      setError('Failed to load application');
    } finally {
      setIsLoading(false);
    }
  }, [apiClient, selectedTenant, id]);

  // Fetch principals
  const fetchPrincipals = useCallback(async () => {
    if (!apiClient || !selectedTenant || !id) return;

    setIsPrincipalsLoading(true);
    setPrincipalsError(null);

    try {
      const response = await apiClient.getApplicationPrincipals(selectedTenant.id, id);

      // Transform response to PrincipalPermission format
      const transformedPrincipals: PrincipalPermission[] = response.principals.map((p) => ({
        id: p.principal_id,
        principalId: p.principal_id,
        principalType: p.principal_type,
        displayName: p.principal_id, // TODO: Fetch display names
        roles: p.permissions.map((perm) => perm.role),
      }));

      setPrincipals(transformedPrincipals);
    } catch (err) {
      console.error('Failed to fetch principals:', err);
      setPrincipalsError('Failed to load access permissions');
    } finally {
      setIsPrincipalsLoading(false);
    }
  }, [apiClient, selectedTenant, id]);

  // Initial data fetch
  useEffect(() => {
    fetchApplication();
    fetchPrincipals();
  }, [fetchApplication, fetchPrincipals]);

  // Handle application update
  const handleSaveApplication = useCallback(
    async (data: Partial<ApplicationResponse>) => {
      if (!apiClient || !selectedTenant || !id) return;

      const updateData: UpdateApplicationRequest = {
        name: data.name,
        description: data.description,
        type: data.type as ApplicationTypeEnum,
        is_active: data.is_active,
      };

      await apiClient.updateApplication(selectedTenant.id, id, updateData);
      await fetchApplication();
    },
    [apiClient, selectedTenant, id, fetchApplication]
  );

  // Handle role change
  const handleRoleChange = useCallback(
    async (
      principalId: string,
      principalType: PrincipalTypeEnum,
      role: PermissionActionEnum,
      enabled: boolean
    ) => {
      if (!apiClient || !selectedTenant || !id) return;

      try {
        if (enabled) {
          await apiClient.setApplicationPermission(selectedTenant.id, id, {
            principal_id: principalId,
            principal_type: principalType,
            role,
          });
        } else {
          await apiClient.deleteApplicationPermission(
            selectedTenant.id,
            id,
            principalId,
            principalType,
            role
          );
        }

        // Refresh principals
        await fetchPrincipals();
      } catch (err) {
        console.error('Failed to update permission:', err);
        notifications.show({
          title: 'Error',
          message: 'Failed to update permission',
          color: 'red',
        });
      }
    },
    [apiClient, selectedTenant, id, fetchPrincipals]
  );

  // Handle add principals
  const handleAddPrincipals = useCallback(
    async (selectedPrincipals: SelectedPrincipal[], role: PermissionActionEnum) => {
      if (!apiClient || !selectedTenant || !id) return;

      const promises = selectedPrincipals.map((principal) =>
        apiClient.setApplicationPermission(selectedTenant.id, id, {
          principal_id: principal.id,
          principal_type: principal.type,
          role,
        })
      );

      await Promise.all(promises);
      await fetchPrincipals();
    },
    [apiClient, selectedTenant, id, fetchPrincipals]
  );

  // Field configuration for EntityDetailsForm
  const fields: FieldConfig[] = useMemo(
    () => [
      {
        key: 'name',
        label: 'Name',
        type: 'text',
        required: true,
        placeholder: 'Application name',
      },
      {
        key: 'description',
        label: 'Description',
        type: 'textarea',
        placeholder: 'Describe this application...',
      },
      {
        key: 'type',
        label: 'Type',
        type: 'custom',
        render: (value, isEditing, onChange) => {
          if (!isEditing) {
            const typeLabel =
              APPLICATION_TYPES.find((t) => t.value === value)?.label || String(value);
            return (
              <Stack gap="xs">
                <Text size="sm" fw={500}>
                  Type
                </Text>
                <Badge variant="light">{typeLabel}</Badge>
              </Stack>
            );
          }
          return (
            <Select
              label="Type"
              data={APPLICATION_TYPES}
              value={value as string}
              onChange={(val) => onChange(val)}
              placeholder="Select application type"
            />
          );
        },
      },
      {
        key: 'is_active',
        label: 'Active',
        type: 'switch',
        description: 'Whether this application is currently active',
      },
      {
        key: 'tags',
        label: 'Tags',
        type: 'custom',
        render: (value, isEditing, _onChange) => {
          const tags = (value as { name: string }[] | undefined)?.map((t) => t.name) || [];
          if (!isEditing) {
            return (
              <Stack gap="xs">
                <Text size="sm" fw={500}>
                  Tags
                </Text>
                {tags.length > 0 ? (
                  <Group gap="xs">
                    {tags.map((tag) => (
                      <Badge key={tag} variant="light">
                        {tag}
                      </Badge>
                    ))}
                  </Group>
                ) : (
                  <Text size="sm" c="dimmed">
                    No tags
                  </Text>
                )}
              </Stack>
            );
          }
          return (
            <Stack gap="xs">
              <Text size="sm" fw={500}>
                Tags
              </Text>
              <Text size="sm" c="dimmed">
                Tags cannot be edited here. Use the tags management feature.
              </Text>
            </Stack>
          );
        },
      },
      {
        key: 'created_at',
        label: 'Created',
        type: 'readonly',
      },
      {
        key: 'updated_at',
        label: 'Last Updated',
        type: 'readonly',
      },
    ],
    []
  );

  // Existing principal IDs for filtering in add dialog
  const existingPrincipalIds = useMemo(
    () => principals.map((p) => p.principalId),
    [principals]
  );

  // Navigate back
  const handleBack = () => {
    navigate('/applications');
  };

  if (error) {
    return (
      <MainLayout>
        <PageContainer>
          <Center py="xl">
            <Stack align="center" gap="md">
              <Text c="red" size="lg">
                {error}
              </Text>
              <Group>
                <ActionIcon variant="default" onClick={handleBack}>
                  <IconArrowLeft size={20} />
                </ActionIcon>
                <Text
                  component="button"
                  onClick={handleBack}
                  style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  Back to Applications
                </Text>
              </Group>
            </Stack>
          </Center>
        </PageContainer>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <PageContainer>
        <Stack gap="lg">
          {/* Breadcrumbs */}
          <Group gap="sm">
            <ActionIcon variant="subtle" onClick={handleBack}>
              <IconArrowLeft size={20} />
            </ActionIcon>
            <Breadcrumbs separator="›">
              <Anchor onClick={handleBack} style={{ cursor: 'pointer' }}>
                Applications
              </Anchor>
              <Text>{isLoading ? 'Loading...' : application?.name}</Text>
            </Breadcrumbs>
          </Group>

          {/* Page Header */}
          <PageHeader
            title={isLoading ? 'Loading...' : application?.name || 'Application'}
            description={application?.description}
          />

          {/* Tabs */}
          <DetailPageTabs
            detailsContent={
              <EntityDetailsForm
                data={application}
                isLoading={isLoading}
                fields={fields}
                onSave={handleSaveApplication}
                entityName="Application"
                canEdit={true}
              />
            }
            iamContent={
              <>
                <ManageAccessTable
                  principals={principals}
                  isLoading={isPrincipalsLoading}
                  error={principalsError}
                  onRoleChange={handleRoleChange}
                  onAddPrincipal={() => setIsAddDialogOpen(true)}
                  entityName="application"
                />
                <AddPrincipalDialog
                  opened={isAddDialogOpen}
                  onClose={() => setIsAddDialogOpen(false)}
                  onSubmit={handleAddPrincipals}
                  entityName="application"
                  existingPrincipalIds={existingPrincipalIds}
                />
              </>
            }
          />
        </Stack>
      </PageContainer>
    </MainLayout>
  );
};
