// Sentry's wrapper around Expo's default metro config — needed so release
// bundles carry debug IDs that match the sourcemaps uploaded to Sentry.
const { getSentryExpoConfig } = require('@sentry/react-native/metro');

const config = getSentryExpoConfig(__dirname);

module.exports = config;
