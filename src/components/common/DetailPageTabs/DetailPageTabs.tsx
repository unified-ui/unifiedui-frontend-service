import type { FC } from 'react';
import { Tabs } from '@mantine/core';
import { IconInfoCircle, IconShieldLock } from '@tabler/icons-react';
import { useSearchParams } from 'react-router-dom';
import classes from './DetailPageTabs.module.css';

export type DetailTab = 'details' | 'iam';

interface DetailPageTabsProps {
  /** Currently active tab */
  activeTab?: DetailTab;
  /** Tab change handler */
  onTabChange?: (tab: DetailTab) => void;
  /** Details tab content */
  detailsContent: React.ReactNode;
  /** IAM tab content */
  iamContent: React.ReactNode;
  /** Custom details tab label */
  detailsLabel?: string;
  /** Custom IAM tab label */
  iamLabel?: string;
}

export const DetailPageTabs: FC<DetailPageTabsProps> = ({
  activeTab: externalActiveTab,
  onTabChange: externalOnTabChange,
  detailsContent,
  iamContent,
  detailsLabel = 'Details',
  iamLabel = 'Manage Access',
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Use URL query param if no external control
  const urlTab = searchParams.get('tab') as DetailTab | null;
  const activeTab = externalActiveTab ?? urlTab ?? 'details';

  const handleTabChange = (value: string | null) => {
    const tab = (value as DetailTab) || 'details';
    
    if (externalOnTabChange) {
      externalOnTabChange(tab);
    } else {
      // Update URL query param
      setSearchParams({ tab });
    }
  };

  return (
    <Tabs
      value={activeTab}
      onChange={handleTabChange}
      className={classes.tabs}
    >
      <Tabs.List className={classes.tabsList}>
        <Tabs.Tab
          value="details"
          leftSection={<IconInfoCircle size={16} />}
          className={classes.tab}
        >
          {detailsLabel}
        </Tabs.Tab>
        <Tabs.Tab
          value="iam"
          leftSection={<IconShieldLock size={16} />}
          className={classes.tab}
        >
          {iamLabel}
        </Tabs.Tab>
      </Tabs.List>

      <Tabs.Panel value="details" className={classes.panel}>
        {detailsContent}
      </Tabs.Panel>

      <Tabs.Panel value="iam" className={classes.panel}>
        {iamContent}
      </Tabs.Panel>
    </Tabs>
  );
};
