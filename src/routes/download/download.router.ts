import { Request, Response, Router } from 'express';
import { get } from 'lodash';
import JSZip from 'jszip';
import moment from 'moment';

import { DOWNLOAD_SEQUENCES_ENDPOINT } from '../../constants/endpoint';
import { downloadSequenceFiles } from './download.service';
import logger from '../../logger';
import getAppConfig from '@/config/global';

export const router: Router = Router();

router.post(DOWNLOAD_SEQUENCES_ENDPOINT, async (req: Request, res: Response) => {
  const ids = get(req.body, 'ids', []);
  const config = getAppConfig();

  if (ids.length === 0) {
    return res.status(400).send('No sequence ids were provided.');
  }

  if (ids.length > config.download.sequences_limit) {
    return res
      .status(400)
      .send(
        `Number of sequence ids provided [${ids.length}] exceeds max allowed [${config.download.sequences_limit}].`,
      );
  }

  console.time('zip download');
  try {
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
            logger.info(`Writing file ${file.name} to zip folder ${sequenceId}`);
            zip.file(`${sequenceId}/${file.name}`, file.stream);
          }
        }),
      );
    });
    const zipName = `sequence_files_${moment().format('YYYY-MM-DDTHH:mm')}.zip`;
    res.set('Content-Type', 'application/zip');
    res.attachment(zipName);
    res.set('Access-Control-Expose-Headers', 'Content-Disposition');
    zip
      .generateNodeStream({ type: 'nodebuffer', streamFiles: true })
      .pipe(res)
      .on('error', (err) => {
        logger.info(`Error in zip stream: ${err}`);
        res.status(500).write(err);
      })
      .on('finish', () => {
        logger.info(`Zip completed, sending response.`);
        console.timeEnd('zip download');
        res.status(200).send();
      });
  } catch (error) {
    logger.error(`Error downloading zip file: ${error}`);
    // https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-0.html#unknown-on-catch-clause-bindings
    if (error instanceof Error) {
      return res.status(400).send(error.message);
    }
    return res.status(400).send('An unknown error occurred.');
  }
});
