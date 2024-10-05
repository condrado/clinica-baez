import babelParser from "@babel/eslint-parser";
import prettierConfig from 'eslint-config-prettier';

export default [
    {
        files: ["src/js/*.js"],
        languageOptions: {
            parser: babelParser,
                sourceType: "module",
                ecmaVersion: 2022,         // Soporta ECMAScript 2022
                sourceType: 'module'       // Habilita el soporte para módulos ECMAScript
              
        },
        plugins: {
            prettier: prettierConfig,     // Integra Prettier
          },
        rules: {
            'prettier/prettier': ['error', {
              'htmlWhitespaceSensitivity': 'ignore',
              'trailingComma': 'es5',
              'arrowParens': 'avoid',
              'endOfLine': 'auto',
              'singleQuote': true,
            }],
            'no-unused-expressions': ['error', { 'allowShortCircuit': true }],
            'func-names': 'off',
            'wrap-iife': ['error', 'inside'],
            'new-cap': ['error', { 'capIsNew': false }],
            'prefer-destructuring': ['error',
              {
                'VariableDeclarator': {
                  'array': false,
                  'object': true
                },
                'AssignmentExpression': {
                  'object': true,
                  'array': false
                }
              }
            ],
            'no-shadow': ['error', {
              'allow': ['origin', 'page']
            }],
            'no-warning-comments': ['error', { 'terms': ['todo', 'fixme'], 'location': 'anywhere' }],
            'semi': 'error',
            'no-console': 'error',
            'prefer-template': 'error',
            'no-restricted-syntax': [
              'warn',
              {
                'selector': ':matches(ImportNamespaceSpecifier)',
                'message': 'Import only modules you need'
              }
            ],
            "complexity": [
              "error",
              11
            ],
            "max-depth": [
              "error",
              5
            ],
            "max-params": [
              "error",
              10
            ],
            "max-statements": [
              "error",
              40
            ],
            "space-in-parens": [
              "error",
              "never"
            ],
            "key-spacing": [
              "error",
              {
                "beforeColon": false,
                "afterColon": true
              }
            ],
            "space-unary-ops": [
              "error",
              {
                "words": false,
                "nonwords": false
              }
            ],
            "dot-notation": "error",
          },
    }
];
  

// env: {
//     es2021: true,   // Habilita ECMAScript 2021 en el entorno
//     node: true,     // Habilita el entorno de Node.js
//     browser: true   // Habilita el entorno del navegador
//   },
//   extends: [
//     'eslint:recommended'  // Extiende las reglas recomendadas por ESLint
//   ],
