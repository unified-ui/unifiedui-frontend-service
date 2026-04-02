import { useState, useCallback, useMemo } from 'react';
import type { MessageResponse } from '../../api/types';
import { parseWidgetTag, isStandardWidgetId } from '../../utils/widgetParser';
import type { WidgetInteraction } from '../../components/chat/WidgetSidebar';

interface UseConversationWidgetsParams {
  messages: MessageResponse[];
}

interface UseConversationWidgetsReturn {
  interactions: WidgetInteraction[];
  hasWidgets: boolean;
  widgetSidebarVisible: boolean;
  handleToggleWidgetSidebar: () => void;
}

export function useConversationWidgets({
  messages,
}: UseConversationWidgetsParams): UseConversationWidgetsReturn {
  const [widgetSidebarVisible, setWidgetSidebarVisible] = useState(false);

  const interactions = useMemo<WidgetInteraction[]>(() => {
    const result: WidgetInteraction[] = [];
    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      if (msg.type === 'user') continue;
      const parsed = parseWidgetTag(msg.content);
      if (!parsed.widget || isStandardWidgetId(parsed.widget.id)) continue;

      const nextMsg = messages[i + 1];
      const submittedData = nextMsg?.type === 'user' ? nextMsg.content : undefined;
      const extra = nextMsg?.type === 'user' ? nextMsg.extra : undefined;

      result.push({
        widgetId: parsed.widget.id,
        messageIndex: i,
        submittedData,
        extra,
      });
    }
    return result;
  }, [messages]);

  const hasWidgets = interactions.length > 0;

  const handleToggleWidgetSidebar = useCallback(() => {
    setWidgetSidebarVisible(prev => !prev);
  }, []);

  return {
    interactions,
    hasWidgets,
    widgetSidebarVisible,
    handleToggleWidgetSidebar,
  };
}
