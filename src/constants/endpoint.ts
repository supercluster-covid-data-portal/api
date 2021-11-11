import urlJoin from 'url-join';

// Define ENDPOINT
export const BASE_ENDPOINT = '/api';

export const SERVER_STATUS_ENDPOINT = BASE_ENDPOINT + '/server-status';

export const AUTH_ENDPOINT = urlJoin(BASE_ENDPOINT, 'auth');
