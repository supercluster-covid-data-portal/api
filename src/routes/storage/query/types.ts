import { EtagObject, StorageResponse } from '../types/storage';

export type StoredQueryTypeName = 'queries';

export type StoredQueryObject = {
  label: string;
  url: string;
};

export type AllStoredQueriesObject = Record<StoredQueryTypeName, Record<string, StoredQueryObject>>;

export type SingleQueryResponse = StoredQueryObject & EtagObject;
export type StoredQueriesResponse = AllStoredQueriesObject & EtagObject;
