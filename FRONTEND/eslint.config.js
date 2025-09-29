// @ts-check
const eslint = require("@eslint/js");
const tseslint = require("typescript-eslint");
const angular = require("angular-eslint");

module.exports = tseslint.config(
  {
    files: ["**/*.ts"],
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommended,
      ...tseslint.configs.stylistic,
      ...angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    rules: {
      // Estilo
        "quotes": ["warn", "single"],              
        "semi": ["warn", "always"],                
        "indent": ["warn", 2],                     
        "object-curly-spacing": ["warn", "always"],

        // Buenas prácticas JS/TS
        "no-console": ["warn", { "allow": ["warn", "error"] }], 
        "eqeqeq": "warn",                         
        "no-var": "warn",                         
        "prefer-const": "warn",                   

        // Angular específico
        "@angular-eslint/prefer-on-push-component-change-detection": "warn", 
        "@angular-eslint/no-empty-lifecycle-method": "warn",
        
        //para lo que da por defecto error de warn
        "@typescript-eslint/no-unused-vars": "warn",
        "@angular-eslint/prefer-inject": "warn",
        "@typescript-eslint/no-explicit-any": "warn",
        "@typescript-eslint/no-empty-function": "warn",
    },
  },
  {
    files: ["**/*.html"],
    extends: [
      ...angular.configs.templateRecommended,
      ...angular.configs.templateAccessibility
    ],
    rules: {
      // opcional: si querés bajar severidad de reglas de accesibilidad
      "@angular-eslint/template/click-events-have-key-events": "warn",
      "@angular-eslint/template/interactive-supports-focus": "warn"
    },
  }
);
