/**
 * For a detailed explanation regarding each configuration property, visit:
 * https://jestjs.io/docs/configuration
 */

/** @type {import('jest').Config} */
export const base = {
  // All imported modules in your tests should be mocked automatically
  // automock: false,

  // Stop running tests after `n` failures
  // bail: 0,

  // The directory where Jest should store its cached dependency information
  // cacheDirectory: "/private/var/folders/3d/0_27hsm156lgn3fk531lv_c40000gn/T/jest_dx",

  // Automatically clear mock calls, instances, contexts and results before every test
  clearMocks: true,

  // Indicates whether the coverage information should be collected while executing the test
  // collectCoverage: false,

  // An array of glob patterns indicating a set of files for which coverage information should be collected
  // collectCoverageFrom: undefined,

  // The directory where Jest should output its coverage files
  // coverageDirectory: undefined,

  // An array of regexp pattern strings used to skip coverage collection
  // coveragePathIgnorePatterns: [
  //   "/node_modules/"
  // ],

  // Indicates which provider should be used to instrument code for coverage
  // coverageProvider: "babel",

  // A list of reporter names that Jest uses when writing coverage reports
  // coverageReporters: [
  //   "json",
  //   "text",
  //   "lcov",
  //   "clover"
  // ],

  // An object that configures minimum threshold enforcement for coverage results
  // coverageThreshold: undefined,

  // A path to a custom dependency extractor
  // dependencyExtractor: undefined,

  // Make calling deprecated APIs throw helpful error messages
  // errorOnDeprecated: false,

  // The default configuration for fake timers
  // fakeTimers: {
  //   "enableGlobally": false
  // },

  // Force coverage collection from ignored files using an array of glob patterns
  // forceCoverageMatch: [],

  // A path to a module which exports an async function that is triggered once before all test suites
  // globalSetup: undefined,

  // A path to a module which exports an async function that is triggered once after all test suites
  // globalTeardown: undefined,

  // A set of global variables that need to be available in all test environments
  // globals: {},

  // The maximum amount of workers used to run your tests. Can be specified as % or a number. E.g. maxWorkers: 10% will use 10% of your CPU amount + 1 as the maximum worker number. maxWorkers: 2 will use a maximum of 2 workers.
  // maxWorkers: "50%",

  // An array of directory names to be searched recursively up from the requiring module's location
  // moduleDirectories: [
  //   "node_modules"
  // ],

  // An array of file extensions your modules use
  // moduleFileExtensions: [
  //   "js",
  //   "mjs",
  //   "cjs",
  //   "jsx",
  //   "ts",
  //   "tsx",
  //   "json",
  //   "node"
  // ],

  // A map from regular expressions to module names or to arrays of module names that allow to stub out resources with a single module
  // moduleNameMapper: {},

  // An array of regexp pattern strings, matched against all module paths before considered 'visible' to the module loader
  // modulePathIgnorePatterns: [],

  // Activates notifications for test results
  // notify: false,

  // An enum that specifies notification mode. Requires { notify: true }
  // notifyMode: "failure-change",

  // A preset that is used as a base for Jest's configuration
  // preset: undefined,

  // Run tests from one or more projects
  // projects: undefined,

  // Use this configuration option to add custom reporters to Jest
  // reporters: undefined,

  // Automatically reset mock state before every test
  // resetMocks: false,

  // Reset the module registry before running each individual test
  // resetModules: false,

  // A path to a custom resolver
  // resolver: undefined,

  // Automatically restore mock state and implementation before every test
  // restoreMocks: false,

  // The root directory that Jest should scan for tests and modules within
  // rootDir: undefined,

  // A list of paths to directories that Jest should use to search for files in
  // roots: [
  //   "<rootDir>"
  // ],

  // Allows you to use a custom runner instead of Jest's default test runner
  // runner: "jest-runner",

  // The paths to modules that run some code to configure or set up the testing environment before each test
  setupFiles: ["../proposal-explicit-resource-management/global.ts"],

  // A list of paths to modules that run some code to configure or set up the testing framework before each test
  // setupFilesAfterEnv: [],

  // The number of seconds after which a test is considered as slow and reported as such in the results.
  // slowTestThreshold: 5,

  // A list of paths to snapshot serializer modules Jest should use for snapshot testing
  // snapshotSerializers: [],

  // The test environment that will be used for testing
  // testEnvironment: "jest-environment-node",

  // Options that will be passed to the testEnvironment
  // testEnvironmentOptions: {},

  // Adds a location field to test results
  // testLocationInResults: false,

  // The glob patterns Jest uses to detect test files
  // testMatch: [
  //   "**/__tests__/**/*.[jt]s?(x)",
  //   "**/?(*.)+(spec|test).[tj]s?(x)"
  // ],

  // An array of regexp pattern strings that are matched against all test paths, matched tests are skipped
  // testPathIgnorePatterns: [
  //   "/node_modules/"
  // ],

  // The regexp pattern or array of patterns that Jest uses to detect test files
  // testRegex: [],

  // This option allows the use of a custom results processor
  // testResultsProcessor: undefined,

  // This option allows use of a custom test runner
  // testRunner: "jest-circus/runner",

  // A map from regular expressions to paths to transformers
  // transform: undefined,

  // An array of regexp pattern strings that are matched against all source file paths, matched files will skip transformation
  // transformIgnorePatterns: [
  //   "/node_modules/",
  //   "\\.pnp\\.[^\\/]+$"
  // ],

  // An array of regexp pattern strings that are matched against all modules before the module loader will automatically return a mock for them
  // unmockedModulePathPatterns: undefined,

  // Indicates whether each individual test should be reported during the run
  // verbose: undefined,

  // An array of regexp patterns that are matched against all source file paths before re-running tests in watch mode
  // watchPathIgnorePatterns: [],

  // Whether to use watchman for file crawling
  // watchman: true,
};

/** @type {import('jest').Config} */
export const typescript = {
  preset: "ts-jest",
  transform: {
    "^.+.tsx?$": ["ts-jest", { tsconfig: "./tsconfig.jest.json" }],
  },
};

/**
 * @param {...import('jest').Config} configs
 * @returns {import('jest').Config}
 */
export function jestConfig(...configs) {
  /**
   * @param {import('jest').Config} left
   * @param {import('jest').Config} right
   * @param {keyof import('jest').Config} name
   */
  function array(left, right, name) {
    if (name in left && name in right) {
      left[name] = [...left[name], ...right[name]];
    }
  }
  /**
   * @param {import('jest').Config} left
   * @param {import('jest').Config} right
   * @param {keyof import('jest').Config} name
   */
  function orderedMap(left, right, name) {
    if (name in left && name in right) {
      const order = [];
      const options = {};
      function handle(config) {
        for (const value of config) {
          if (typeof value === "string") {
            const index = order.indexOf(value);
            if (index >= 0) {
              order.splice(index, 1);
              delete options[value];
            }
            order.push(value);
          } else {
            const name = value.unshift();
            const index = order.indexOf(value);
            if (index >= 0) {
              order.splice(index, 1);
              delete options[value];
            }
            order.push(name);
            options[name] = value;
          }
        }
      }
      handle(left[name]);
      handle(right[name]);
      right[name] = order.map((name) => (name in options ? [name, options[name]] : name));
    }
  }
  /**
   * @param {import('jest').Config} left
   * @param {import('jest').Config} right
   * @param {keyof import('jest').Config} name
   */
  function object(left, right, name) {
    if (name in left && name in right) {
      left[name] = { ...left[name], ...right[name] };
    }
  }
  return configs.reduce((combined, config) => {
    const next = { ...combined, ...config };
    array(next, config, "coveragePathIgnorePatterns");
    orderedMap(next, config, "coverageReporters");
    object(next, config, "fakeTimers");
    array(next, config, "forceCoverageMatch");
    object(next, config, "globals");
    array(next, config, "moduleDirectories");
    array(next, config, "moduleFileExtensions");
    // object(next, config, "moduleNameMapper")
    array(next, config, "modulePathIgnorePatterns");
    array(next, config, "roots");
    array(next, config, "setupFiles");
    array(next, config, "setupFilesAfterEnv");
    array(next, config, "snapshotSerializers");
    object(next, config, "testEnvironmentOptions");
    array(next, config, "testMatch");
    array(next, config, "testPathIgnorePatterns");
    array(next, config, "testRegex");
    array(next, config, "transformIgnorePatterns");
    array(next, config, "watchPathIgnorePatterns");
    return next;
  });
}
