/**
 * TracingSidebar - Wrapper für TracingHierarchyView in Sidebar-Mode
 *
 * Nutzt TracingHierarchyView mit:
 * - variant: 'compact'
 * - theme: 'chatSidebar' (black background, border-radius left-top)
 * - showHeader: true
 * - showDataPanels: true
 * - onOpenFullscreen: Callback für Vollbild-Dialog
 */

import type { FC } from 'react';
import { TracingHierarchyView } from './TracingHierarchyView';
import classes from './TracingSidebar.module.css';

// ============================================================================
// PROPS
// ============================================================================

interface TracingSidebarProps {
  /** Callback when fullscreen button is clicked */
  onOpenFullscreen?: () => void;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const TracingSidebar: FC<TracingSidebarProps> = ({ onOpenFullscreen }) => {
  return (
    <div className={classes.container}>
      <TracingHierarchyView
        variant="compact"
        theme="chatSidebar"
        showHeader={true}
        showDataPanels={true}
        onOpenFullscreen={onOpenFullscreen}
      />
    </div>
  );
};

export default TracingSidebar;
