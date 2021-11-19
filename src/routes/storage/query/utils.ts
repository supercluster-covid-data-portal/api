import { Method } from 'axios';

import { StorageResponse } from '../types/storage';
import { fetchStorage } from '../utils';

import { SingleQueryResponse, StoredQueriesResponse, StoredQueryObject } from './types';

export const needsQueryId = (method: Method) => ['DELETE', 'PUT'].includes(method);

export const initialiseQueryStorage = async (etag: string): Promise<StorageResponse | void> => {
  if (etag) {
    return fetchStorage({
      data: JSON.stringify([
        {
          op: 'add',
          path: '/queries',
          value: {},
        },
      ]),
      etag,
      method: 'PATCH',
    });
  }

  throw {
    message: 'no etag was present while attempting to initialise query storage',
    status: 400,
  };
};

export const fetchQueries =
  (etag: string = '') =>
  //TODO: check these options
  (options?: any) =>
    fetchStorage({
      etag,
      ...options,
    })
      .then(async (storageResponse: StorageResponse): Promise<StoredQueriesResponse> => {
        try {
          if (storageResponse?.data?.hasOwnProperty('queries')) {
            return {
              etag: storageResponse.etag,
              queries: storageResponse.data.queries,
            };
          }

          return await initialiseQueryStorage(storageResponse.etag);
        } catch (error) {
          console.error(error);
          throw {
            message: 'Could not fetch stored queries correctly',
            status: 500,
          };
        }
      })
      .catch((error) => {
        throw error;
      });

export const getQueryById = (queryId: string) =>
  fetchQueries()().then((data: StoredQueriesResponse): SingleQueryResponse => {
    const found = data?.queries?.[queryId];
    if (found) {
      return { etag: data.etag, ...found };
    }

    throw {
      message: 'We could not find a stored query using that ID',
      status: 404,
    };
  });

export const compareDifferentQueries = (
  previousQuery: StoredQueryObject,
  nextQuery: StoredQueryObject,
): boolean => {
  return !(previousQuery.label === nextQuery.label && previousQuery.url === nextQuery.url);
};

export const validateNextQuery = (query: StoredQueryObject): Error | void => {
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
