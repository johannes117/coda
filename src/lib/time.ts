export const nowTime = (): string =>
  new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
