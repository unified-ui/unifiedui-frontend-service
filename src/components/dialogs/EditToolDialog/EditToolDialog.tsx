import type { FC } from 'react';
import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Modal,
  TextInput,
  Textarea,
  Button,
  Stack,
  Group,
  LoadingOverlay,
  Alert,
  Box,
  Text,
  Badge,
  SegmentedControl,
  Divider,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconAlertCircle, IconTool, IconInfoCircle, IconShieldLock } from '@tabler/icons-react';
import { useIdentity } from '../../../contexts';
import { GenerateWithAIButton } from '../../common/GenerateWithAIButton';
import { useEntityPermissions, usePermissions } from '../../../hooks';
import { useFormDirtyGuard } from '../../../hooks';
import { ManageAccessTable, TagInput, AddPrincipalDialog } from '../../common';
import type { ToolResponse, PrincipalTypeEnum, ToolTypeEnum } from '../../../api/types';
import { PermissionActionEnum } from '../../../api/types';
import type { SelectedPrincipal } from '../../common/AddPrincipalDialog/AddPrincipalDialog';
import { validateToolConfig } from '../../../utils/toolConfigValidator';
import classes from './EditToolDialog.module.css';

export type EditDialogTab = 'details' | 'iam';

interface FormValues {
  name: string;
  description: string;
  tags: string[];
  is_active: boolean;
  configJson: string;
}

export interface EditToolDialogProps {
  opened: boolean;
  toolId: string | null;
  initialData?: ToolResponse | null;
  activeTab?: EditDialogTab;
  onClose: () => void;
  onSuccess?: () => void;
  onTabChange?: (tab: EditDialogTab) => void;
}

export const EditToolDialog: FC<EditToolDialogProps> = ({
  opened,
  toolId,
  initialData,
  activeTab = 'details',
  onClose,
  onSuccess,
  onTabChange,
}) => {
  const { apiClient, selectedTenant } = useIdentity();
  const { isGlobalAdmin } = usePermissions();
  const showIamTab = isGlobalAdmin || !initialData || initialData.my_permission === 'ADMIN';
  const [tool, setTool] = useState<ToolResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAddPrincipalOpen, setIsAddPrincipalOpen] = useState(false);

  // Use the generic permissions hook
  const {
    principals,
    isLoading: isPrincipalsLoading,
    hasFetched: hasPrincipalsFetched,
    error: principalsError,
    fetchPrincipals,
    handleRoleChange,
    handleAddPrincipals,
    handleDeletePrincipal,
    resetState: resetPrincipalsState,
  } = useEntityPermissions({
    entityType: 'tool',
    entityId: toolId,
  });

  const form = useForm<FormValues>({
    initialValues: {
      name: '',
      description: '',
      tags: [],
      is_active: true,
      configJson: '',
    },
    validate: {
      name: (value) => {
        if (!value.trim()) return 'Name is required';
        if (value.length > 255) return 'Name must be 255 characters or less';
        return null;
      },
    },
  });

  const configValidation = useMemo(() => {
    if (!form.values.configJson.trim() || !tool?.type) return null;
    return validateToolConfig(tool.type as ToolTypeEnum, form.values.configJson);
  }, [form.values.configJson, tool?.type]);

  useFormDirtyGuard(form.isDirty());

  // Initialize form from data
  const initializeFromData = useCallback(
    (data: ToolResponse) => {
      setTool(data);
      const configStr = data.config && Object.keys(data.config).length > 0
        ? JSON.stringify(data.config, null, 2)
        : '';
      form.setValues({
        name: data.name,
        description: data.description || '',
        tags: data.tags?.map((t) => t.name) || [],
        is_active: data.is_active,
        configJson: configStr,
      });
      form.resetDirty();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  // Fetch tool details
  const fetchTool = useCallback(async () => {
    if (!apiClient || !selectedTenant || !toolId) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await apiClient.getTool(selectedTenant.id, toolId);
      initializeFromData(data);
    } catch (err) {
      console.error('Failed to fetch tool:', err);
      setError('Failed to load tool details');
    } finally {
      setIsLoading(false);
    }
  }, [apiClient, selectedTenant, toolId, initializeFromData]);

  // Fetch data when dialog opens
  useEffect(() => {
    if (opened && toolId) {
      if (initialData) {
        initializeFromData(initialData);
      } else {
        fetchTool();
      }
      // Always fetch principals (they're not in the list data)
      fetchPrincipals();
    } else if (!opened) {
      resetPrincipalsState();
    }
  }, [opened, toolId, initialData, initializeFromData, fetchTool, fetchPrincipals, resetPrincipalsState]);

  // Handle tab change
  const handleTabChange = (value: string) => {
    const tab = value as EditDialogTab;
    onTabChange?.(tab);
  };

  // Handle form submit
  const handleSubmit = async (values: FormValues) => {
    if (!apiClient || !selectedTenant || !toolId) return;
    if (configValidation && !configValidation.valid) return;

    setIsSaving(true);
    setError(null);

    try {
      let parsedConfig: Record<string, unknown> | undefined;
      if (values.configJson.trim()) {
        parsedConfig = JSON.parse(values.configJson);
      }

      await apiClient.updateTool(selectedTenant.id, toolId, {
        name: values.name.trim(),
        description: values.description?.trim() || undefined,
        is_active: values.is_active,
        ...(parsedConfig !== undefined ? { config: parsedConfig } : {}),
      });

      // Update tags if changed
      const currentTags = tool?.tags?.map((t) => t.name) || [];
      const newTags = values.tags;

      if (JSON.stringify(currentTags.sort()) !== JSON.stringify(newTags.sort())) {
        await apiClient.setToolTags(selectedTenant.id, toolId, newTags);
      }

      form.resetDirty();
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Failed to update tool:', err);
      setError('Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle adding principals with callback
  const handleAddPrincipalsWithRole = useCallback(
    async (selectedPrincipals: SelectedPrincipal[], roles: string[]) => {
      const role = roles[0] as PermissionActionEnum || PermissionActionEnum.READ;
      await handleAddPrincipals(selectedPrincipals, role);
    },
    [handleAddPrincipals]
  );

  // Handle role change with type conversion
  const handleRoleChangeWithTypes = useCallback(
    async (principalId: string, principalType: PrincipalTypeEnum, role: PermissionActionEnum, enabled: boolean) => {
      await handleRoleChange(principalId, principalType, role, enabled);
    },
    [handleRoleChange]
  );

  // Handle delete principal with type conversion
  const handleDeletePrincipalWithTypes = useCallback(
    async (principalId: string, principalType: PrincipalTypeEnum) => {
      await handleDeletePrincipal(principalId, principalType);
    },
    [handleDeletePrincipal]
  );

  // Handle close
  const handleClose = () => {
    form.reset();
    setError(null);
    setTool(null);
    onClose();
  };

  // Format tool type for display
  const formatToolType = (type?: string) => {
    if (!type) return '';
    return type.replace(/_/g, ' ');
  };

  return (
    <>
      <Modal
        opened={opened}
        onClose={handleClose}
        title={
          <Group gap="sm">
            <Box className={classes.titleIcon}>
              <IconTool size={20} />
            </Box>
            <Stack gap={2}>
              <Text fw={600} size="lg">
                {tool?.name}
              </Text>
              {tool && (
                <Group gap="xs">
                  <Badge size="xs" variant="light" color={tool.is_active ? 'green' : 'gray'}>
                    {tool.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                  <Text size="xs" c="dimmed">
                    {formatToolType(tool.type)}
                  </Text>
                </Group>
              )}
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

        {/* Tab Navigation */}
        {showIamTab && (
        <Box className={classes.tabContainer}>
          <SegmentedControl
            value={activeTab}
            onChange={handleTabChange}
            data={[
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
                value: 'iam',
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
        )}

        {/* Tab Content */}
        {activeTab === 'details' ? (
          <form onSubmit={form.onSubmit(handleSubmit)}>
            <Stack gap="md">
              <TextInput
                label="Name"
                placeholder="Enter a name"
                required
                withAsterisk
                maxLength={255}
                {...form.getInputProps('name')}
              />

              {tool && (
                <TextInput
                  label="Type"
                  value={formatToolType(tool.type)}
                  disabled
                />
              )}

              {tool && (
                <Stack gap="xs">
                  <Textarea
                    label="Configuration (JSON)"
                    placeholder="Enter tool configuration as JSON..."
                    minRows={6}
                    maxRows={12}
                    autosize
                    styles={{ input: { fontFamily: 'monospace', fontSize: 12 } }}
                    {...form.getInputProps('configJson')}
                  />
                  {configValidation && !configValidation.valid && (
                    <Alert
                      icon={<IconAlertCircle size={16} />}
                      color="red"
                      variant="light"
                      title="Configuration Error"
                    >
                      {configValidation.errors.map((err, i) => (
                        <Text key={i} size="xs">{err}</Text>
                      ))}
                    </Alert>
                  )}
                  {configValidation && configValidation.valid && configValidation.warnings.length > 0 && (
                    <Alert
                      icon={<IconAlertCircle size={16} />}
                      color="yellow"
                      variant="light"
                      title="Warning"
                    >
                      {configValidation.warnings.map((w, i) => (
                        <Text key={i} size="xs">{w}</Text>
                      ))}
                    </Alert>
                  )}
                </Stack>
              )}

              <TagInput
                label="Tags"
                placeholder="Enter a tag and press Space to add..."
                value={form.values.tags}
                onChange={(tags) => form.setFieldValue('tags', tags)}
              />

              <Box pos="relative">
                <Textarea
                  label="Description"
                  placeholder="Optional description"
                  maxLength={2000}
                  minRows={3}
                  maxRows={6}
                  autosize
                  {...form.getInputProps('description')}
                />
                <Box pos="absolute" top={0} right={0}>
                  <GenerateWithAIButton
                    entityType="tool"
                    entityName={form.values.name}
                    existingDescription={form.values.description || undefined}
                    onGenerated={(desc: string) => form.setFieldValue('description', desc)}
                  />
                </Box>
              </Box>

              <Divider />

              <Group justify="flex-end">
                <Button variant="default" onClick={handleClose} disabled={isSaving}>
                  Cancel
                </Button>
                <Button type="submit" loading={isSaving} disabled={!form.isDirty()}>
                  Save Changes
                </Button>
              </Group>
            </Stack>
          </form>
        ) : (
          <Box className={classes.iamContainer}>
            <ManageAccessTable
              principals={principals}
              isLoading={isPrincipalsLoading}
              hasFetched={hasPrincipalsFetched}
              error={principalsError}
              onRoleChange={handleRoleChangeWithTypes}
              onDeletePrincipal={handleDeletePrincipalWithTypes}
              onAddPrincipal={() => setIsAddPrincipalOpen(true)}
              entityName="tool"
            />
          </Box>
        )}
      </Modal>

      <AddPrincipalDialog
        opened={isAddPrincipalOpen}
        onClose={() => setIsAddPrincipalOpen(false)}
        onSubmit={handleAddPrincipalsWithRole}
        entityName="tool"
        existingPrincipalIds={principals.map((p) => p.principalId)}
      />
    </>
  );
};
