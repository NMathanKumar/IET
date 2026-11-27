/**
 * Babel plugin for Jest: rewrites `import.meta.env` to `process.env`,
 * so Vite-style env access works under CommonJS test execution.
 */
module.exports = function importMetaEnv() {
  return {
    name: 'jest-import-meta-env',
    visitor: {
      MemberExpression(path) {
        const { object, property } = path.node;
        if (
          object.type === 'MetaProperty' &&
          object.meta.name === 'import' &&
          object.property.name === 'meta' &&
          property.type === 'Identifier' &&
          property.name === 'env'
        ) {
          path.replaceWithSourceString('process.env');
        }
      },
    },
  };
};
