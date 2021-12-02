import { URL } from 'url';
import urlJoin from 'url-join';
import fetch from 'node-fetch';

import getAppConfig, { AppConfig } from '../../config/global';
import logger from '../../logger';
import testData from './testData';

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

interface DRSMetada {
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

const fetchDRSMetadata = async (drsUri: string) => {
  const response = await fetch(drsUri)
    .then((res) => {
      if (res.status !== 200) {
        throw new Error(`Response from drs url failed with ${res.status} error.`);
      }
      return res.json();
    })
    .then((json) => {
      return {
        accessUrls: getAccessUrl(json.access_methods),
        name: json.name,
      } as DRSMetada;
    })
    .catch((err) => {
      logger.info(`Error fetching metadata: ${err}`);
      throw err;
    });
  return response;
};

const downloadFromAccessUrl = async (url: string) => {
  const response = await fetch(url);
  if (response.status !== 200) {
    throw new Error(`Download from access url failed with ${response.status} error.`);
  }
  return response.body;
};

const retrieveFiles = async (drsInfo: { sequenceId: string; drsPath: string }[]) => {
  // download the https access urls for each file
  const sequenceInfo = await Promise.all(
    drsInfo.map(async (drsUrl) => {
      const accessUrlInfo = await fetchDRSMetadata(drsUrl.drsPath);
      return {
        sequenceId: drsUrl.sequenceId,
        accessUrlInfo,
      };
    }),
  );

  const downloaded = sequenceInfo.map(
    async (sequence: { sequenceId: string; accessUrlInfo: DRSMetada }) => {
      try {
        // retrieve file from access url
        // return from first url that resolves
        const stream: NodeJS.ReadableStream = await Promise.any(
          sequence.accessUrlInfo.accessUrls.map((u: any) =>
            downloadFromAccessUrl(u.access_url.url),
          ),
        );
        logger.info(`returning stream for ${sequence.accessUrlInfo.name}`);
        return {
          name: sequence.accessUrlInfo.name,
          stream,
        };
      } catch (err) {
        if (err instanceof AggregateError) {
          logger.error(
            `Multiple errors reported downloading from access url for ${sequence.sequenceId}: ${err.errors}`,
          );
          throw err.errors[0];
        } else {
          logger.error(`Error on ${sequence.sequenceId}: ${err}`);
          throw err;
        }
      }
    },
  );
  const files = await Promise.all(downloaded);
  return files;
};

export const downloadSequenceFiles = async (ids: string[]) => {
  // TODO: add query for drs data, returns drs_filepath and file_id
  const config = await getAppConfig();
  const queryResult = testData.slice(0, 2);

  // if any download fails, the zip should not be attempted
  const fileResults = await Promise.all(
    queryResult.map(async (result) => {
      // construct url from drs_filepath info
      const fileInfo = result.files.map((f) => ({
        sequenceId: result.sequence_id,
        drsPath: parseDRSPath(f.drs_filepath, config),
      }));

      const files = await retrieveFiles(fileInfo);
      return {
        sequenceId: result.sequence_id,
        files,
      };
    }),
  );

  // if no files are found for any of the sequence ids we will send an error to the ui
  if (fileResults.every((res) => res.files.length === 0)) {
    throw new Error('No files found for the requested sequence ids.');
  }
  logger.info(`Successfully retrieved files.`);
  return fileResults;
};
