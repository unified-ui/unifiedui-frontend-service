import { type FC, useState, useMemo } from 'react';
import { ActionIcon, Combobox, Group, InputBase, useCombobox } from '@mantine/core';
import { IconRefresh } from '@tabler/icons-react';

export interface EndpointSuggestInputProps {
  label: string;
  placeholder?: string;
  description?: string;
  required?: boolean;
  withAsterisk?: boolean;
  suggestions: string[];
  value: string;
  onChange: (value: string) => void;
  error?: string;
  onBlur?: () => void;
  onFocus?: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const EndpointSuggestInput: FC<EndpointSuggestInputProps> = ({
  label,
  placeholder,
  description,
  required,
  withAsterisk,
  suggestions,
  value,
  onChange,
  error,
  onBlur,
  onFocus,
  onRefresh,
  isRefreshing,
}) => {
  const combobox = useCombobox({
    onDropdownClose: () => combobox.resetSelectedOption(),
  });
  const [search, setSearch] = useState('');

  const filteredOptions = useMemo(() => {
    if (!search) return suggestions;
    const term = search.toLowerCase();
    return suggestions.filter((s) => s.toLowerCase().includes(term));
  }, [suggestions, search]);

  const options = filteredOptions.map((item) => (
    <Combobox.Option value={item} key={item}>
      {item}
    </Combobox.Option>
  ));

  return (
    <Combobox
      store={combobox}
      onOptionSubmit={(val) => {
        onChange(val);
        setSearch('');
        combobox.closeDropdown();
      }}
    >
      <Combobox.Target>
        <InputBase
          label={label}
          placeholder={placeholder}
          description={description}
          required={required}
          withAsterisk={withAsterisk}
          error={error}
          rightSection={
            onRefresh ? (
              <Group gap={4} wrap="nowrap">
                <ActionIcon
                  variant="subtle"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRefresh();
                  }}
                  loading={isRefreshing}
                  aria-label="Refresh suggestions"
                >
                  <IconRefresh size={14} />
                </ActionIcon>
                <Combobox.Chevron />
              </Group>
            ) : (
              <Combobox.Chevron />
            )
          }
          rightSectionPointerEvents={onRefresh ? 'all' : 'none'}
          rightSectionWidth={onRefresh ? 60 : undefined}
          value={search || value}
          onChange={(event) => {
            const val = event.currentTarget.value;
            setSearch(val);
            onChange(val);
            combobox.openDropdown();
            combobox.updateSelectedOptionIndex();
          }}
          onClick={() => combobox.openDropdown()}
          onFocus={() => {
            combobox.openDropdown();
            onFocus?.();
          }}
          onBlur={() => {
            combobox.closeDropdown();
            setSearch('');
            onBlur?.();
          }}
        />
      </Combobox.Target>

      {suggestions.length > 0 && (
        <Combobox.Dropdown>
          <Combobox.Options>
            {options.length > 0 ? options : <Combobox.Empty>No matching suggestions</Combobox.Empty>}
          </Combobox.Options>
        </Combobox.Dropdown>
      )}
    </Combobox>
  );
};
