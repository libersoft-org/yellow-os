declare const __COMMIT_HASH__: string;
declare const __BUILD_DATE__: string;
export const PRODUCT_NAME = 'Yellow OS';
export const PRODUCT_VERSION = '0.0.2';
export const PRODUCT_URL = 'https://yellow-os.com/';
export const GITHUB_URL = 'https://github.com/libersoft-org/yellow-os';
export const COMMIT_HASH: string = typeof __COMMIT_HASH__ !== 'undefined' ? __COMMIT_HASH__ : 'dev';
export const BUILD_DATE: string = typeof __BUILD_DATE__ !== 'undefined' ? __BUILD_DATE__ : 'dev';
