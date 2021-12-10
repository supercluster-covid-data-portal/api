import { NextFunction, Request, Response, Router } from 'express';
import urlJoin from 'url-join';

import getAppConfig from '@/config/global';
import { STORAGE_ENDPOINT } from '@/constants/endpoint';

import { STORAGE_TYPES } from './constants';
import queryRouter from './query';
import { StorageTypes } from './types';
import { fetchStorage, nukeStorage } from './utils';

const router: Router = Router({
  mergeParams: true,
});

// nested 'storage' routes
router.use(`/${StorageTypes.STORED_QUERIES}`, queryRouter);

/************************************************************************************
 *                               '/storage' root
 * Exposes a set of convenience endpoints, to assist development and troubleshooting
 * **Note: these are hidden behind FLAG__STORAGE_ROOT_ADMIN
 ***********************************************************************************/

const storageRoute = router.route('/:storageType?');

storageRoute.all(async (req: Request, res: Response, next: NextFunction) => {
  const config = getAppConfig();
  const storageType = req.params.storageType?.toLowerCase() as StorageTypes;
  const tokenBearer = req.header('Authorization') || '';
  const userId = req.header('UserID') || '';

  try {
    if (STORAGE_TYPES.includes(storageType) || config.flag.storageRootAdmin) {
      res.locals = {
        ...res.locals,
        hasCommand: ['boom'].includes(storageType || ''), // convoluted failsafe to prevent accidental nukes
        tokenBearer,
        userId,
      };

      return next();
    }

    return storageType
      ? next('route')
      : res.status(200).send('Storage endpoint is functioning correctly...');
  } catch (error) {
    next(error);
  }
});

storageRoute.get(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await fetchStorage();

    return res.status(200).send(data);
  } catch (error) {
    next(error);
  }
});

// expects DELETE:`/storage/boom` and FLAG__STORAGE_ROOT_ADMIN in order to work
storageRoute.delete(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { hasCommand, tokenBearer, userId } = res.locals;

    if (hasCommand) {
      const data = await nukeStorage({ tokenBearer, userId });

      return res.status(200).send(data);
    }

    return res.status(401).send({
      message: 'No can do, Captain!',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
