import { useState } from 'react';
import type { FC } from 'react';
import {
  Modal,
  Stack,
  TextInput,
  Button,
  Alert,
  Group,
} from '@mantine/core';
import { IconBug } from '@tabler/icons-react';
import { useAuth } from '../../auth';

interface DebugBackdoorDialogProps {
  opened: boolean;
  onClose: () => void;
}

export const DebugBackdoorDialog: FC<DebugBackdoorDialogProps> = ({ opened, onClose }) => {
  const { loginWithDebugBackdoor } = useAuth();
  const [userId, setUserId] = useState('copilot-debug');
  const [upn, setUpn] = useState('copilot-debug@example.com');
  const [name, setName] = useState('Copilot Debug');
  const [groups, setGroups] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async () => {
    setError(null);
    setBusy(true);
    try {
      await loginWithDebugBackdoor({
        userId: userId.trim(),
        upn: upn.trim(),
        name: name.trim(),
        groups: groups
          .split(',')
          .map((g) => g.trim())
          .filter(Boolean),
      });
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          <IconBug size={20} />
          <span>Debug Backdoor Login</span>
        </Group>
      }
      centered
    >
      <Stack gap="md">
        <Alert color="yellow" variant="light">
          Synthesises a backend identity. DEV / SELF-HOSTED only — never use in production.
        </Alert>
        <TextInput
          label="User ID (oid)"
          value={userId}
          onChange={(e) => setUserId(e.currentTarget.value)}
          required
        />
        <TextInput
          label="UPN / Email"
          value={upn}
          onChange={(e) => setUpn(e.currentTarget.value)}
          required
        />
        <TextInput
          label="Display Name"
          value={name}
          onChange={(e) => setName(e.currentTarget.value)}
        />
        <TextInput
          label="Groups (comma-separated)"
          value={groups}
          onChange={(e) => setGroups(e.currentTarget.value)}
          placeholder="group-a, group-b"
        />
        {error && <Alert color="red">{error}</Alert>}
        <Group justify="flex-end">
          <Button variant="subtle" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button color="yellow" onClick={handleSubmit} loading={busy}>
            Sign in as debug user
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};
