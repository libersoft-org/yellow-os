declare const __COMMIT_HASH__: string;
declare const __BUILD_DATE__: string;
export const PRODUCT_NAME = 'Yellow OS';
export const PRODUCT_VERSION = '0.0.1';
export const COMMIT_HASH: string = typeof __COMMIT_HASH__ !== 'undefined' ? __COMMIT_HASH__ : 'dev';
export const BUILD_DATE: string = typeof __BUILD_DATE__ !== 'undefined' ? __BUILD_DATE__ : 'dev';
