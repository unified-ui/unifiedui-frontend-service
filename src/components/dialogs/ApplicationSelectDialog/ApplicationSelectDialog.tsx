import type { FC } from 'react';
import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Modal,
  Stack,
  TextInput,
  Text,
  Group,
  ScrollArea,
  UnstyledButton,
  ActionIcon,
  Loader,
  Center,
} from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { IconSearch, IconApps, IconRefresh } from '@tabler/icons-react';
import type { QuickListItemResponse } from '../../../api/types';
import { useSidebarData } from '../../../contexts/SidebarDataContext';
import classes from './ApplicationSelectDialog.module.css';

interface ApplicationSelectDialogProps {
  opened: boolean;
  onClose: () => void;
  onSelect: (application: QuickListItemResponse) => void;
}

export const ApplicationSelectDialog: FC<ApplicationSelectDialogProps> = ({
  opened,
  onClose,
  onSelect,
}) => {
  const { t } = useTranslation();
  const { applications, loadingStates, fetchApplications, refreshApplications, hasFetched } = useSidebarData();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery] = useDebouncedValue(searchQuery, 300);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (opened && !hasFetched('applications')) {
      fetchApplications();
    }
  }, [opened, hasFetched, fetchApplications]);

  useEffect(() => {
    if (!opened) {
      setSearchQuery('');
    }
  }, [opened]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshApplications();
    setIsRefreshing(false);
  };

  const filteredApplications = useMemo(() => {
    if (!debouncedQuery.trim()) return applications;
    
    const query = debouncedQuery.toLowerCase();
    return applications.filter(app => 
      app.name.toLowerCase().includes(query)
    );
  }, [debouncedQuery, applications]);

  const handleSelect = (app: QuickListItemResponse) => {
    onSelect(app);
    onClose();
  };

  const isLoading = loadingStates.applications && !hasFetched('applications');

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={t('conversations:selectApplication')}
      size="md"
      centered
    >
      <Stack gap="md">
        <Group gap="xs">
          <TextInput
            placeholder={t('conversations:searchApplications')}
            leftSection={<IconSearch size={16} />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ flex: 1 }}
          />
          <ActionIcon
            variant="subtle"
            onClick={handleRefresh}
            loading={isRefreshing}
            title={t('common:refresh')}
          >
            <IconRefresh size={18} />
          </ActionIcon>
        </Group>

        <ScrollArea.Autosize mah={400}>
          {isLoading ? (
            <Center py="xl">
              <Loader size="sm" />
            </Center>
          ) : filteredApplications.length === 0 ? (
            <Center py="xl">
              <Stack align="center" gap="xs">
                <IconApps size={32} style={{ opacity: 0.5 }} />
                <Text size="sm" c="dimmed">
                  {searchQuery ? t('conversations:noApplicationsFound') : t('conversations:noApplicationsAvailable')}
                </Text>
              </Stack>
            </Center>
          ) : (
            <Stack gap={4}>
              {filteredApplications.map((app) => (
                <UnstyledButton
                  key={app.id}
                  className={classes.applicationItem}
                  onClick={() => handleSelect(app)}
                >
                  <Group gap="sm" wrap="nowrap">
                    <IconApps size={18} className={classes.applicationIcon} />
                    <Text size="sm" lineClamp={1}>
                      {app.name}
                    </Text>
                  </Group>
                </UnstyledButton>
              ))}
            </Stack>
          )}
        </ScrollArea.Autosize>
      </Stack>
    </Modal>
  );
};
