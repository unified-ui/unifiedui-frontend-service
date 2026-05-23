import type { FC } from 'react';
import { useState, useEffect, useCallback } from 'react';
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
  SegmentedControl,
  Divider,
  Select,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconAlertCircle, IconBrandWechat, IconInfoCircle, IconShieldLock } from '@tabler/icons-react';
import { useIdentity } from '../../../contexts';
import { GenerateWithAIButton } from '../../common/GenerateWithAIButton';
import { useEntityPermissions, usePermissions } from '../../../hooks';
import { useFormDirtyGuard } from '../../../hooks';
import { ManageAccessTable, TagInput, AddPrincipalDialog } from '../../common';
import type { ChatWidgetResponse, ChatWidgetTypeEnum, PrincipalTypeEnum } from '../../../api/types';
import { PermissionActionEnum } from '../../../api/types';
import type { SelectedPrincipal } from '../../common/AddPrincipalDialog/AddPrincipalDialog';
import classes from './EditChatWidgetDialog.module.css';

export type EditDialogTab = 'details' | 'iam';

interface FormValues {
  name: string;
  description: string;
  type: string;
  tags: string[];
  url: string;
}

const CHAT_WIDGET_TYPES = [
  { value: 'IFRAME', label: 'IFrame' },
  { value: 'FORM', label: 'Form' },
];

export interface EditChatWidgetDialogProps {
  opened: boolean;
  chatWidgetId: string | null;
  initialData?: ChatWidgetResponse | null;
  activeTab?: EditDialogTab;
  onClose: () => void;
  onSuccess?: () => void;
  onTabChange?: (tab: EditDialogTab) => void;
}

export const EditChatWidgetDialog: FC<EditChatWidgetDialogProps> = ({
  opened,
  chatWidgetId,
  initialData,
  activeTab = 'details',
  onClose,
  onSuccess,
  onTabChange,
}) => {
  const { apiClient, selectedTenant } = useIdentity();
  const { isGlobalAdmin } = usePermissions();
  const showIamTab = isGlobalAdmin || !initialData || initialData.my_permission === 'ADMIN';
  const [chatWidget, setChatWidget] = useState<ChatWidgetResponse | null>(null);
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
    entityType: 'chat-widget',
    entityId: chatWidgetId,
  });

  const form = useForm<FormValues>({
    initialValues: {
      name: '',
      description: '',
      type: 'CHAT',
      tags: [],
      url: '',
    },
    validate: {
      name: (value) => {
        if (!value.trim()) return 'Name is required';
        if (value.length > 255) return 'Name must be 255 characters or less';
        return null;
      },
    },
  });

  useFormDirtyGuard(form.isDirty());

  // Initialize form from data
  const initializeFromData = useCallback(
    (data: ChatWidgetResponse) => {
      setChatWidget(data);
      form.setValues({
        name: data.name,
        description: data.description || '',
        type: data.type || 'CHAT',
        tags: data.tags?.map((t) => t.name) || [],
        url: (data.config?.url as string) || '',
      });
      form.resetDirty();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  // Fetch chat widget details
  const fetchChatWidget = useCallback(async () => {
    if (!apiClient || !selectedTenant || !chatWidgetId) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await apiClient.getChatWidget(selectedTenant.id, chatWidgetId);
      initializeFromData(data);
    } catch (err) {
      console.error('Failed to fetch chat widget:', err);
      setError('Failed to load chat widget details');
    } finally {
      setIsLoading(false);
    }
  }, [apiClient, selectedTenant, chatWidgetId, initializeFromData]);

  // Fetch data when dialog opens
  useEffect(() => {
    if (opened && chatWidgetId) {
      if (initialData) {
        initializeFromData(initialData);
      } else {
        fetchChatWidget();
      }
      // Always fetch principals (they're not in the list data)
      fetchPrincipals();
    } else if (!opened) {
      resetPrincipalsState();
    }
  }, [opened, chatWidgetId, initialData, initializeFromData, fetchChatWidget, fetchPrincipals, resetPrincipalsState]);

  // Handle tab change
  const handleTabChange = (value: string) => {
    const tab = value as EditDialogTab;
    onTabChange?.(tab);
  };

  // Handle form submit
  const handleSubmit = async (values: FormValues) => {
    if (!apiClient || !selectedTenant || !chatWidgetId) return;

    setIsSaving(true);
    setError(null);

    try {
      // Update chat widget
      const updateData: {
        name: string;
        description?: string;
        type: ChatWidgetTypeEnum;
        config?: Record<string, unknown>;
      } = {
        name: values.name.trim(),
        description: values.description?.trim() || undefined,
        type: values.type as ChatWidgetTypeEnum,
      };

      // For IFRAME type, save the URL in config
      if (values.type === 'IFRAME' && values.url) {
        updateData.config = {
          ...chatWidget?.config,
          url: values.url.trim(),
        };
      }

      await apiClient.updateChatWidget(selectedTenant.id, chatWidgetId, updateData);

      // Update tags if changed
      const currentTags = chatWidget?.tags?.map((t) => t.name) || [];
      const newTags = values.tags;

      if (JSON.stringify(currentTags.sort()) !== JSON.stringify(newTags.sort())) {
        await apiClient.setChatWidgetTags(selectedTenant.id, chatWidgetId, newTags);
      }

      form.resetDirty();
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Failed to update chat widget:', err);
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
    setChatWidget(null);
    onClose();
  };

  return (
    <>
      <Modal
        opened={opened}
        onClose={handleClose}
        title={
          <Group gap="sm">
            <Box className={classes.titleIcon}>
              <IconBrandWechat size={20} />
            </Box>
            <Stack gap={2}>
              <Text fw={600} size="lg">
                {chatWidget?.name}
              </Text>
              {chatWidget && (
                <Group gap="xs">
                  <Text size="xs" c="dimmed">
                    {CHAT_WIDGET_TYPES.find((t) => t.value === chatWidget.type)?.label || chatWidget.type}
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
              <Group grow align="flex-start">
                <TextInput
                  label="Name"
                  placeholder="Enter a name"
                  required
                  withAsterisk
                  maxLength={255}
                  {...form.getInputProps('name')}
                />

                <Select
                  label="Type"
                  placeholder="Select a type"
                  data={CHAT_WIDGET_TYPES}
                  {...form.getInputProps('type')}
                />
              </Group>

              {form.values.type === 'IFRAME' && (
                <>
                  <TextInput
                    label="URL"
                    placeholder="https://example.com/embed"
                    description="The URL to embed in the iframe"
                    {...form.getInputProps('url')}
                  />
                  {form.values.url && (
                    <Box
                      style={{
                        border: '1px solid var(--mantine-color-default-border)',
                        borderRadius: 'var(--mantine-radius-md)',
                        overflow: 'hidden',
                        height: 200,
                      }}
                    >
                      <iframe
                        src={form.values.url}
                        title="Widget Preview"
                        width="100%"
                        height="100%"
                        style={{ border: 'none' }}
                      />
                    </Box>
                  )}
                </>
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
                    entityType="chat_widget"
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
              entityName="chat widget"
              onRefreshPrincipal={async (principalId, principalType) => {
                if (!apiClient || !selectedTenant) return;
                await apiClient.refreshPrincipal(principalId, { tenant_id: selectedTenant.id, type: principalType as 'IDENTITY_USER' | 'IDENTITY_GROUP' });
                await fetchPrincipals(false);
              }}
            />
          </Box>
        )}
      </Modal>

      <AddPrincipalDialog
        opened={isAddPrincipalOpen}
        onClose={() => setIsAddPrincipalOpen(false)}
        onSubmit={handleAddPrincipalsWithRole}
        entityName="chat widget"
        existingPrincipalIds={principals.map((p) => p.principalId)}
      />
    </>
  );
};
