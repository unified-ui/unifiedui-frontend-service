export interface ParsedWidgetTag {
  id: string;
  data: Record<string, unknown> | unknown[];
}

export interface ParsedMessageContent {
  textBefore: string;
  widget: ParsedWidgetTag | null;
  textAfter: string;
}

const WIDGET_TAG_REGEX = /<\$_WGET\s+_id=(\S+)\s+d=(\{[\s\S]*?\}|\[[\s\S]*?\])\s*\/>/;

function safeParseJSON(jsonString: string): Record<string, unknown> | unknown[] | null {
  try {
    const parsed: unknown = JSON.parse(jsonString);
    if (typeof parsed === 'object' && parsed !== null) {
      return parsed as Record<string, unknown> | unknown[];
    }
    return null;
  } catch {
    return null;
  }
}

export function parseWidgetTag(content: string): ParsedMessageContent {
  const match = WIDGET_TAG_REGEX.exec(content);

  if (!match) {
    return { textBefore: content, widget: null, textAfter: '' };
  }

  const [fullMatch, id, dataString] = match;
  const data = safeParseJSON(dataString);

  if (!data || !id) {
    return { textBefore: content, widget: null, textAfter: '' };
  }

  const matchIndex = match.index;
  const textBefore = content.substring(0, matchIndex).trim();
  const textAfter = content.substring(matchIndex + fullMatch.length).trim();

  return {
    textBefore,
    widget: { id, data },
    textAfter,
  };
}

export function isStandardWidgetId(id: string): boolean {
  return id === 'yesno' || id === 'survey';
}
