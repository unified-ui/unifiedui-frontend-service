import { useState, useEffect, useCallback } from 'react';
import type { FC } from 'react';
import { Modal, Text, Group, Box } from '@mantine/core';
import { IconMessageShare } from '@tabler/icons-react';
import { useIdentity } from '../../contexts';
import { ManageAccessTable, AddPrincipalDialog } from '../common';
import type { SelectedPrincipal } from '../common/AddPrincipalDialog/AddPrincipalDialog';
import type { ConversationResponse, PrincipalWithRolesResponse } from '../../api/types';
import { PrincipalTypeEnum, PermissionActionEnum } from '../../api/types';
import type { PrincipalPermission } from '../common/ManageAccessTable/ManageAccessTable';
import classes from './ShareConversationDialog.module.css';

interface ShareConversationDialogProps {
  opened: boolean;
  onClose: () => void;
  conversation: ConversationResponse | null;
}

export const ShareConversationDialog: FC<ShareConversationDialogProps> = ({
  opened,
  onClose,
  conversation,
}) => {
  const { apiClient, selectedTenant } = useIdentity();

  const [principals, setPrincipals] = useState<PrincipalPermission[]>([]);
  const [isPrincipalsLoading, setIsPrincipalsLoading] = useState(false);
  const [hasPrincipalsFetched, setHasPrincipalsFetched] = useState(false);
  const [principalsError, setPrincipalsError] = useState<string | null>(null);
  const [isAddPrincipalOpen, setIsAddPrincipalOpen] = useState(false);

  // Fetch principals
  const fetchPrincipals = useCallback(
    async (showLoading = true) => {
      if (!apiClient || !selectedTenant || !conversation) return;

      if (showLoading) {
        setIsPrincipalsLoading(true);
      }
      setPrincipalsError(null);

      try {
        const response = await apiClient.getConversationPrincipals(selectedTenant.id, conversation.id);

        const transformedPrincipals: PrincipalPermission[] = (response.principals || []).map(
          (p: PrincipalWithRolesResponse) => ({
            id: p.principal_id,
            principalId: p.principal_id,
            principalType: p.principal_type,
            displayName: p.display_name,
            mail: p.mail,
            principalName: p.principal_name,
            description: p.description,
            roles: p.roles || [],
          })
        );

        setPrincipals(transformedPrincipals);
      } catch (err) {
        console.error('Failed to fetch principals:', err);
        setPrincipalsError('Failed to load access permissions');
      } finally {
        setIsPrincipalsLoading(false);
        setHasPrincipalsFetched(true);
      }
    },
    [apiClient, selectedTenant, conversation]
  );

  useEffect(() => {
    if (opened && conversation) {
      fetchPrincipals();
    } else if (!opened) {
      setHasPrincipalsFetched(false);
    }
  }, [opened, conversation, fetchPrincipals]);

  // Handle role change
  const handleRoleChange = useCallback(
    async (
      principalId: string,
      principalType: PrincipalTypeEnum,
      role: PermissionActionEnum,
      enabled: boolean
    ) => {
      if (!apiClient || !selectedTenant || !conversation) return;

      try {
        if (enabled) {
          await apiClient.setConversationPermission(selectedTenant.id, conversation.id, {
            principal_id: principalId,
            principal_type: principalType,
            role,
          });
        } else {
          await apiClient.deleteConversationPermission(
            selectedTenant.id,
            conversation.id,
            principalId,
            principalType,
            role
          );
        }

        await fetchPrincipals(false);
      } catch (error) {
        console.error('Failed to update permission:', error);
        await fetchPrincipals(false);
      }
    },
    [apiClient, selectedTenant, conversation, fetchPrincipals]
  );

  // Handle adding principals
  const handleAddPrincipals = useCallback(
    async (selectedPrincipals: SelectedPrincipal[], roles: string[]) => {
      if (!apiClient || !selectedTenant || !conversation) return;

      const role = (roles[0] as PermissionActionEnum) || PermissionActionEnum.READ;
      for (const principal of selectedPrincipals) {
        await apiClient.setConversationPermission(selectedTenant.id, conversation.id, {
          principal_id: principal.id,
          principal_type: principal.type,
          role,
        });
      }

      await fetchPrincipals(false);
    },
    [apiClient, selectedTenant, conversation, fetchPrincipals]
  );

  // Handle deleting principal
  const handleDeletePrincipal = useCallback(
    async (principalId: string, principalType: PrincipalTypeEnum) => {
      if (!apiClient || !selectedTenant || !conversation) return;

      const principal = principals.find(
        (p) => p.principalId === principalId && p.principalType === principalType
      );
      if (principal) {
        for (const role of principal.roles) {
          await apiClient.deleteConversationPermission(
            selectedTenant.id,
            conversation.id,
            principalId,
            principalType,
            role
          );
        }
      }

      await fetchPrincipals(false);
    },
    [apiClient, selectedTenant, conversation, principals, fetchPrincipals]
  );

  return (
    <>
      <Modal
        opened={opened}
        onClose={onClose}
        title={
          <Group gap="sm">
            <Box className={classes.titleIcon}>
              <IconMessageShare size={20} />
            </Box>
            <Text fw={600} size="lg">
              Share Conversation
            </Text>
          </Group>
        }
        size={1000}
        centered
      >
        <ManageAccessTable
          principals={principals}
          isLoading={isPrincipalsLoading}
          hasFetched={hasPrincipalsFetched}
          error={principalsError}
          onRoleChange={handleRoleChange}
          onDeletePrincipal={handleDeletePrincipal}
          onAddPrincipal={() => setIsAddPrincipalOpen(true)}
          entityName="conversation"
        />
      </Modal>

      <AddPrincipalDialog
        opened={isAddPrincipalOpen}
        onClose={() => setIsAddPrincipalOpen(false)}
        onSubmit={handleAddPrincipals}
        entityName="conversation"
        existingPrincipalIds={principals.map((p) => p.principalId)}
      />
    </>
  );
};
