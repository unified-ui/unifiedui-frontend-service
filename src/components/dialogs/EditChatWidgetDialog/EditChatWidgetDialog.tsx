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
  Badge,
  SegmentedControl,
  Divider,
  Switch,
  Select,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconAlertCircle, IconBrandWechat, IconInfoCircle, IconShieldLock } from '@tabler/icons-react';
import { useIdentity } from '../../../contexts';
import { useEntityPermissions } from '../../../hooks';
import { ManageAccessTable, TagInput, AddPrincipalDialog } from '../../common';
import type { ChatWidgetResponse, ChatWidgetTypeEnum, PermissionActionEnum, PrincipalTypeEnum } from '../../../api/types';
import type { SelectedPrincipal } from '../../common/AddPrincipalDialog/AddPrincipalDialog';
import classes from './EditChatWidgetDialog.module.css';

export type EditDialogTab = 'details' | 'iam';

interface FormValues {
  name: string;
  description: string;
  type: string;
  tags: string[];
  is_active: boolean;
}

const CHAT_WIDGET_TYPES = [
  { value: 'CHAT', label: 'Chat' },
  { value: 'EMBEDDED', label: 'Embedded' },
  { value: 'POPUP', label: 'Popup' },
  { value: 'FLOATING', label: 'Floating' },
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
      is_active: true,
    },
    validate: {
      name: (value) => {
        if (!value.trim()) return 'Name is required';
        if (value.length > 255) return 'Name must be 255 characters or less';
        return null;
      },
    },
  });

  // Initialize form from data
  const initializeFromData = useCallback(
    (data: ChatWidgetResponse) => {
      setChatWidget(data);
      form.setValues({
        name: data.name,
        description: data.description || '',
        type: data.type || 'CHAT',
        tags: data.tags?.map((t) => t.name) || [],
        is_active: data.is_active,
      });
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
      await apiClient.updateChatWidget(selectedTenant.id, chatWidgetId, {
        name: values.name.trim(),
        description: values.description?.trim() || undefined,
        type: values.type as ChatWidgetTypeEnum,
        is_active: values.is_active,
      });

      // Update tags if changed
      const currentTags = chatWidget?.tags?.map((t) => t.name) || [];
      const newTags = values.tags;

      if (JSON.stringify(currentTags.sort()) !== JSON.stringify(newTags.sort())) {
        await apiClient.setChatWidgetTags(selectedTenant.id, chatWidgetId, newTags);
      }

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
    async (selectedPrincipals: SelectedPrincipal[], role: PermissionActionEnum) => {
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
                  <Badge size="xs" variant="light" color={chatWidget.is_active ? 'green' : 'gray'}>
                    {chatWidget.is_active ? 'Active' : 'Inactive'}
                  </Badge>
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

              <Switch
                label="Active"
                description="Enable or disable this chat widget"
                checked={form.values.is_active}
                onChange={(e) => form.setFieldValue('is_active', e.currentTarget.checked)}
                classNames={{ track: classes.switchTrack }}
              />

              <TagInput
                label="Tags"
                placeholder="Enter a tag and press Space to add..."
                value={form.values.tags}
                onChange={(tags) => form.setFieldValue('tags', tags)}
              />

              <Textarea
                label="Description"
                placeholder="Optional description"
                maxLength={2000}
                minRows={3}
                maxRows={6}
                autosize
                {...form.getInputProps('description')}
              />

              <Divider />

              <Group justify="flex-end">
                <Button variant="default" onClick={handleClose} disabled={isSaving}>
                  Cancel
                </Button>
                <Button type="submit" loading={isSaving}>
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
