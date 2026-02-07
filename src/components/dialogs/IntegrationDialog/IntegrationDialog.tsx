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
} from '@mantine/core';
import { IconCopy, IconCheck } from '@tabler/icons-react';
import classes from './IntegrationDialog.module.css';

export interface IntegrationDialogProps {
  opened: boolean;
  onClose: () => void;
  /** Tenant ID for constructing URLs */
  tenantId: string;
  /** Autonomous agent ID for sample payloads */
  agentId: string;
  /** Which tab to show by default */
  defaultTab?: 'post' | 'put';
}

function buildPostSampleJson(agentId: string): string {
  return JSON.stringify(
    {
      autonomousAgentId: agentId,
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

function buildPutSampleJson(agentId: string): string {
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
    <CopyButton value={code} timeout={2000}>
      {({ copied, copy }) => (
        <Tooltip label={copied ? 'Copied!' : 'Copy JSON'}>
          <ActionIcon
            variant="subtle"
            color={copied ? 'teal' : 'gray'}
            size="sm"
            onClick={copy}
            className={classes.copyCodeButton}
          >
            {copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
          </ActionIcon>
        </Tooltip>
      )}
    </CopyButton>
    <div className={classes.codeContent}>{code}</div>
  </div>
);

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

export const IntegrationDialog: FC<IntegrationDialogProps> = ({
  opened,
  onClose,
  tenantId,
  agentId,
  defaultTab = 'post',
}) => {
  const baseUrl = window.location.origin;
  const postEndpoint = `${baseUrl}/api/v1/agent-service/tenants/${tenantId}/traces`;
  const putEndpoint = `${baseUrl}/api/v1/agent-service/tenants/${tenantId}/autonomous-agents/${agentId}/traces/import`;

  const postJson = useMemo(() => buildPostSampleJson(agentId), [agentId]);
  const putJson = useMemo(() => buildPutSampleJson(agentId), [agentId]);

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Autonomous Agent integrieren"
      size="lg"
      styles={{
        content: { display: 'flex', flexDirection: 'column', maxHeight: 'calc(100vh - 120px)' },
        body: { flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
      }}
    >
      <Tabs defaultValue={defaultTab} className={classes.tabs}>
        <Tabs.List className={classes.tabsList}>
          <Tabs.Tab value="post" className={classes.tab}>
            POST Payload
          </Tabs.Tab>
          <Tabs.Tab value="put" className={classes.tab}>
            Import Traces
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="post" className={classes.tabPanel}>
          <Stack gap="md">
            <Text className={classes.sampleTitle}>Sample Payload</Text>
            <EndpointField value={postEndpoint} />
            <CodeBlock code={postJson} />
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="put" className={classes.tabPanel}>
          <Stack gap="md">
            <Text className={classes.sampleTitle}>Sample Payload</Text>
            <EndpointField value={putEndpoint} />
            <CodeBlock code={putJson} />
          </Stack>
        </Tabs.Panel>
      </Tabs>
    </Modal>
  );
};
