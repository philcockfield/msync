import { log } from './libs';

export function formatModuleName(input: string) {
  const parts = (input || '').split('/');
  const hasOrg = parts.length > 1;
  const text = hasOrg ? log.gray(`${parts[0]}/${log.cyan(parts[1])}`) : log.cyan(parts[0]);
  return text;
}
