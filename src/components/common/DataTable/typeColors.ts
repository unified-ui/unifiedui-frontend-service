/**
 * Centralized color mapping for entity types displayed as badges in DataTable.
 * Uses Mantine's built-in color palette names.
 */
export const TYPE_COLORS: Record<string, string> = {
  // Chat Agent Types (from ChatAgentTypeEnum)
  'N8N': 'orange',
  'MICROSOFT FOUNDRY': 'blue',
  'REST API': 'cyan',

  // Workflow Type
  'WORKFLOW': 'green',

  // Chat Widget Types (from ChatWidgetTypeEnum)
  'IFRAME': 'pink',
  'FORM': 'grape',
  'STANDARD': 'gray',

  // Chat Widget Display Types (from ChatWidgetsPage CHAT_WIDGET_TYPE_LABELS)
  'CHAT': 'blue',
  'EMBEDDED': 'teal',
  'POPUP': 'orange',
  'FLOATING': 'cyan',
};

export const DEFAULT_TYPE_COLOR = 'gray';

/**
 * Returns the Mantine color for a given type string.
 * Normalizes input to uppercase for consistent matching.
 */
export function getTypeColor(type: string | undefined): string {
  if (!type) return DEFAULT_TYPE_COLOR;
  const normalized = type.toUpperCase();
  return TYPE_COLORS[normalized] ?? DEFAULT_TYPE_COLOR;
}
