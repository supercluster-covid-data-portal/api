import urlJoin from 'url-join';
import axios from 'axios';

import { AppConfig } from '@/config/global';
import logger from '@/logger';

// types from https://ga4gh.github.io/data-repository-service-schemas/preview/release/drs-1.0.0/docs/#_accessmethod
// will only be using https
enum AccessType {
  HTTPS = 'https',
  S3 = 's3',
  GS = 'gs',
  FTP = 'ftp',
  FILE = 'file',
  GSIFTP = 'gsiftp',
  GLOBUS = 'globus',
  HTSGET = 'htsget',
}

interface AccessMethod {
  type: AccessType;
  access_url: { url: string };
  region: string;
}

export interface DRSMetada {
  name: string;
  accessUrls: AccessMethod[];
}

export const parseDRSPath = (filepath: string, config: AppConfig) => {
  const toUri = new URL(filepath);
  const domain = toUri.hostname;
  const objectId = toUri.pathname;
  return urlJoin(`${config.drs.protocol}://${domain}`, config.drs.objectPath, objectId);
};

const getAccessUrl: (accessMethods: AccessMethod[]) => AccessMethod[] = (accessMethods) => {
  // return all https access urls. at least one of this type is guaranteed per drs path
  return accessMethods.filter((method) => method.type === AccessType.HTTPS);
};

export const fetchDRSMetadata = async (drsUri: string) => {
  const response = await axios
    .get(drsUri)
    .then((res) => {
      if (res.status !== 200) {
        throw new Error(`Response from drs url failed with ${res.status} error.`);
      }
      return res.data;
    })
    .then((data) => {
      return {
        accessUrls: getAccessUrl(data.access_methods),
        name: data.name,
      } as DRSMetada;
    })
    .catch((err) => {
      logger.info(`Error fetching metadata: ${err}`);
      throw err;
    });
  return response;
};

export const downloadFromAccessUrl = async (url: string) => {
  const response = await axios.get(url);
  if (response.status !== 200) {
    throw new Error(`Download from access url failed with ${response.status} error.`);
  }
  return response.data;
};
