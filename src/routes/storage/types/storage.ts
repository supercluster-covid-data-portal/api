import { AllStoredQueriesObject } from '../query/types';

export type OverallStorageObject = AllStoredQueriesObject; // & AllStored<TYPEs>Object etc.

export interface AllStorageDataObject {
  data: OverallStorageObject;
}

export interface EtagObject {
  etag: string;
}

export type StorageResponse = AllStorageDataObject & EtagObject;

export enum StorageTypes {
  STORED_QUERIES = 'query',
}
