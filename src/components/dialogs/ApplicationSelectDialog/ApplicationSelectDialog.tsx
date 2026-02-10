import type { FC } from 'react';
import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Modal,
  Stack,
  TextInput,
  Text,
  Group,
  UnstyledButton,
  ActionIcon,
  Loader,
  Center,
  Paper,
  Box,
} from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { IconSearch, IconRefresh, IconApps } from '@tabler/icons-react';
import type { QuickListItemResponse } from '../../../api/types';
import { useSidebarData } from '../../../contexts/SidebarDataContext';
import { EntityAvatar } from '../../common';
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
      title={
        <Group gap="sm">
          <IconApps size={24} />
          <Text fw={600} size="lg">{t('conversations:selectApplication')}</Text>
        </Group>
      }
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

        <Box className={classes.listContainer}>
          <div className={classes.scrollArea}>
            {isLoading ? (
              <Center h={300}>
                <Loader size="sm" />
              </Center>
            ) : filteredApplications.length === 0 ? (
              <Center h={300} className={classes.emptyState}>
                <IconApps size={40} className={classes.emptyIcon} />
                <Text size="sm" c="dimmed" mt="sm">
                  {searchQuery ? t('conversations:noApplicationsFound') : t('conversations:noApplicationsAvailable')}
                </Text>
              </Center>
            ) : (
              <Stack gap="xs">
                {filteredApplications.map((app) => (
                  <UnstyledButton
                    key={app.id}
                    className={classes.applicationItem}
                    onClick={() => handleSelect(app)}
                  >
                    <Paper className={classes.applicationPaper} p="sm" radius="md" withBorder>
                      <Group gap="sm" wrap="nowrap">
                        <EntityAvatar entityType="application" size="sm" />
                        <Text size="sm" fw={500} lineClamp={1} style={{ flex: 1 }}>
                          {app.name}
                        </Text>
                      </Group>
                    </Paper>
                  </UnstyledButton>
                ))}
              </Stack>
            )}
          </div>
        </Box>
      </Stack>
    </Modal>
  );
};
