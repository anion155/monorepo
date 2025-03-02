export const IteratorPrototype = Object.getPrototypeOf(Object.getPrototypeOf([][Symbol.iterator]())) as Iterator<unknown>;

/* istanbul ignore next */
async function* anonym() {}
export const AsyncIteratorPrototype = Object.getPrototypeOf(Object.getPrototypeOf(Object.getPrototypeOf(anonym()))) as AsyncIterator<unknown>;
