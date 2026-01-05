import type { FC } from 'react';
import { useState, useEffect } from 'react';
import {
  Modal,
  Stack,
  TextInput,
  Select,
  Button,
  Group,
  Text,
  Loader,
  ActionIcon,
  Paper,
  Badge,
  Divider,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconSearch, IconX, IconUser, IconUsers } from '@tabler/icons-react';
import { useIdentity } from '../../contexts';
import type {
  ConversationResponse,
  PrincipalWithRolesResponse,
  PermissionActionEnum,
  PrincipalTypeEnum,
} from '../../api/types';


interface ShareConversationDialogProps {
  opened: boolean;
  onClose: () => void;
  conversation: ConversationResponse | null;
}

const ROLE_OPTIONS = [
  { value: 'READ', label: 'Read Only' },
  { value: 'WRITE', label: 'Can Edit' },
  { value: 'ADMIN', label: 'Admin' },
];

export const ShareConversationDialog: FC<ShareConversationDialogProps> = ({
  opened,
  onClose,
  conversation,
}) => {
  const { apiClient, selectedTenant } = useIdentity();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [principals, setPrincipals] = useState<PrincipalWithRolesResponse[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPrincipalId, setSelectedPrincipalId] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<PermissionActionEnum>('READ' as PermissionActionEnum);
  const [principalType, setPrincipalType] = useState<PrincipalTypeEnum>('IDENTITY_USER' as PrincipalTypeEnum);

  // Load existing principals
  useEffect(() => {
    if (!opened || !conversation || !apiClient || !selectedTenant) return;

    const loadPrincipals = async () => {
      setIsLoading(true);
      try {
        const response = await apiClient.getConversationPrincipals(
          selectedTenant.id,
          conversation.id
        );
        setPrincipals(response.principals);
      } catch (error) {
        console.error('Failed to load principals:', error);
        notifications.show({
          title: 'Error',
          message: 'Failed to load sharing settings',
          color: 'red',
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadPrincipals();
  }, [opened, conversation, apiClient, selectedTenant]);

  const handleAddPrincipal = async () => {
    if (!selectedPrincipalId || !apiClient || !selectedTenant || !conversation) return;

    setIsSaving(true);
    try {
      await apiClient.setConversationPermission(
        selectedTenant.id,
        conversation.id,
        {
          principal_id: selectedPrincipalId,
          principal_type: principalType,
          role: selectedRole,
        }
      );

      // Reload principals
      const response = await apiClient.getConversationPrincipals(
        selectedTenant.id,
        conversation.id
      );
      setPrincipals(response.principals);

      // Reset form
      setSelectedPrincipalId('');
      setSelectedRole('READ' as PermissionActionEnum);

      notifications.show({
        title: 'Success',
        message: 'Permission added successfully',
        color: 'green',
      });
    } catch (error) {
      console.error('Failed to add permission:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to add permission',
        color: 'red',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemovePrincipal = async (principalId: string) => {
    if (!apiClient || !selectedTenant || !conversation) return;

    try {
      const principal = principals.find(p => p.principal_id === principalId);
      if (!principal || !principal.roles || principal.roles.length === 0) return;

      await apiClient.deleteConversationPermission(
        selectedTenant.id,
        conversation.id,
        principalId,
        principal.principal_type,
        principal.roles[0]
      );

      // Update local state
      setPrincipals(prev => prev.filter(p => p.principal_id !== principalId));

      notifications.show({
        title: 'Success',
        message: 'Permission removed successfully',
        color: 'green',
      });
    } catch (error) {
      console.error('Failed to remove permission:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to remove permission',
        color: 'red',
      });
    }
  };

  const handleUpdateRole = async (principalId: string, newRole: PermissionActionEnum) => {
    if (!apiClient || !selectedTenant || !conversation) return;

    const principal = principals.find(p => p.principal_id === principalId);
    if (!principal) return;

    try {
      await apiClient.setConversationPermission(
        selectedTenant.id,
        conversation.id,
        {
          principal_id: principalId,
          principal_type: principal.principal_type,
          role: newRole,
        }
      );

      // Update local state
      setPrincipals(prev =>
        prev.map(p =>
          p.principal_id === principalId ? { ...p, role: newRole } : p
        )
      );

      notifications.show({
        title: 'Success',
        message: 'Permission updated successfully',
        color: 'green',
      });
    } catch (error) {
      console.error('Failed to update permission:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to update permission',
        color: 'red',
      });
    }
  };

  const filteredPrincipals = principals.filter(p =>
    p.principal_id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={`Share: ${conversation?.name || 'Conversation'}`}
      size="lg"
    >
      <Stack gap="md">
        {/* Add Principal Section */}
        <Paper p="md" withBorder>
          <Stack gap="sm">
            <Text size="sm" fw={500}>
              Add people or groups
            </Text>
            <Group gap="sm" align="flex-end">
              <Select
                label="Type"
                value={principalType}
                onChange={(value) => setPrincipalType((value || 'IDENTITY_USER') as PrincipalTypeEnum)}
                data={[
                  { value: 'IDENTITY_USER', label: 'User' },
                  { value: 'IDENTITY_GROUP', label: 'Identity Group' },
                  { value: 'CUSTOM_GROUP', label: 'Custom Group' },
                ]}
                style={{ width: 150 }}
              />
              <TextInput
                label="ID"
                placeholder="Enter user/group ID"
                value={selectedPrincipalId}
                onChange={(e) => setSelectedPrincipalId(e.currentTarget.value)}
                style={{ flex: 1 }}
              />
              <Select
                label="Role"
                value={selectedRole}
                onChange={(value) => setSelectedRole(value as PermissionActionEnum)}
                data={ROLE_OPTIONS}
                style={{ width: 150 }}
              />
              <Button
                onClick={handleAddPrincipal}
                disabled={!selectedPrincipalId || isSaving}
                loading={isSaving}
              >
                Add
              </Button>
            </Group>
          </Stack>
        </Paper>

        <Divider />

        {/* Current Principals */}
        <Stack gap="sm">
          <Group justify="space-between">
            <Text size="sm" fw={500}>
              Who has access
            </Text>
            <TextInput
              placeholder="Search..."
              size="xs"
              leftSection={<IconSearch size={14} />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.currentTarget.value)}
              style={{ width: 200 }}
            />
          </Group>

          {isLoading ? (
            <Group justify="center" py="xl">
              <Loader size="sm" />
            </Group>
          ) : filteredPrincipals.length === 0 ? (
            <Text c="dimmed" size="sm" ta="center" py="xl">
              {searchQuery ? 'No matching principals found' : 'No one has access yet'}
            </Text>
          ) : (
            <Stack gap="xs">
              {filteredPrincipals.map((principal) => (
                <Paper key={principal.principal_id} p="sm" withBorder>
                  <Group justify="space-between">
                    <Group gap="sm">
                      {principal.principal_type === 'IDENTITY_USER' ? (
                        <IconUser size={20} />
                      ) : (
                        <IconUsers size={20} />
                      )}
                      <div>
                        <Text size="sm">{principal.principal_id}</Text>
                        <Badge size="xs" variant="light">
                          {principal.principal_type}
                        </Badge>
                      </div>
                    </Group>
                    <Group gap="xs">
                      <Select
                        value={principal.roles && principal.roles.length > 0 ? principal.roles[0] : 'READ'}
                        onChange={(value) =>
                          handleUpdateRole(
                            principal.principal_id,
                            value as PermissionActionEnum
                          )
                        }
                        data={ROLE_OPTIONS}
                        size="xs"
                        style={{ width: 120 }}
                      />
                      <ActionIcon
                        color="red"
                        variant="subtle"
                        onClick={() => handleRemovePrincipal(principal.principal_id)}
                      >
                        <IconX size={16} />
                      </ActionIcon>
                    </Group>
                  </Group>
                </Paper>
              ))}
            </Stack>
          )}
        </Stack>

        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={onClose}>
            Close
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};
