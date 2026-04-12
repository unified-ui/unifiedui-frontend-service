import type { FC } from 'react';
import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Modal,
  Stack,
  TextInput,
  Text,
  Group,
  Badge,
  ScrollArea,
  UnstyledButton,
  Loader,
  Center,
  Alert,
} from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { IconSearch, IconPlayerPlay, IconPlayerPause } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import type { N8NWorkflowInfo } from '../../../api/types';
import { useN8NWorkflows } from '../../../hooks';
import classes from './N8NWorkflowBrowserDialog.module.css';

interface N8NWorkflowBrowserDialogProps {
  opened: boolean;
  onClose: () => void;
  host: string;
  credentialId: string;
  onSelect: (workflow: N8NWorkflowInfo) => void;
}

export const N8NWorkflowBrowserDialog: FC<N8NWorkflowBrowserDialogProps> = ({
  opened,
  onClose,
  host,
  credentialId,
  onSelect,
}) => {
  const { t } = useTranslation('common');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery] = useDebouncedValue(searchQuery, 300);
  const { workflows, isLoading, fetchWorkflows } = useN8NWorkflows();

  useEffect(() => {
    if (opened && host && credentialId) {
      fetchWorkflows(host, credentialId);
    }
  }, [opened, host, credentialId, fetchWorkflows]);

  const handleClose = useCallback(() => {
    setSearchQuery('');
    onClose();
  }, [onClose]);

  const filteredWorkflows = useMemo(() => {
    if (!debouncedQuery.trim()) return workflows;
    const term = debouncedQuery.toLowerCase();
    return workflows.filter(
      (wf) =>
        wf.name.toLowerCase().includes(term) || wf.id.toLowerCase().includes(term),
    );
  }, [workflows, debouncedQuery]);

  const handleSelect = useCallback(
    (workflow: N8NWorkflowInfo) => {
      onSelect(workflow);
      handleClose();
    },
    [onSelect, handleClose],
  );

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title="Browse n8n Workflows"
      size="lg"
    >
      <Stack gap="md">
        {!host || !credentialId ? (
          <Alert color="yellow">
            {t('selectCredentialFirst', 'Please select a credential and enter a host URL first.')}
          </Alert>
        ) : (
          <>
            <TextInput
              placeholder="Search workflows..."
              leftSection={<IconSearch size={16} />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.currentTarget.value)}
            />

            {isLoading ? (
              <Center py="xl">
                <Loader size="sm" />
              </Center>
            ) : filteredWorkflows.length === 0 ? (
              <Center py="xl">
                <Text c="dimmed" size="sm">
                  {workflows.length === 0
                    ? 'No workflows found. Check host URL and credentials.'
                    : 'No workflows match your search.'}
                </Text>
              </Center>
            ) : (
              <ScrollArea.Autosize mah={400}>
                <Stack gap="xs">
                  {filteredWorkflows.map((wf) => (
                    <UnstyledButton
                      key={wf.id}
                      className={classes.workflowItem}
                      onClick={() => handleSelect(wf)}
                    >
                      <Group justify="space-between" wrap="nowrap">
                        <Stack gap={2}>
                          <Text size="sm" fw={500} lineClamp={1}>
                            {wf.name}
                          </Text>
                          <Text size="xs" c="dimmed" lineClamp={1}>
                            ID: {wf.id}
                          </Text>
                        </Stack>
                        <Badge
                          size="sm"
                          color={wf.active ? 'green' : 'gray'}
                          variant="light"
                          leftSection={
                            wf.active ? (
                              <IconPlayerPlay size={10} />
                            ) : (
                              <IconPlayerPause size={10} />
                            )
                          }
                        >
                          {wf.active ? 'Active' : 'Inactive'}
                        </Badge>
                      </Group>
                    </UnstyledButton>
                  ))}
                </Stack>
              </ScrollArea.Autosize>
            )}

            <Text size="xs" c="dimmed" ta="right">
              {filteredWorkflows.length} of {workflows.length} workflows
            </Text>
          </>
        )}
      </Stack>
    </Modal>
  );
};
