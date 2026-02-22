import type { FC } from 'react';
import { useState, useEffect, useCallback } from 'react';
import {
  Stack,
  TextInput,
  Textarea,
  Button,
  Group,
  Paper,
  Text,
  Title,
  Table,
  Loader,
  Center,
  Badge,
  ActionIcon,
  Alert,
  Menu,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import {
  IconInfoCircle,
  IconDots,
  IconTrash,
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { useIdentity } from '../../../contexts';
import { OrganizationRoleEnum } from '../../../api/types';
import type {
  OrganizationResponse,
  OrganizationMemberResponse,
} from '../../../api/types';

interface OrganizationSettingsFormValues {
  name: string;
  description: string;
}

const ORG_ROLE_COLORS: Record<string, string> = {
  ORGANISATION_GLOBAL_ADMIN: 'red',
  ORGANISATION_ADMIN: 'orange',
  ORGANISATION_READER: 'blue',
};

const orgRoleLabel = (role: string): string => {
  const labels: Record<string, string> = {
    ORGANISATION_GLOBAL_ADMIN: 'Global Admin',
    ORGANISATION_ADMIN: 'Admin',
    ORGANISATION_READER: 'Reader',
  };
  return labels[role] || role;
};

interface OrganizationSettingsPanelProps {
  isOrgAdmin: boolean;
}

export const OrganizationSettingsPanel: FC<OrganizationSettingsPanelProps> = ({ isOrgAdmin }) => {
  const { t } = useTranslation('settings');
  const { t: tCommon } = useTranslation('common');
  const { apiClient, organization } = useIdentity();

  const [orgDetails, setOrgDetails] = useState<OrganizationResponse | null>(null);
  const [members, setMembers] = useState<OrganizationMemberResponse[]>([]);
  const [isLoadingOrg, setIsLoadingOrg] = useState(false);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const orgForm = useForm<OrganizationSettingsFormValues>({
    initialValues: {
      name: '',
      description: '',
    },
    validate: {
      name: (value) => {
        if (!value || value.trim().length === 0) {
          return tCommon('validation.required', { field: tCommon('name') });
        }
        return null;
      },
    },
  });

  const fetchOrgDetails = useCallback(async () => {
    if (!apiClient || !organization) return;
    setIsLoadingOrg(true);
    try {
      const data = await apiClient.getOrganization(organization.id);
      setOrgDetails(data);
      orgForm.setValues({
        name: data.name || '',
        description: data.description || '',
      });
      orgForm.resetDirty({
        name: data.name || '',
        description: data.description || '',
      });
    } catch {
      // handled by API client
    } finally {
      setIsLoadingOrg(false);
    }
  }, [apiClient, organization]);

  const fetchMembers = useCallback(async () => {
    if (!apiClient || !organization) return;
    setIsLoadingMembers(true);
    try {
      const data = await apiClient.listOrganizationMembers(organization.id);
      setMembers(data.members);
    } catch {
      // handled by API client
    } finally {
      setIsLoadingMembers(false);
    }
  }, [apiClient, organization]);

  useEffect(() => {
    fetchOrgDetails();
    fetchMembers();
  }, [fetchOrgDetails, fetchMembers]);

  const handleSaveOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiClient || !organization) return;

    setIsSaving(true);
    try {
      await apiClient.updateOrganization(organization.id, {
        name: orgForm.values.name.trim(),
        description: orgForm.values.description?.trim() || undefined,
      });
      await fetchOrgDetails();
    } catch {
      // handled by API client
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveMemberRole = async (principalId: string, principalType: string, role: string) => {
    if (!apiClient || !organization) return;

    try {
      await apiClient.deleteOrganizationMember(organization.id, {
        principal_id: principalId,
        principal_type: principalType as 'IDENTITY_USER' | 'IDENTITY_GROUP' | 'CUSTOM_GROUP',
        role: role as typeof OrganizationRoleEnum[keyof typeof OrganizationRoleEnum],
      });
      await fetchMembers();
    } catch {
      // handled by API client
    }
  };

  if (!organization) {
    return (
      <Center py="xl">
        <Text c="dimmed">{t('noOrganization')}</Text>
      </Center>
    );
  }

  if (isLoadingOrg) {
    return (
      <Center py="xl">
        <Loader size="sm" />
      </Center>
    );
  }

  return (
    <Stack gap="lg">
      <Paper p="lg" withBorder>
        <form onSubmit={handleSaveOrg}>
          <Stack gap="md">
            <Title order={4}>{t('organizationInfo')}</Title>
            <TextInput
              label={tCommon('name')}
              placeholder={tCommon('enterName')}
              required
              disabled={!isOrgAdmin}
              {...orgForm.getInputProps('name')}
            />
            <Textarea
              label={tCommon('description')}
              placeholder={tCommon('optionalDescription')}
              minRows={3}
              disabled={!isOrgAdmin}
              {...orgForm.getInputProps('description')}
            />
            {orgDetails && (
              <Group gap="lg">
                <Text size="sm" c="dimmed">
                  {t('orgSlug')}: <Text span fw={500}>{orgDetails.slug}</Text>
                </Text>
                <Text size="sm" c="dimmed">
                  {t('orgSubscription')}: <Badge size="sm" variant="light">{orgDetails.subscription_tier}</Badge>
                </Text>
              </Group>
            )}
            {isOrgAdmin && (
              <Group justify="flex-end">
                <Button
                  type="submit"
                  loading={isSaving}
                  disabled={!orgForm.isDirty()}
                >
                  {tCommon('save')}
                </Button>
              </Group>
            )}
          </Stack>
        </form>
      </Paper>

      {isOrgAdmin && (
        <Paper p="lg" withBorder>
          <Stack gap="md">
            <Title order={4}>{t('organizationMembers')}</Title>
            <Alert icon={<IconInfoCircle size={16} />} color="blue" variant="light">
              <Text size="sm">{t('orgMembersHint')}</Text>
            </Alert>
            {isLoadingMembers ? (
              <Center py="md">
                <Loader size="sm" />
              </Center>
            ) : members.length === 0 ? (
              <Text size="sm" c="dimmed">{t('noOrgMembers')}</Text>
            ) : (
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>{tCommon('name')}</Table.Th>
                    <Table.Th>{t('principalType')}</Table.Th>
                    <Table.Th>{t('roles')}</Table.Th>
                    <Table.Th w={60} />
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {members.map((member) => (
                    <Table.Tr key={member.principal_id}>
                      <Table.Td>
                        <Text size="sm" fw={500}>
                          {member.display_name || member.principal_name || member.principal_id}
                        </Text>
                        {member.mail && (
                          <Text size="xs" c="dimmed">{member.mail}</Text>
                        )}
                      </Table.Td>
                      <Table.Td>
                        <Badge size="sm" variant="light">
                          {member.principal_type}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Group gap={4}>
                          {member.roles.map((r) => (
                            <Badge
                              key={r.id}
                              size="sm"
                              color={ORG_ROLE_COLORS[r.role] || 'gray'}
                              variant="light"
                            >
                              {orgRoleLabel(r.role)}
                            </Badge>
                          ))}
                        </Group>
                      </Table.Td>
                      <Table.Td>
                        <Menu position="bottom-end" withinPortal>
                          <Menu.Target>
                            <ActionIcon variant="subtle" size="sm">
                              <IconDots size={16} />
                            </ActionIcon>
                          </Menu.Target>
                          <Menu.Dropdown>
                            {member.roles.map((r) => (
                              <Menu.Item
                                key={r.id}
                                color="red"
                                leftSection={<IconTrash size={14} />}
                                onClick={() => handleRemoveMemberRole(member.principal_id, member.principal_type, r.role)}
                              >
                                {tCommon('remove')} {orgRoleLabel(r.role)}
                              </Menu.Item>
                            ))}
                          </Menu.Dropdown>
                        </Menu>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            )}
          </Stack>
        </Paper>
      )}
    </Stack>
  );
};
