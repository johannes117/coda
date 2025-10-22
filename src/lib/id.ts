export function generateId(): string {
  const rand = Math.random().toString(36).slice(2);
  const time = Date.now().toString(36);
  return `${rand}${time}`;
}
