import type { FC } from 'react';
import { useState, useEffect, useCallback } from 'react';
import {
  Modal,
  Button,
  Group,
  Stack,
  Text,
  Box,
  Checkbox,
  ScrollArea,
  TextInput,
  Badge,
} from '@mantine/core';
import { IconShieldLock, IconSearch, IconUser, IconUsers, IconUsersGroup } from '@tabler/icons-react';
import type { PrincipalTypeEnum } from '../../../api/types';
import type { RoleOption } from '../AddPrincipalDialog';
import classes from './EditRolesDialog.module.css';

interface EditRolesDialogProps {
  /** Whether the dialog is open */
  opened: boolean;
  /** Close handler */
  onClose: () => void;
  /** Submit handler with selected roles */
  onSubmit: (roles: string[]) => Promise<void>;
  /** Principal display name */
  principalName: string;
  /** Principal type for icon */
  principalType: PrincipalTypeEnum;
  /** Principal email */
  principalEmail?: string | null;
  /** Available role options */
  roleOptions: RoleOption[];
  /** Currently assigned roles */
  currentRoles: string[];
}

const getPrincipalIcon = (type: PrincipalTypeEnum) => {
  switch (type) {
    case 'IDENTITY_USER':
      return <IconUser size={20} />;
    case 'IDENTITY_GROUP':
      return <IconUsers size={20} />;
    case 'CUSTOM_GROUP':
      return <IconUsersGroup size={20} />;
    default:
      return <IconUser size={20} />;
  }
};

const getPrincipalTypeLabel = (type: PrincipalTypeEnum) => {
  switch (type) {
    case 'IDENTITY_USER':
      return 'User';
    case 'IDENTITY_GROUP':
      return 'Identity Group';
    case 'CUSTOM_GROUP':
      return 'Custom Group';
    default:
      return type;
  }
};

export const EditRolesDialog: FC<EditRolesDialogProps> = ({
  opened,
  onClose,
  onSubmit,
  principalName,
  principalType,
  principalEmail,
  roleOptions,
  currentRoles,
}) => {
  const [selectedRoles, setSelectedRoles] = useState<string[]>(currentRoles);
  const [permissionSearch, setPermissionSearch] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset state when dialog opens
  useEffect(() => {
    if (opened) {
      setSelectedRoles(currentRoles);
      setPermissionSearch('');
    }
  }, [opened, currentRoles]);

  // Filter role options by search
  const filteredRoleOptions = roleOptions.filter(
    (role) =>
      !permissionSearch ||
      role.label.toLowerCase().includes(permissionSearch.toLowerCase()) ||
      role.description?.toLowerCase().includes(permissionSearch.toLowerCase())
  );

  // Handle role selection
  const handleRoleToggle = useCallback((roleValue: string) => {
    setSelectedRoles((prev) => {
      if (prev.includes(roleValue)) {
        // Don't allow removing all roles
        if (prev.length === 1) return prev;
        return prev.filter((r) => r !== roleValue);
      }
      return [...prev, roleValue];
    });
  }, []);

  // Handle submit
  const handleSubmit = async () => {
    if (selectedRoles.length === 0) return;

    setIsSubmitting(true);
    try {
      await onSubmit(selectedRoles);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check if roles have changed
  const hasChanges = 
    selectedRoles.length !== currentRoles.length ||
    selectedRoles.some((r) => !currentRoles.includes(r)) ||
    currentRoles.some((r) => !selectedRoles.includes(r));

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="sm">
          <IconShieldLock size={20} />
          <span>Manage Roles</span>
        </Group>
      }
      size="lg"
      centered
    >
      <Stack gap="lg">
        {/* Principal Info */}
        <Box className={classes.principalInfo}>
          <Group gap="md">
            <Box className={classes.principalIcon}>
              {getPrincipalIcon(principalType)}
            </Box>
            <Stack gap={2}>
              <Text fw={500}>{principalName}</Text>
              {principalEmail && (
                <Text size="sm" c="dimmed">
                  {principalEmail}
                </Text>
              )}
              <Badge size="sm" variant="outline" color="gray">
                {getPrincipalTypeLabel(principalType)}
              </Badge>
            </Stack>
          </Group>
        </Box>

        {/* Role Selection */}
        <Box>
          <Text size="sm" fw={500} mb="xs">
            Select permissions
          </Text>
          
          {/* Search for permissions if there are many */}
          {roleOptions.length > 5 && (
            <TextInput
              placeholder="Search permissions..."
              leftSection={<IconSearch size={14} />}
              value={permissionSearch}
              onChange={(e) => setPermissionSearch(e.target.value)}
              mb="sm"
              size="sm"
            />
          )}
          
          <ScrollArea.Autosize mah={300} scrollbarSize={8}>
            <Stack gap="sm">
              {filteredRoleOptions.map((role) => (
                <Box
                  key={role.value}
                  className={`${classes.roleOption} ${selectedRoles.includes(role.value) ? classes.roleOptionSelected : ''}`}
                  onClick={() => handleRoleToggle(role.value)}
                >
                  <Checkbox
                    checked={selectedRoles.includes(role.value)}
                    onChange={() => handleRoleToggle(role.value)}
                    label={
                      <Box>
                        <Text size="sm" fw={500}>
                          {role.label}
                        </Text>
                        {role.description && (
                          <Text size="xs" c="dimmed">
                            {role.description}
                          </Text>
                        )}
                      </Box>
                    }
                    styles={{ input: { cursor: 'pointer' }, label: { cursor: 'pointer' } }}
                  />
                </Box>
              ))}
            </Stack>
          </ScrollArea.Autosize>
          
          {selectedRoles.length === 0 && (
            <Text size="xs" c="red" mt="xs">
              At least one role must be selected
            </Text>
          )}
        </Box>

        {/* Actions */}
        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            loading={isSubmitting}
            disabled={selectedRoles.length === 0 || !hasChanges}
          >
            Save Changes
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};
