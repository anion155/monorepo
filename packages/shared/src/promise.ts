export function isPending(promise: Promise<unknown>) {
  const unique = {};
  return Promise.race([promise, Promise.resolve(unique)]).then(
    (result) => result === unique,
    () => false,
  );
}

