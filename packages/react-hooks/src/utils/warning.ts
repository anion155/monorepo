export function warning(condition: unknown, message?: string) {
  if (condition) return;
  if (!__DEV__) return;

  // eslint-disable-next-line no-console -- used in dev env only
  console?.warn?.(message);

  try {
    throw new Error(message);
  } catch (error) {
    // Error thrown for developer convenience
  }
}
