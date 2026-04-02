import type { FC, ReactNode } from 'react';
import { Modal, Group, Text, Box, Button, LoadingOverlay, SegmentedControl } from '@mantine/core';
import classes from './UnifiedDialog.module.css';

interface UnifiedDialogTab {
  value: string;
  label: string;
  icon?: ReactNode;
}

interface UnifiedDialogAction {
  label: string;
  onClick?: () => void;
  type?: 'button' | 'submit';
  variant?: string;
  color?: string;
  loading?: boolean;
  disabled?: boolean;
}

interface UnifiedDialogProps {
  opened: boolean;
  onClose: () => void;
  title: string;
  icon?: ReactNode;
  size?: string | number;
  children: ReactNode;
  scrollable?: boolean;
  scrollOffset?: number;
  isLoading?: boolean;
  actions?: UnifiedDialogAction[];
  tabs?: UnifiedDialogTab[];
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  minHeight?: number;
  formId?: string;
  closeOnClickOutside?: boolean;
  closeOnEscape?: boolean;
}

export const UnifiedDialog: FC<UnifiedDialogProps> = ({
  opened,
  onClose,
  title,
  icon,
  size = 'lg',
  children,
  scrollable = false,
  scrollOffset = 320,
  isLoading = false,
  actions,
  tabs,
  activeTab,
  onTabChange,
  minHeight,
  formId,
  closeOnClickOutside = true,
  closeOnEscape = true,
}) => {
  const modalTitle = (
    <Group gap="sm">
      {icon && <Box className={classes.titleIcon}>{icon}</Box>}
      <Text fw={600} size="lg">{title}</Text>
    </Group>
  );

  const bodyStyle = minHeight
    ? { minHeight: `${minHeight}px` }
    : undefined;

  const scrollStyle = scrollable
    ? { '--unified-dialog-scroll-offset': `${scrollOffset}px` } as React.CSSProperties
    : undefined;

  const renderContent = () => {
    if (scrollable) {
      return (
        <div className={classes.scrollWrapper} style={scrollStyle}>
          <div className={classes.scrollArea}>
            {children}
          </div>
        </div>
      );
    }
    return children;
  };

  const renderActions = () => {
    if (!actions || actions.length === 0) return null;
    return (
      <Group justify="flex-end" className={classes.actions}>
        {actions.map((action, index) => (
          <Button
            key={index}
            variant={action.variant ?? (index === actions.length - 1 ? 'filled' : 'default')}
            color={action.color}
            onClick={action.onClick}
            type={action.type ?? 'button'}
            form={action.type === 'submit' ? formId : undefined}
            loading={action.loading}
            disabled={action.disabled}
          >
            {action.label}
          </Button>
        ))}
      </Group>
    );
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={modalTitle}
      size={size}
      centered
      closeOnClickOutside={closeOnClickOutside}
      closeOnEscape={closeOnEscape}
      classNames={{
        content: classes.modalContent,
        header: classes.modalHeader,
        body: classes.modalBody,
      }}
    >
      <LoadingOverlay visible={isLoading} />

      <Box style={bodyStyle}>
        {tabs && tabs.length > 0 && (
          <Box className={classes.tabContainer}>
            <SegmentedControl
              fullWidth
              className={classes.segmentedControl}
              value={activeTab}
              onChange={(value) => onTabChange?.(value)}
              data={tabs.map(tab => ({
                value: tab.value,
                label: (
                  <Group gap={6} justify="center">
                    {tab.icon}
                    <span>{tab.label}</span>
                  </Group>
                ),
              }))}
            />
          </Box>
        )}

        {renderContent()}
      </Box>

      {renderActions()}
    </Modal>
  );
};
