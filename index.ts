#!/usr/bin/env bun

import { $ } from 'bun';

const Config = {
  packageManager: 'bun@1.1.4',
  devDeps: [
    'eslint@^8',
    'prettier',
    'eslint-config-next@14.1.0',
    'eslint-config-prettier',
    'eslint-plugin-next-on-pages',
    'husky',
    'lint-staged',
    '@trivago/prettier-plugin-sort-imports',
  ],
};

/* -------------------------------------------------------------------------------------------------
 * Update package.json file
 * -----------------------------------------------------------------------------------------------*/

const pkgFile = Bun.file('package.json', { type: 'application/json' });
const pkg = await pkgFile.json();
pkg.packageManager = Config.packageManager;
await Bun.write('package.json', JSON.stringify(pkg, null, 2));

/* -------------------------------------------------------------------------------------------------
 * Install devDependencies
 * -----------------------------------------------------------------------------------------------*/

// FIXME: something went wrong with the following code
// await $`bun install -D ${devDeps.join(" ")}`;
// so we have to use a for loop
for (const dep of Config.devDeps) {
  await $`bun install -D ${dep}`;
}

// update bun.lockb
await $`bun install`;

/* -------------------------------------------------------------------------------------------------
 * EsLint and Prettier configuration
 * -----------------------------------------------------------------------------------------------*/

await Bun.write(
  '.eslintrc.json',
  JSON.stringify(
    {
      extends: ['next/core-web-vitals', 'plugin:eslint-plugin-next-on-pages/recommended', 'prettier'],
      plugins: ['eslint-plugin-next-on-pages'],
    },
    null,
    2,
  ),
);

await Bun.write(
  '.prettierrc.json',
  JSON.stringify(
    {
      tabWidth: 2,
      useTabs: false,
      semi: true,
      singleQuote: false,
      trailingComma: 'all',
      plugins: ['@trivago/prettier-plugin-sort-imports'],
      importOrder: ['^react$', '^next$|^next/.*$', '<THIRD_PARTY_MODULES>', '^@/(.*)$', '^[./]'],
      importOrderSeparation: true,
      importOrderSortSpecifiers: true,
    },
    null,
    2,
  ),
);

/* -------------------------------------------------------------------------------------------------
 * Husky and lint-staged configuration
 * -----------------------------------------------------------------------------------------------*/

await Bun.write(
  '.lintstagedrc.cjs',
  `const path = require("path");

const buildEslintCommand = (filenames) =>
  \`next lint --fix --file \${filenames
    .map((f) => path.relative(process.cwd(), f))
    .join(" --file ")}\`;

const buildPrettierCommand = (filenames) =>
  \`prettier --write \${filenames
    .map((f) => path.relative(process.cwd(), f))
    .join(" ")}\`;

module.exports = {
  "*.{js,jsx,ts,tsx}": [buildEslintCommand, buildPrettierCommand],
  "*.{json,md,mdx,yml}": [buildPrettierCommand],
};
`,
);

await $`bunx husky init`;
await $`echo bunx lint-staged > .husky/pre-commit`;

/* -------------------------------------------------------------------------------------------------
 * Format the code
 * -----------------------------------------------------------------------------------------------*/

await $`bunx prettier --write .`;

/* -------------------------------------------------------------------------------------------------
 * Done
 * -----------------------------------------------------------------------------------------------*/

console.log('🎉 Done!');
