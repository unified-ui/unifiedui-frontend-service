import type { FC } from 'react';
import { useState } from 'react';
import { Modal, TextInput, Textarea, Button, Stack, Group, Box } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useIdentity } from '../../contexts';
import { GenerateWithAIButton } from '../common/GenerateWithAIButton';

interface CreateCustomGroupDialogProps {
  opened: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface FormValues {
  name: string;
  description: string;
}

export const CreateCustomGroupDialog: FC<CreateCustomGroupDialogProps> = ({
  opened,
  onClose,
  onSuccess,
}) => {
  const { apiClient, selectedTenant } = useIdentity();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    initialValues: {
      name: '',
      description: '',
    },
    validate: {
      name: (value) => {
        if (!value.trim()) return 'Name is required';
        if (value.length > 255) return 'Name must be less than 255 characters';
        return null;
      },
      description: (value) => {
        if (value && value.length > 2000) return 'Description must be less than 2000 characters';
        return null;
      },
    },
  });

  const handleSubmit = form.onSubmit(async (values) => {
    if (!apiClient || !selectedTenant) return;

    setIsSubmitting(true);
    try {
      await apiClient.createCustomGroup(selectedTenant.id, {
        name: values.name.trim(),
        description: values.description.trim() || undefined,
      });
      form.reset();
      onClose();
      onSuccess?.();
    } catch {
      // Error is handled by the API client
    } finally {
      setIsSubmitting(false);
    }
  });

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title="Create Custom Group"
      size="lg"
      centered
    >
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          <TextInput
            label="Name"
            placeholder="Enter group name"
            required
            data-autofocus
            {...form.getInputProps('name')}
          />
          <Box pos="relative">
            <Textarea
              label="Description"
              placeholder="Enter group description (optional)"
              minRows={3}
              {...form.getInputProps('description')}
            />
            <Box pos="absolute" top={0} right={0}>
              <GenerateWithAIButton
                entityType="custom_group"
                entityName={form.values.name}
                existingDescription={form.values.description || undefined}
                onGenerated={(desc: string) => form.setFieldValue('description', desc)}
              />
            </Box>
          </Box>
          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting}>
              Create
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
};
