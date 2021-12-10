import { get } from 'lodash';

import getAppConfig from '../../config/global';
import logger from '../../logger';
import { getEsClient } from '@/esClient';
import { downloadFilesFromDRS } from './drs.service';
import baseConfig from '../../../configs/base.json';
import JSZip from 'jszip';
import { SequenceResult } from './types';

type FetchSequenceDataFunc = (ids: string[]) => Promise<SequenceResult[]>;
const fetchSequenceData: FetchSequenceDataFunc = async (ids: string[]) => {
  const esClient = await getEsClient();
  const response: any = await esClient
    .search({
      index: baseConfig.index,
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

  const queryResults: SequenceResult[] = get(response, 'body.hits.hits', []).map((result: any) => {
    const files = get(result, '_source.files', []);
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
  const config = getAppConfig();
  if (!ids.length || ids.length > config.download.sequences_limit) {
    throw new Error('Invalid number of sequences requested for download!');
  }
  const sequenceData = await fetchSequenceData(ids);
  // if any download fails, the zip should not be attempted
  let fileResults = await Promise.all(
    sequenceData.map(async (seq) => {
      const downloadedFiles = await downloadFilesFromDRS(seq);
      return {
        sequenceId: seq.sequenceId,
        files: downloadedFiles,
      };
    }),
  );

  // if no files are found for any of the sequence ids we will send an error to the ui
  if (fileResults.every((res) => res.files.length === 0)) {
    logger.debug('No files found for the requested sequence ids.');
    throw new Error('No files found.');
  }
  ids.map((id) => {
    // if there are sequences with files, make sure any sequences that have no files still show in the zip (will be an empty folder)
    // this is just so the user knows the sequence was queried, but no files were returned
    if (!fileResults.find((result) => result.sequenceId === id)) {
      fileResults = appendEmptySequence(id, fileResults);
    }
  });
  logger.debug(`Successfully retrieved files.`);
  return fileResults;
};

export const buildSequenceAssets = async (ids: string[]) => {
  const assets = await downloadSequenceFiles(ids);
  const zip = new JSZip();
  await assets.map(async (asset) => {
    const sequenceId = (await asset).sequenceId;
    // writing the files to a separate folder for each sequence id
    // if there are no files for an individual id, the folder is created but will be empty so the user is aware
    zip.folder(sequenceId);
    await Promise.all(
      asset.files.map((file) => {
        if (file) {
          logger.debug(`Writing file ${file.name} to zip folder ${sequenceId}`);
          zip.file(`${sequenceId}/${file.name}`, file.stream);
        }
      }),
    );
  });
  return zip;
};
