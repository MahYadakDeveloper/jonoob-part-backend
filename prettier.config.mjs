/** @type {import('prettier').Config} */
const prettierConfig = {
  plugins: ["prettier-plugin-embed", "prettier-plugin-sql"],
  semi: true,
  singleQuote: true,
  printWidth: 80,
  tabWidth: 2,
  trailingComma: "all",
  bracketSpacing: true,
  arrowParens: "always",
  endOfLine: "lf",
  objectWrap: "collapse",
};

/** @type {import('prettier-plugin-embed').PrettierPluginEmbedOptions} */
const prettierPluginEmbedConfig = {
  embeddedSqlTags: ["sql"],
  embeddedSqlPlugin: "prettier-plugin-sql",
  embeddedSqlParser: "postgresql",
};

/** @type {import('prettier-plugin-sql').SqlBaseOptions} */
const prettierPluginSqlConfig = {
  language: "postgresql",
  database: "postgresql",
  keywordCase: "upper",
  formatter: "sql-formatter",
};

const config = {
  ...prettierConfig,
  ...prettierPluginEmbedConfig,
  ...prettierPluginSqlConfig,
};

export default config;
