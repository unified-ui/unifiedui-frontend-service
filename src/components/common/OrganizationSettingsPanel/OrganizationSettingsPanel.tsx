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
  Loader,
  Center,
  Badge,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useTranslation } from 'react-i18next';
import { useIdentity } from '../../../contexts';
import type {
  OrganizationResponse,
} from '../../../api/types';

interface OrganizationSettingsFormValues {
  name: string;
  description: string;
}

interface OrganizationSettingsPanelProps {
  isOrgAdmin: boolean;
}

export const OrganizationSettingsPanel: FC<OrganizationSettingsPanelProps> = ({ isOrgAdmin }) => {
  const { t } = useTranslation('settings');
  const { t: tCommon } = useTranslation('common');
  const { apiClient, organization } = useIdentity();

  const [orgDetails, setOrgDetails] = useState<OrganizationResponse | null>(null);
  const [isLoadingOrg, setIsLoadingOrg] = useState(false);
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

  useEffect(() => {
    fetchOrgDetails();
  }, [fetchOrgDetails]);

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
                <Text component="span" size="sm" c="dimmed">
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
    </Stack>
  );
};
