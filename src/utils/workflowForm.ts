import { WorkflowFormOpenModeEnum } from '../api/types';

const POPUP_FEATURES = 'noopener,noreferrer,popup=yes,width=1024,height=800';
const TAB_FEATURES = 'noopener,noreferrer';

export function isSafeHttpUrl(rawUrl: string | undefined | null): boolean {
  if (!rawUrl) return false;
  try {
    const url = new URL(rawUrl);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export function buildFormWaitingUrl(
  formTriggerUrl: string | undefined | null,
  executionId: string
): string | null {
  if (!isSafeHttpUrl(formTriggerUrl) || !executionId) return null;
  const { origin } = new URL(formTriggerUrl as string);
  return `${origin}/form-waiting/${encodeURIComponent(executionId)}`;
}

export function openWorkflowForm(
  url: string | undefined | null,
  openMode: WorkflowFormOpenModeEnum | undefined
): boolean {
  if (!isSafeHttpUrl(url)) return false;
  const features = openMode === WorkflowFormOpenModeEnum.WINDOW ? POPUP_FEATURES : TAB_FEATURES;
  window.open(url as string, '_blank', features);
  return true;
}
