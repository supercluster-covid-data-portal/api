import axios, { AxiosError, AxiosResponse, Method } from 'axios';

import { INITIAL_STORAGE } from './constants';
import { PatchInstruction } from './types/json-patch';
import { OverallStorageObject, StorageResponse, StoredTypeNames } from './types/storage';

const token = `
eyJraWQiOiIyZDM3OTRlOC1iMmJhLTMxYWItYTVmNC0xMjExNDZiZGUxZmMiLCJhbGciOiJSUzI1NiJ9.eyJ0b2tlbktpbmQiOiJiZWFyZXIiLCJqdGkiOiJkMmQzMzUxMC03MzgyLTRhZGMtOWExZi01ZDE1YmVlZmU5NmYiLCJhdWQiOlsiaHR0cDovL2xvY2FsaG9zdDozMDAwIiwiaHR0cHM6Ly93YWxsZXQuc3RhZ2luZy5kbmFzdGFjay5jb20iXSwiYXpwIjoib2ljci1jbGllbnQiLCJpYXQiOjE2MzY2NjEwMzEsImV4cCI6MTYzNjc0NzQzMSwic3ViIjoiNzQyMTY1ZTUtNWZkMy00ZmEwLTkwYmUtODUyZGFiZjY3ODlkIiwiaXNzIjoiaHR0cHM6Ly93YWxsZXQuc3RhZ2luZy5kbmFzdGFjay5jb20iLCJzY29wZSI6InVzZXItc3RvcmFnZSBvcGVuaWQgb2ZmbGluZV9hY2Nlc3MiLCJhY3Rpb25zIjp7fX0.OLjss1PsvF4SW2_KbF0JmGzRlCWexq42Sej-MT5oM1CsA2ZYaP0F0z0nTQSYLEGoxnUcPkWokkT2vW4ynIm96aeu9TOb-SB4iD1VINT6LD3hLGdZKpcsipb1e3sFc0y-waZPt4A-MDizcWPfMZVyjqX6N4EIAuNyqSGwuBswI73Cm_4OnEUuoX7_JamPsE9_fP3LuZSg26bvR9GBouW6QnpqZPEevzFmCorVx34ValNW046-KalhtIdo6dmaJIZdPKcYvrzBK13vxU5RjxeJfqtmu2gymWn_f-nayROijRSQ9c2LqvczuufnnTuM5U9aL3qT3ZLURhqUWIpprmf_6Q
`.trim();

const needsData = (method: Method) => ['PATCH', 'POST', 'PUT'].includes(method.toUpperCase());

export const fetchStorage = ({
  data,
  etag,
  method = 'GET',
}: {
  data?: OverallStorageObject | PatchInstruction | {};
  etag?: string;
  method?: Method;
} = {}): Promise<StorageResponse> => {
  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json-patch+json',
    ...(etag && { 'If-Match': etag }),
  };
  const url = `https://wallet.staging.dnastack.com/clients/oicr-client/users/742165e5-5fd3-4fa0-90be-852dabf6789d/properties/`;

  return axios({
    ...(needsData(method) && { data }),
    headers,
    method,
    url,
  })
    .then((response: AxiosResponse) => {
      const responseETag = response?.headers?.etag?.replaceAll('"', '');

      return response?.data
        ? {
            data: response?.data,
            etag: responseETag,
          }
        : response.status === 204
        ? fetchStorage({
            etag: responseETag,
          })
        : (console.warn('Something may require attention in this response', response), response);
    })
    .catch(async (error: AxiosError) => {
      // TODO: initialise new users
      // const initialised =
      //   jsonError.status === 404 &&
      //   method.toUpperCase() === 'GET' &&
      //   (await fetchStorage({
      //     data: INITIAL_STORAGE,
      //     method: 'PUT',
      //   }));
      // if (initialised) return initialised;

      throw error;
    });
};

export const nukeStorage = (): Promise<StorageResponse> =>
  fetchStorage({
    data: {},
    method: 'PUT',
  });
