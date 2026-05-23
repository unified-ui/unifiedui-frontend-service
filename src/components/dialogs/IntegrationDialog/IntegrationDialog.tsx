import type { FC } from 'react';
import { useMemo } from 'react';
import {
  Modal,
  Tabs,
  Stack,
  Text,
  TextInput,
  CopyButton,
  ActionIcon,
  Tooltip,
  Group,
  Box,
  Alert,
} from '@mantine/core';
import { IconCopy, IconCheck, IconPlug, IconAlertCircle } from '@tabler/icons-react';
import classes from './IntegrationDialog.module.css';

export interface IntegrationDialogProps {
  opened: boolean;
  onClose: () => void;
  tenantId: string;
  agentId: string;
  defaultTab?: 'post' | 'put';
  allowApiKeys?: boolean;
}

function buildPostSampleJson(agentId: string): string {
  return JSON.stringify(
    {
      workflowId: agentId,
      referenceId: 'ext-execution-12345',
      referenceName: 'My Workflow Run',
      referenceMetadata: {
        source: 'n8n',
        workflow_name: 'My Automation',
      },
      logs: ['Workflow started', 'Step 1 completed'],
      nodes: [
        {
          id: 'node-1',
          name: 'Start',
          type: 'chain',
          status: 'completed',
          referenceId: 'ext-node-001',
          startAt: '2026-02-07T10:00:00Z',
          endAt: '2026-02-07T10:00:01Z',
          duration: 1.0,
          data: {
            input: {
              text: 'Trigger received',
              metadata: { trigger_type: 'webhook' },
            },
            output: {
              text: 'Workflow started successfully',
            },
          },
          metadata: {
            node_version: '1.0',
          },
          nodes: [],
        },
      ],
    },
    null,
    2
  );
}

function buildPutSampleJson(_agentId: string): string {
  return JSON.stringify(
    {
      type: 'N8N',
      executionId: 'ext-execution-12345',
      sessionId: 'optional-session-id',
    },
    null,
    2
  );
}

const CodeBlock: FC<{ code: string }> = ({ code }) => (
  <div className={classes.codeBlock}>
    <div className={classes.copyCodeButtonWrapper}>
      <CopyButton value={code} timeout={2000}>
        {({ copied, copy }) => (
          <Tooltip label={copied ? 'Copied!' : 'Copy JSON'}>
            <ActionIcon
              variant="subtle"
              color={copied ? 'teal' : 'gray'}
              size="sm"
              onClick={copy}
            >
              {copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
            </ActionIcon>
          </Tooltip>
        )}
      </CopyButton>
    </div>
    <div className={classes.codeContent}>{code}</div>
  </div>
);

const AUTH_HEADER_KEY = 'X-Unified-UI-Workflow-API-Key';

const EndpointField: FC<{ value: string }> = ({ value }) => (
  <TextInput
    label="Endpoint"
    value={value}
    readOnly
    styles={{ input: { fontFamily: 'monospace', cursor: 'default', fontSize: 'var(--font-size-xs)' } }}
    rightSection={
      <CopyButton value={value} timeout={2000}>
        {({ copied, copy }) => (
          <Tooltip label={copied ? 'Copied!' : 'Copy'}>
            <ActionIcon variant="subtle" color={copied ? 'teal' : 'gray'} size="sm" onClick={copy}>
              {copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
            </ActionIcon>
          </Tooltip>
        )}
      </CopyButton>
    }
  />
);

const BEARER_HEADER_KEY = 'Authorization';
const BEARER_HEADER_VALUE = 'Bearer <your-access-token>';

const AuthHeaderHint: FC<{ allowApiKeys?: boolean }> = ({ allowApiKeys = true }) => (
  <Stack gap="xs">
    <Group gap={4} align="center">
      <Text size="sm" c="dimmed">
        Add header
      </Text>
      <CopyButton value={BEARER_HEADER_KEY} timeout={2000}>
        {({ copied, copy }) => (
          <Tooltip label={copied ? 'Copied!' : 'Copy header name'}>
            <Text
              size="sm"
              ff="monospace"
              fw={500}
              className={classes.copyableHeaderKey}
              onClick={copy}
              style={{ cursor: 'pointer' }}
            >
              {BEARER_HEADER_KEY}
              <IconCopy size={12} style={{ marginLeft: 4, verticalAlign: 'middle', opacity: 0.5 }} />
            </Text>
          </Tooltip>
        )}
      </CopyButton>
      <Text size="sm" c="dimmed">
        with value
      </Text>
      <Text size="sm" ff="monospace" fw={500} c="dimmed">
        {BEARER_HEADER_VALUE}
      </Text>
    </Group>

    {allowApiKeys ? (
      <Group gap={4} align="center">
        <Text size="sm" c="dimmed">
          Or add header
        </Text>
        <CopyButton value={AUTH_HEADER_KEY} timeout={2000}>
          {({ copied, copy }) => (
            <Tooltip label={copied ? 'Copied!' : 'Copy header name'}>
              <Text
                size="sm"
                ff="monospace"
                fw={500}
                className={classes.copyableHeaderKey}
                onClick={copy}
                style={{ cursor: 'pointer' }}
              >
                {AUTH_HEADER_KEY}
                <IconCopy size={12} style={{ marginLeft: 4, verticalAlign: 'middle', opacity: 0.5 }} />
              </Text>
            </Tooltip>
          )}
        </CopyButton>
        <Text size="sm" c="dimmed">
          with your primary or secondary key.
        </Text>
      </Group>
    ) : (
      <Alert icon={<IconAlertCircle size={16} />} color="yellow" variant="light" py="xs">
        API key authentication is disabled for this agent. Use a Bearer token via a service principal.
      </Alert>
    )}
  </Stack>
);

export const IntegrationDialog: FC<IntegrationDialogProps> = ({
  opened,
  onClose,
  tenantId,
  agentId,
  defaultTab = 'post',
  allowApiKeys = true,
}) => {
  const agentServiceHost = import.meta.env.VITE_AGENT_SERVICE_URL || 'http://localhost:8085';
  const postEndpoint = `${agentServiceHost}/api/v1/agent-service/tenants/${tenantId}/traces`;
  const putEndpoint = `${agentServiceHost}/api/v1/agent-service/tenants/${tenantId}/workflows/${agentId}/traces/import`;

  const postJson = useMemo(() => buildPostSampleJson(agentId), [agentId]);
  const putJson = useMemo(() => buildPutSampleJson(agentId), [agentId]);

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="sm">
          <Box className={classes.titleIcon}>
            <IconPlug size={20} />
          </Box>
          <Text fw={600} size="lg">
            Integrate Workflow
          </Text>
        </Group>
      }
      size="xl"
      centered
    >
      <Tabs defaultValue={defaultTab}>
        <Tabs.List className={classes.tabsList}>
          <Tabs.Tab value="post" className={classes.tab}>
            POST Payload
          </Tabs.Tab>
          <Tabs.Tab value="put" className={classes.tab}>
            PUT Import
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="post" className={classes.tabPanel}>
          <div className={classes.tabPanelScrollArea}>
            <Stack gap="lg">
              <Text size="sm" c="dimmed">
                Use the POST endpoint to send custom traces to Unified UI. The payload must conform to the
                trace schema. Use this method when native import is not available for your agent platform
                (e.g. custom agents built with LangChain, LangGraph, various workflow automation platforms, etc.).
                Whenever possible, prefer using the PUT Import method instead, as it automatically normalizes
                and optimizes trace data.
              </Text>
              <EndpointField value={postEndpoint} />
              <AuthHeaderHint allowApiKeys={allowApiKeys} />
              <div>
                <Text size="xs" c="dimmed" tt="uppercase" fw={500} style={{ letterSpacing: '0.5px', fontSize: 11, marginBottom: 'var(--spacing-xs)' }}>Sample Payload</Text>
                <CodeBlock code={postJson} />
              </div>
            </Stack>
          </div>
        </Tabs.Panel>

        <Tabs.Panel value="put" className={classes.tabPanel}>
          <div className={classes.tabPanelScrollArea}>
            <Stack gap="lg">
              <Text size="sm" c="dimmed">
                Use the PUT endpoint to import traces from supported platforms by providing the external
                execution ID and platform type. Unified UI will fetch the trace data directly from the
                platform and transform it into an optimized, normalized structure. Simply send the execution
                ID and type to the endpoint (see sample below).
              </Text>
              <EndpointField value={putEndpoint} />
              <AuthHeaderHint allowApiKeys={allowApiKeys} />
              <div>
                <Text size="xs" c="dimmed" tt="uppercase" fw={500} style={{ letterSpacing: '0.5px', fontSize: 11, marginBottom: 'var(--spacing-xs)' }}>Sample Payload</Text>
                <CodeBlock code={putJson} />
              </div>
            </Stack>
          </div>
        </Tabs.Panel>
      </Tabs>
    </Modal>
  );
};
