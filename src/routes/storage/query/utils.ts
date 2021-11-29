import { Method } from 'axios';

import { StorageResponse } from '../types';
import { fetchStorage } from '../utils';

import { SingleQueryResponse, StoredQueriesResponse, StoredQueryObject } from './types';

const transformQueriesResponse = (
  storageResponse: StorageResponse,
): StoredQueriesResponse | void => {
  if (storageResponse?.data?.hasOwnProperty('queries')) {
    return {
      etag: storageResponse.etag,
      queries: storageResponse.data.queries,
    };
  }
};

export const initialiseQueryStorage = async ({
  etag,
  tokenBearer,
  userId,
}: {
  etag?: string;
  tokenBearer?: string;
  userId?: string;
}): Promise<StoredQueriesResponse | void> => {
  if (etag && tokenBearer && userId) {
    return fetchStorage({
      data: [
        {
          op: 'add',
          path: '/queries',
          value: {},
        },
      ],
      etag,
      method: 'PATCH',
      tokenBearer,
      userId,
    }).then(transformQueriesResponse);
  }

  throw {
    message:
      'One of the required parameters was not present while attempting to initialise query storage',
    status: 400,
  };
};

// WIP temporary omnipotent fetching helper
// TODO: break it down into smaller + specialised helpers
export const fetchQueries = (etag = '', tokenBearer = '', userId = '') => {
  //TODO: check these options
  return (options?: Record<string, any>) =>
    fetchStorage({
      etag,
      tokenBearer,
      userId,
      ...options,
    }).then(async (storageResponse: StorageResponse): Promise<StoredQueriesResponse | void> => {
      try {
        return (
          transformQueriesResponse(storageResponse) ||
          (await initialiseQueryStorage({
            etag: storageResponse.etag,
            tokenBearer,
            userId,
          }))
        );
      } catch (error) {
        console.error(error);
        throw {
          message: 'Could not fetch stored queries correctly',
          status: 500,
        };
      }
    });
};

export const methodRequiresQueryId = (method: Method) => ['DELETE', 'PUT'].includes(method);

export const getStoredQueryById =
  (queryId: string) =>
  (data: StoredQueriesResponse | void): SingleQueryResponse => {
    const found = data?.queries?.[queryId];
    if (found) {
      return { etag: data.etag, ...found };
    }

    throw {
      message: 'We could not find a stored query using that ID',
      status: 404,
    };
  };

export const compareDifferentQueries = (
  previousQuery: StoredQueryObject,
  nextQuery: StoredQueryObject,
): boolean => {
  return !(previousQuery.label === nextQuery.label && previousQuery.url === nextQuery.url);
};

export const validateNextQuery = (query: StoredQueryObject): void => {
  if (query) {
    if (['label', 'url'].toString() === Object.keys(query).toString()) {
      if (query.label && typeof query.label === 'string') {
        if (query.url && typeof query.url === 'string') {
          // TODO: further validation.
          return;
        }
      }
    }
  }

  throw {
    message: "The query provided wasn't valid",
    status: 400,
  };
};
