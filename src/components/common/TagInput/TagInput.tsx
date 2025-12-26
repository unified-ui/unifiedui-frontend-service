import { type FC, useState, useRef, useEffect, useCallback, type KeyboardEvent } from 'react';
import { Box, Text, CloseButton, Loader, Paper, Portal } from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { useIdentity } from '../../../contexts';
import classes from './TagInput.module.css';

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  label?: string;
  description?: string;
  error?: string;
  disabled?: boolean;
  maxTags?: number;
}

export const TagInput: FC<TagInputProps> = ({
  value = [],
  onChange,
  placeholder = 'Tag eingeben...',
  label,
  description,
  error,
  disabled = false,
  maxTags,
}) => {
  const { apiClient, selectedTenant } = useIdentity();
  const [inputValue, setInputValue] = useState('');
  const [debouncedInput] = useDebouncedValue(inputValue, 300);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Update dropdown position when showing
  useEffect(() => {
    if (showDropdown && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
      });
    }
  }, [showDropdown, inputValue]);

  // Use ref to track current tags value without triggering effect
  const valueRef = useRef(value);
  valueRef.current = value;

  // Track if input is focused
  const isFocusedRef = useRef(false);

  // Cache last search to optimize API calls
  const lastSearchRef = useRef<{ query: string; hadResults: boolean } | null>(null);

  // Search for tags when debounced input changes AND input is focused
  useEffect(() => {
    const searchTags = async () => {
      // Only search when input is focused and has content
      if (!isFocusedRef.current || !debouncedInput.trim() || !apiClient || !selectedTenant) {
        setSuggestions([]);
        return;
      }

      // Optimization: Skip fetch if last search was empty and current input is longer
      if (lastSearchRef.current) {
        const { query: lastQuery, hadResults: lastHadResults } = lastSearchRef.current;
        const isLonger = debouncedInput.length > lastQuery.length;
        const startsWithLast = debouncedInput.toLowerCase().startsWith(lastQuery.toLowerCase());
        
        if (!lastHadResults && isLonger && startsWithLast) {
          // User added characters to a query that had no results
          // No need to fetch again, will still be empty
          setSuggestions([]);
          setShowDropdown(false);
          return;
        }
      }

      setIsLoading(true);
      try {
        const response = await apiClient.listTags(selectedTenant.id, { limit: 10 });
        const filteredTags = response.tags
          .map(tag => tag.name)
          .filter(name => 
            name.toLowerCase().includes(debouncedInput.toLowerCase()) &&
            !valueRef.current.includes(name)
          );
        
        // Cache this search result
        lastSearchRef.current = {
          query: debouncedInput,
          hadResults: filteredTags.length > 0,
        };
        
        setSuggestions(filteredTags);
        setShowDropdown(filteredTags.length > 0);
        setHighlightedIndex(-1);
      } catch (error) {
        console.error('Failed to search tags:', error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    };

    searchTags();
  }, [debouncedInput, apiClient, selectedTenant]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const addTag = useCallback((tagName: string) => {
    const trimmedTag = tagName.trim();
    if (!trimmedTag) return;
    if (value.includes(trimmedTag)) return;
    if (maxTags && value.length >= maxTags) return;

    onChange([...value, trimmedTag]);
    setInputValue('');
    setSuggestions([]);
    setShowDropdown(false);
    lastSearchRef.current = null; // Reset cache when tag is added
    inputRef.current?.focus();
  }, [value, onChange, maxTags]);

  const removeTag = useCallback((tagToRemove: string) => {
    onChange(value.filter(tag => tag !== tagToRemove));
    inputRef.current?.focus();
  }, [value, onChange]);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === ' ' && inputValue.trim()) {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && suggestions[highlightedIndex]) {
        addTag(suggestions[highlightedIndex]);
      } else if (inputValue.trim()) {
        addTag(inputValue);
      }
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      removeTag(value[value.length - 1]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => 
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => prev > 0 ? prev - 1 : -1);
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
      setHighlightedIndex(-1);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    if (e.target.value.trim()) {
      setShowDropdown(true);
    }
  };

  const handleContainerClick = () => {
    inputRef.current?.focus();
  };

  const handleSuggestionClick = (tagName: string) => {
    addTag(tagName);
  };

  return (
    <Box className={classes.wrapper} ref={containerRef}>
      {label && (
        <Text component="label" size="sm" fw={500} className={classes.label}>
          {label}
        </Text>
      )}
      {description && (
        <Text size="xs" c="dimmed" className={classes.description}>
          {description}
        </Text>
      )}
      
      <Box
        className={`${classes.container} ${error ? classes.containerError : ''} ${disabled ? classes.containerDisabled : ''}`}
        onClick={handleContainerClick}
      >
        <Box className={classes.tagsWrapper}>
          {value.map((tag) => (
            <Box key={tag} className={classes.tag}>
              <Text size="sm" className={classes.tagText}>{tag}</Text>
              {!disabled && (
                <CloseButton
                  size="xs"
                  className={classes.tagClose}
                  onClick={(e) => {
                    e.stopPropagation();
                    removeTag(tag);
                  }}
                  aria-label={`Tag "${tag}" entfernen`}
                />
              )}
            </Box>
          ))}
          
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              isFocusedRef.current = true;
              if (inputValue.trim() && suggestions.length > 0) {
                setShowDropdown(true);
              }
            }}
            onBlur={() => {
              isFocusedRef.current = false;
            }}
            placeholder={value.length === 0 ? placeholder : ''}
            disabled={disabled || (maxTags !== undefined && value.length >= maxTags)}
            className={classes.input}
          />
          
          {isLoading && (
            <Loader size="xs" className={classes.loader} />
          )}
        </Box>
      </Box>

      {showDropdown && suggestions.length > 0 && (
        <Portal>
          <Paper 
            className={classes.dropdown} 
            shadow="md" 
            withBorder
            p={4}
            style={{
              top: dropdownPosition.top,
              left: dropdownPosition.left,
              width: dropdownPosition.width,
            }}
          >
            {suggestions.map((suggestion, index) => (
              <Box
                key={suggestion}
                className={`${classes.suggestion} ${index === highlightedIndex ? classes.suggestionHighlighted : ''}`}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSuggestionClick(suggestion);
                }}
                onMouseEnter={() => setHighlightedIndex(index)}
              >
                <Text size="sm">{suggestion}</Text>
              </Box>
            ))}
          </Paper>
        </Portal>
      )}

      {error && (
        <Text size="xs" c="red" className={classes.error}>
          {error}
        </Text>
      )}
    </Box>
  );
};
