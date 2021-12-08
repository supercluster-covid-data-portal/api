import axios, { AxiosError, AxiosResponse, Method } from 'axios';

import getAppConfig from '@/config/global';

import { INITIAL_STORAGE } from './constants';
import { OverallStorageObject, StorageResponse } from './types';
import { PatchInstruction } from './types/json-patch';

const needsData = (method: Method) => ['PATCH', 'POST', 'PUT'].includes(method.toUpperCase());

export const fetchStorage = async ({
  data,
  etag,
  method = 'GET',
  tokenBearer,
  userId,
}: {
  data?: OverallStorageObject | PatchInstruction | {};
  etag?: string;
  method?: Method;
  tokenBearer?: string;
  userId?: string;
} = {}): Promise<StorageResponse> => {
  const headers = {
    'Content-Type': 'application/json-patch+json',
    ...(etag && { 'If-Match': etag }),
    ...(tokenBearer && { Authorization: tokenBearer }),
  };

  const config = getAppConfig();
  const url = `${config.auth.apiRootUrl}/clients/${config.auth.clientId}/users/${userId}/properties/`;

  return axios({
    ...(needsData(method) && { data }),
    headers,
    method,
    url,
  })
    .then((response: AxiosResponse<any, any>) => {
      const responseETag = response?.headers?.etag?.replaceAll('"', '');

      return response?.data
        ? {
            data: response.data,
            etag: responseETag,
          }
        : response.status === 204
        ? fetchStorage({
            etag: responseETag,
            tokenBearer,
            userId,
          })
        : // expecting StorageResponse, but obviously something went wrong
          (console.warn('Something may require attention in this response', response),
          response as unknown as StorageResponse);
    })
    .catch(async (error: AxiosError) => {
      const initialised =
        error.response?.status === 404 &&
        method.toUpperCase() === 'GET' &&
        (await fetchStorage({
          data: INITIAL_STORAGE,
          etag,
          method: 'PUT',
          tokenBearer,
          userId,
        }));

      if (initialised) return initialised;

      throw error.toJSON();
    });
};

export const nukeStorage = ({ tokenBearer = '', userId = '' }): Promise<StorageResponse> =>
  fetchStorage({
    data: {},
    method: 'PUT',
    tokenBearer,
    userId,
  });
