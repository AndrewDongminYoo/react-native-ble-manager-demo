module.exports = {
  root: true,
  extends: '@react-native-community',
  ignorePatterns: ['!.eslintrc.js', '!.prettierrc.js'],
  rules: {
    'prettier/prettier': 'off',
    'react-native/no-inline-styles': 'off',
    'react-native/no-color-literals': 'off',
    'react-native/sort-styles': 'off',
    'no-bitwise': 'off',
  },
};
