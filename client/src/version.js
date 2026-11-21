import packageJson from '../package.json';

/**
 * Single source of truth for the client application version.
 * Automatically synchronizes with client/package.json.
 */
export const APP_VERSION = packageJson.version; // e.g. "2.4.0"
export const FULL_VERSION_BADGE = `v${packageJson.version}`; // e.g. "v2.4.0"

export default APP_VERSION;

