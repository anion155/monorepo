export type UntypedMerger = (left: never, right: never) => unknown;
export type Merger<Base> = <Config extends Base>(left: Config, right: Config) => Config;

export const mergeArrays = <Config extends unknown>(left: Config, right: Config): Extract<Config, unknown[]> => {
  const toArray = (value: unknown) => (Array.isArray(value) ? value : [value]);
  return [...toArray(left), ...toArray(right)] as never;
};

export const mergeArraysUnique = <Config extends unknown>(left: Config, right: Config): Extract<Config, unknown[]> => {
  return [...new Set(mergeArrays(left, right))] as never;
};

export const createOrderedMapMerger = <BaseConfig extends object>(
  merge: (left: BaseConfig, right: BaseConfig) => BaseConfig = (left, right) => right,
) => {
  return <Config extends Array<string | [string, BaseConfig]>>(left: Config, right: Config): Config => {
    const order = [] as unknown[];
    const options = {} as Record<string, Config>;
    const handle = (config: Config) => {
      for (const value of config) {
        if (typeof value === "string") {
          const index = order.indexOf(value);
          if (index >= 0) {
            order.splice(index, 1);
            // @ts-expect-error(2322)
            options[value] = merge(options[value], undefined);
          }
          order.push(value);
        } else {
          const name = value.unshift();
          const index = order.indexOf(value);
          if (index >= 0) {
            order.splice(index, 1);
            // @ts-expect-error(2322)
            options[name] = merge(options[name], value[0]);
          } else {
            // @ts-expect-error(2322)
            options[name] = value[0];
          }
          order.push(name);
        }
      }
    };
    handle(left);
    handle(right);
    // @ts-expect-error(2345)
    return order.map((name) => (options[name] !== undefined ? [name, options[name]] : name));
  };
};

export function createObjectMerger<Values>(resolver: (left: Values, right: Values, key: string) => Values = (left, right) => right) {
  type BaseConfig = Record<string, Values>;
  return <Config extends BaseConfig>(left: Config, right: Config): Config => {
    const values = { ...left };
    for (let key of Object.keys(right) as Array<keyof Config>) {
      // @ts-expect-error(2322)
      values[key] = key in left ? resolver(left[key], right[key], key) : right[key];
    }
    return values;
  };
}

export type Scheme<Config extends object> = { [Key in keyof Config]: (left: Config[Key], right: Config[Key]) => Config[Key] };

export function createSchemeMerger<Scheme extends Record<string, UntypedMerger>>(scheme: Scheme) {
  type BaseConfig = { [Key in keyof Scheme]: Parameters<Scheme[Key]>[0] };
  const merger = createObjectMerger<BaseConfig[keyof BaseConfig]>((left, right, key) => {
    return key in scheme ? (scheme[key](left, right) as never) : right;
  });
  return <Config extends BaseConfig>(left: Config, right: Config): Config => {
    return merger(left, right);
  };
}
