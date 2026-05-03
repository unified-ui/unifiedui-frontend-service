import type { FC } from 'react';
import { useEffect, useState } from 'react';
import { MultiSelect } from '@mantine/core';
import { useIdentity } from '../../../contexts';
import type { QuickListItemResponse } from '../../../api/types';

interface AnalyticsAgentPickerProps {
  value: string[];
  onChange: (ids: string[]) => void;
  placeholder?: string;
  label?: string;
  resource?: 'chat-agents' | 'workflows';
}

export const AnalyticsAgentPicker: FC<AnalyticsAgentPickerProps> = ({
  value,
  onChange,
  placeholder = 'All agents',
  label,
  resource = 'chat-agents',
}) => {
  const { selectedTenant, apiClient } = useIdentity();
  const [options, setOptions] = useState<{ value: string; label: string }[]>([]);

  useEffect(() => {
    const tenantId = selectedTenant?.id;
    if (!tenantId || !apiClient) return;
    let cancelled = false;
    const load = async (): Promise<void> => {
      try {
        const fn = resource === 'chat-agents' ? apiClient.listChatAgents : apiClient.listWorkflows;
        const result = await fn.call(apiClient, tenantId, { view: 'quick-list' });
        if (cancelled) return;
        const items = result as QuickListItemResponse[];
        setOptions(
          items.map((item) => ({
            value: item.id,
            label: item.name || item.id,
          }))
        );
      } catch {
        if (!cancelled) setOptions([]);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [selectedTenant?.id, apiClient, resource]);

  return (
    <MultiSelect
      size="xs"
      label={label}
      placeholder={placeholder}
      data={options}
      value={value}
      onChange={onChange}
      searchable
      clearable
      nothingFoundMessage="No matches"
      maw={320}
    />
  );
};
