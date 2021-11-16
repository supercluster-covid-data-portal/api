import urlJoin from 'url-join';

// Define ENDPOINT
export const BASE_ENDPOINT = '/api';

export const HEALTH_ENDPOINT = BASE_ENDPOINT + '/health';

export const AUTH_ENDPOINT = urlJoin(BASE_ENDPOINT, 'auth');
