/**
 * @typedef {(left: never, right: never) => unknown} UntypedMerger
 */
/**
 * @template Base
 * @typedef {<Config extends Base>(left: Config, right: Config) => Config} Merger
 */

/** @type {Merger<unknown | unknown[]>} */
export const mergeArrays = (left, right) => {
  const toArray = (value) => (Array.isArray(value) ? value : [value]);
  return [...toArray(left), ...toArray(right)];
};

/** @type {Merger<unknown | unknown[]>} */
export const mergeArraysUnique = (left, right) => {
  return [...new Set(mergeArrays(left, right))];
};

/**
 * @template {object} Config
 * @param {(left: Config, right: Config) => Config} merge
 * @returns {Merger<Array<string | [string, Config]>>}
 */
export const createOrderedMapMerger = (merge = (left, right) => right) => {
  return (left, right) => {
    const order = [];
    const options = {};
    const handle = (config) => {
      for (const value of config) {
        if (typeof value === "string") {
          const index = order.indexOf(value);
          if (index >= 0) {
            order.splice(index, 1);
            options[value] = merge(options[value], undefined);
          }
          order.push(value);
        } else {
          const name = value.unshift();
          const index = order.indexOf(value);
          if (index >= 0) {
            order.splice(index, 1);
            options[name] = merge(options[name], value[0]);
          } else {
            options[name] = value[0];
          }
          order.push(name);
        }
      }
    };
    handle(left);
    handle(right);
    return order.map((name) => (options[name] !== undefined ? [name, options[name]] : name));
  };
};

/**
 * @template {object} Config
 * @param {<Key extends keyof Config>(left: Config[Key], right: Config[Key]) => Config[Key]} resolver
 * @returns {Merger<Config>}
 */
export function createObjectMerger(resolver = (left, right) => right) {
  return (left, right) => {
    const values = { ...left };
    for (let key of Object.keys(right)) {
      values[key] = key in left ? resolver(left[key], right[key], key) : right[key];
    }
    return values;
  };
}

/**
 * @template {object} Config
 * @typedef {{ [Key in keyof Config]: (left: Config[Key], right: Config[Key]) => Config[Key] }} Scheme
 */

/**
 * @template {Record<string, UntypedMerger>} Scheme
 * @param {Scheme} scheme
 * @returns {Merger<{ [Key in keyof Scheme]: Parameters<Scheme[Key]>[0] }>}
 */
export function createSchemeMerger(scheme) {
  return createObjectMerger((left, right, key) => {
    return key in scheme ? scheme[key](left, right) : right;
  });
}
