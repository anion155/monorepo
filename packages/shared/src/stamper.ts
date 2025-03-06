/**
 * Creates Stamper object. Let's you store some value without changing object.
 *
 * @example
 * const stamper = new Stamper((disposable: Disposable): DisposableStack => {
 *   const stack = new DisposableStack();
 *   disposable[Symbol.dispose] = () => stack.dispose();
 *   return stack;
 * });
 * const value = {} as Disposable;
 * stamper.stamp(value);
 * stamper.get(value).append(() => {});
 */
export class Stamper<Object extends object, Value> {
  protected init: (object: Object) => Value;
  protected storage = new WeakMap<Object, Value>();
  constructor(init: (object: Object) => Value) {
    this.init = init;
  }

  /** Stamps {@link object} with value */
  stamp(object: Object): Value;
  /** Stamps {@link object} with {@link value} */
  stamp(object: Object, value: Value): Value;
  stamp(object: Object, ...args: [] | [value: Value]) {
    if (this.storage.has(object)) throw new TypeError("passed object was already stamped before");
    const value = args.length === 0 ? this.init(object) : args[0];
    this.storage.set(object, value);
    return value;
  }

  /** Checks if {@link object} was stamped  */
  has(object: object): object is Object {
    return this.storage.has(object as never);
  }

  /**
   * Get's value stamped into {@link object}.
   * Throws TypeError if {@link object} wasn't stamped.
   */
  get(object: Object): Value {
    if (!this.has(object)) throw new TypeError("passed object wasn't stamped");
    return this.storage.get(object)!;
  }

  /** Get's value stamped into {@link object}, otherwise return undefined */
  getSafe(object: object): Value | undefined {
    return this.has(object) ? this.storage.get(object) : undefined;
  }

  /**
   * Set value into stamped object.
   * Throws TypeError if {@link object} wasn't stamped.
   */
  set(object: Object, value: Value) {
    if (!this.has(object)) throw new TypeError("passed object wasn't stamped");
    this.storage.set(object, value);
  }

  /** Set value into stamped {@link object} */
  setSafe(object: object, value: Value) {
    if (this.has(object)) this.storage.set(object, value);
  }

  /**
   * {@link modifier} called with stored value and result is stored as new value.
   * Throws TypeError if {@link object} wasn't stamped.
   */
  modify(object: Object, modifier: (value: Value) => Value) {
    if (!this.has(object)) throw new TypeError("passed object wasn't stamped");
    this.storage.set(object, modifier(this.storage.get(object)!));
  }

  /**
   * {@link modifier} called with stored value and result is stored as new value.
   * Does not call {@link modifier} if {@link object} wasn't stamped.
   */
  modifySafe(obj: object, modifier: (value: Value) => Value) {
    if (this.has(obj)) this.storage.set(obj, modifier(this.storage.get(obj)!));
  }
}
