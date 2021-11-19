import { AxiosError, AxiosResponse } from 'axios';

import { AllStoredQueriesObject, StoredQueryTypeName } from '../query/types';

export type StoredTypeNames = StoredQueryTypeName;

export type OverallStorageObject = {
  queries: AllStoredQueriesObject;
};

export interface AllStorageDataObject {
  data: OverallStorageObject;
}

export interface EtagObject {
  etag: string;
}

export type StorageResponse = AllStorageDataObject & EtagObject extends AxiosResponse<any, any>