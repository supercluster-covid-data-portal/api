import getAppConfig from '../../config/global';
import logger from '../../logger';
import { getEsClient } from '@/esClient';
import { get } from 'lodash';
import { downloadFromAccessUrl, DRSMetada, fetchDRSMetadata, parseDRSPath } from './drs.service';

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
        const stream = (await Promise.any(
          sequence.accessUrlInfo.accessUrls.map((u: any) =>
            downloadFromAccessUrl(u.access_url.url),
          ),
        )) as unknown as NodeJS.ReadableStream;
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

const fetchSequenceData = async (ids: string[], index: string) => {
  const esClient = await getEsClient();
  const response: any = await esClient
    .search({
      index,
      body: {
        query: {
          bool: {
            filter: {
              terms: {
                sequence_id: ids,
              },
            },
          },
        },
      },
    })
    .catch((err) => {
      logger.error('ES query failed: ', err);
      throw new Error('ES query failed, cannot retrieve sequence file info.');
    });

  const queryResults: any[] = get(response, 'body.hits.hits', []).map((result: any) => {
    const files = get(result, '_source.files');
    return {
      sequenceId: get(result, '_id'),
      files,
    };
  });
  return queryResults;
};

const appendEmptySequence = (sequenceId: string, fileResults: any[]) =>
  fileResults.concat({ sequenceId, files: [] });

export const downloadSequenceFiles = async (ids: string[]) => {
  const config = await getAppConfig();
  const sequenceData = await fetchSequenceData(ids, config.es.index);
  // if any download fails, the zip should not be attempted
  let fileResults = await Promise.all(
    sequenceData.map(async (result) => {
      // construct url from drs_filepath info
      const fileInfo = result.files.map((f: any) => ({
        sequenceId: result.sequenceId,
        drsPath: parseDRSPath(f.drs_filepath, config),
      }));

      const files = await retrieveFiles(fileInfo);
      return {
        sequenceId: result.sequenceId,
        files,
      };
    }),
  );

  // if no files are found for any of the sequence ids we will send an error to the ui
  if (fileResults.every((res) => res.files.length === 0)) {
    logger.info('No files found for the requested sequence ids.');
    throw new Error('No files found.');
  }
  ids.map((id) => {
    // if there are sequences with files, make sure any sequences that have no files still show in the zip (will be an empty folder)
    // this is just so the user knows the sequence was queried, but no files were returned
    if (!fileResults.find((result) => result.sequenceId === id)) {
      fileResults = appendEmptySequence(id, fileResults);
    }
  });
  logger.info(`Successfully retrieved files.`);
  return fileResults;
};
