import urlJoin from 'url-join';

export const BASE_ENDPOINT = '/api';
export const JWKS_ENDPOINT = '/oauth/jwks';

export const ARRANGER_READY_ENDPOINT = urlJoin(BASE_ENDPOINT, 'ping');
export const AUTH_ENDPOINT = urlJoin(BASE_ENDPOINT, 'auth');
export const HEALTH_ENDPOINT = urlJoin(BASE_ENDPOINT, 'health');
export const STORAGE_ENDPOINT = urlJoin(BASE_ENDPOINT, 'storage');
