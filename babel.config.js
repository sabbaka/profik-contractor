// Metro applies babel-preset-expo on its own when no config file exists, so this
// reproduces the current build rather than changing it. It exists because
// babel-jest does not share that default: without a config file it applies no
// transform at all and every TS/JSX test file is a syntax error.
module.exports = function (api) {
  api.cache(true);
  return { presets: ["babel-preset-expo"] };
};
