export type PackageJsonExport = {};
export type PackageJson = {
  name?: string;
  version?: string;
  description?: string;
  keywords?: string[];
  author?: string | { name?: string; url?: string };
  repository?: string | { type: "git"; url: string; directory?: string };
  license?: string;
  type?: "module";
  exports?: Record<string, string | PackageJsonExport>;
  "+exports"?: Record<string, string | PackageJsonExport>;
  "!exports"?: string[];
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
};
