const production = process.env.NODE_ENV === "production";

export function assert(
  condition: unknown,
  message?: string
): asserts condition {
  if (condition) return;
  throw new Error(message);
}

export function warning(condition: unknown, message?: string) {
  if (condition) return;
  if (production) return;

  // eslint-disable-next-line no-console -- used in dev env only
  console?.warn?.(message);

  try {
    throw new Error(message);
  } catch (error) {
    // Error thrown for developer convenience
  }
}
