import { handleError } from '@/base-utils/handleError';

export function alertIfFnFreezes(fnName: string): NodeJS.Timeout {
  const timerId = setTimeout(() => {
    handleError(
      'alertIfFnFreezes',
      `${fnName} froze and didn't complete within 5 min`,
      { message: 'Froze' },
    );
  }, 300000); // 5 minutes

  return timerId;
}

export function cancelAlertIfFnFreezes(timerId: NodeJS.Timeout): void {
  clearTimeout(timerId);
}