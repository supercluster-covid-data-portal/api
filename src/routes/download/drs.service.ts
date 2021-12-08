import urlJoin from 'url-join';
import axios from 'axios';

import getAppConfig from '@/config/global';
import logger from '@/logger';
import {
  AccessUrl,
  DownloadFilesFunc,
  DRSMetada,
  DRSProtocols,
  ParseDRSPath,
  SequenceResult,
} from './types';

export const parseDRSPath: ParseDRSPath = (filepath: string) => {
  try {
    const { hostname, pathname } = new URL(filepath);
    return { domain: hostname, objectId: pathname };
  } catch (err) {
    throw new Error('Could not parse DRS path!');
  }
};

export const buildDRSUrl = (drsUrl: string) => {
  const {
    drs: { objectPath, protocol },
  } = getAppConfig();
  const { domain, objectId } = parseDRSPath(drsUrl);
  return urlJoin(`${protocol}://${domain}`, objectPath, objectId);
};

const filterHttpsUrls: (accessMethods: AccessUrl[]) => AccessUrl[] = (accessMethods) => {
  // return all https access urls. at least one of this type is guaranteed per drs path
  const httpsUrls = accessMethods.filter((method) => method.type === DRSProtocols.HTTPS);
  if (!httpsUrls.length) {
    throw new Error('No https access urls found.');
  }
  return httpsUrls;
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
        accessUrls: filterHttpsUrls(data.access_methods),
        name: data.name,
      } as DRSMetada;
    })
    .catch((err) => {
      logger.debug(`Error fetching metadata: ${err}`);
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

export const downloadFilesFromDRS: DownloadFilesFunc = async (sequence: SequenceResult) => {
  // construct callable drsPath from drs_filepath info
  const fileInfo = sequence.files.map((f: any) => ({
    drsPath: buildDRSUrl(f.drs_filepath),
  }));

  // download the https access urls for each file
  const sequenceInfo = await Promise.all(
    fileInfo.map(async (drsUrl) => {
      const accessUrlInfo = await fetchDRSMetadata(drsUrl.drsPath);
      return {
        sequenceId: sequence.sequenceId,
        accessUrlInfo,
      };
    }),
  );
  const downloaded = sequenceInfo.map(async (sequence) => {
    try {
      // retrieve file from access url
      // return from first url that resolves
      const stream = (await Promise.any(
        sequence.accessUrlInfo.accessUrls.map((u: any) => downloadFromAccessUrl(u.access_url.url)),
      )) as unknown as NodeJS.ReadableStream;
      logger.debug(`returning stream for ${sequence.accessUrlInfo.name}`);
      return {
        name: sequence.accessUrlInfo.name,
        stream,
      };
    } catch (err) {
      if (err instanceof AggregateError) {
        logger.debug(
          `Multiple errors reported downloading from access url for ${sequence.sequenceId}: ${err.errors}`,
        );
        throw err.errors[0];
      } else {
        logger.debug(`Error on ${sequence.sequenceId}: ${err}`);
        throw err;
      }
    }
  });
  const files = await Promise.all(downloaded);
  return files;
};
