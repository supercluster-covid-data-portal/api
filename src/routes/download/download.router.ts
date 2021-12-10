import { Request, Response, Router } from 'express';
import { get } from 'lodash';
import moment from 'moment';

import { buildSequenceAssets } from './download.service';
import logger from '../../logger';
import getAppConfig from '@/config/global';

const router: Router = Router();

router.post('/', async (req: Request, res: Response) => {
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
    const zip = await buildSequenceAssets(ids);
    const zipName = `sequence_files_${moment().format('YYYY-MM-DDTHH:mm')}.zip`;
    res.set('Content-Type', 'application/zip');
    res.attachment(zipName);
    res.set('Access-Control-Expose-Headers', 'Content-Disposition');
    zip
      .generateNodeStream({ type: 'nodebuffer', streamFiles: true })
      .pipe(res)
      .on('error', (err) => {
        logger.debug(`Error in zip stream: ${err}`);
        res.status(500).write(err);
      })
      .on('finish', () => {
        logger.debug(`Zip completed, sending response.`);
        console.timeEnd('zip download');
        res.status(200).send();
      });
  } catch (error) {
    logger.debug(`Error handling sequence file download: ${error}`);
    // https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-0.html#unknown-on-catch-clause-bindings
    if (error instanceof Error) {
      return res.status(400).send(error.message);
    }
    return res.status(400).send('An unknown error occurred.');
  }
});

export default router;
