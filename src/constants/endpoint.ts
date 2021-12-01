import urlJoin from 'url-join';

// Define ENDPOINT
export const BASE_ENDPOINT = '/api';

export const HEALTH_ENDPOINT = urlJoin(BASE_ENDPOINT, 'health');
export const ARRANGER_READY_ENDPOINT = urlJoin(BASE_ENDPOINT, 'ping');
export const AUTH_ENDPOINT = urlJoin(BASE_ENDPOINT, 'auth');
export const JWKS_ENDPOINT = '/oauth/jwks';
export const SEQUENCES_ENDPOINT = urlJoin(BASE_ENDPOINT, 'sequences');
