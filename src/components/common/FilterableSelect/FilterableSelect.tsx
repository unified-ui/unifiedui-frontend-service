import type { ComboboxProps, MantineSize } from '@mantine/core';
import type { CSSProperties, FC, ReactNode } from 'react';
import { useMemo, useState } from 'react';
import { Combobox, Input, InputBase, ScrollArea, useCombobox } from '@mantine/core';

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface FilterableSelectProps {
  label?: string;
  placeholder?: string;
  description?: string;
  required?: boolean;
  withAsterisk?: boolean;
  data: (string | SelectOption)[];
  value?: string | null;
  onChange?: (value: string | null) => void;
  onBlur?: () => void;
  error?: ReactNode;
  disabled?: boolean;
  clearable?: boolean;
  leftSection?: ReactNode;
  rightSection?: ReactNode;
  nothingFoundMessage?: string;
  style?: CSSProperties;
  className?: string;
  size?: MantineSize;
  filterPlaceholder?: string;
  onFilterChange?: (filter: string) => void;
  comboboxProps?: Partial<Omit<ComboboxProps, 'store' | 'onOptionSubmit'>>;
}

export const FilterableSelect: FC<FilterableSelectProps> = ({
  label,
  placeholder,
  description,
  required,
  withAsterisk,
  data,
  value,
  onChange,
  onBlur,
  error,
  disabled,
  clearable,
  leftSection,
  rightSection,
  nothingFoundMessage = 'No results found',
  style,
  className,
  size,
  filterPlaceholder = 'Search...',
  onFilterChange,
  comboboxProps,
}) => {
  const [filter, setFilter] = useState('');
  const combobox = useCombobox({
    onDropdownClose: () => {
      combobox.resetSelectedOption();
      setFilter('');
    },
    onDropdownOpen: () => {
      combobox.focusSearchInput();
    },
  });

  const normalizedData = useMemo(
    () => data.map((item) => (typeof item === 'string' ? { value: item, label: item } : item)),
    [data],
  );

  const filteredOptions = useMemo(() => {
    if (onFilterChange) return normalizedData;
    const trimmed = filter.toLowerCase().trim();
    if (!trimmed) return normalizedData;
    return normalizedData.filter((item) => item.label.toLowerCase().includes(trimmed));
  }, [normalizedData, filter, onFilterChange]);

  const selectedOption = normalizedData.find((item) => item.value === value);

  const handleFilterChange = (val: string) => {
    setFilter(val);
    onFilterChange?.(val);
  };

  const handleOptionSubmit = (val: string) => {
    onChange?.(val);
    combobox.closeDropdown();
  };

  const handleClear = () => {
    onChange?.(null);
    setFilter('');
  };

  const showClearButton = clearable && value && !disabled && !rightSection;

  return (
    <Combobox store={combobox} onOptionSubmit={handleOptionSubmit} {...comboboxProps}>
      <Combobox.Target>
        <InputBase
          label={label}
          description={description}
          required={required}
          withAsterisk={withAsterisk}
          error={error}
          component="button"
          type="button"
          pointer
          disabled={disabled}
          style={style}
          className={className}
          size={size}
          leftSection={leftSection}
          rightSection={
            rightSection ??
            (showClearButton ? (
              <Combobox.ClearButton onClear={handleClear} />
            ) : (
              <Combobox.Chevron />
            ))
          }
          rightSectionPointerEvents={showClearButton ? 'all' : 'none'}
          onClick={() => {
            if (!disabled) combobox.toggleDropdown();
          }}
          onBlur={onBlur}
        >
          {selectedOption ? selectedOption.label : <Input.Placeholder>{placeholder}</Input.Placeholder>}
        </InputBase>
      </Combobox.Target>

      <Combobox.Dropdown>
        <Combobox.Search
          value={filter}
          onChange={(event) => handleFilterChange(event.currentTarget.value)}
          placeholder={filterPlaceholder}
          styles={{ input: { marginLeft: -2 } }}
        />
        <Combobox.Options>
          <ScrollArea.Autosize mah={200}>
            {filteredOptions.length > 0 ? (
              filteredOptions.map((item) => (
                <Combobox.Option
                  value={item.value}
                  key={item.value}
                  disabled={item.disabled}
                  active={item.value === value}
                >
                  {item.label}
                </Combobox.Option>
              ))
            ) : (
              <Combobox.Empty>{nothingFoundMessage}</Combobox.Empty>
            )}
          </ScrollArea.Autosize>
        </Combobox.Options>
      </Combobox.Dropdown>
    </Combobox>
  );
};
