import { Router } from 'express';

import { getFilesWithKeyword } from '../../utils/getFilesWithKeyword';
import { fetchStorage, nukeStorage } from './utils';

// Export module for registering router in express app
export const router: Router = Router();
const storageRouter = router;

router
  .route('/storage/:command?')
  .all(async (req, res, next) => {
    try {
      res.locals = {
        ...res.locals,
        hasCommand: ['boom'].includes(req.params.command?.toLowerCase() || ''),
      };

      next();
    } catch (error) {
      next(error);
    }
  })
  .get(async (req, res, next) => {
    try {
      const data = await fetchStorage();

      return res.status(200).send(data);
    } catch (error) {
      next(error);
    }
  })
  .delete(async (req, res, next) => {
    try {
      if (res.locals.hasCommand) {
        const data = await nukeStorage();

        return res.status(200).send(data);
      }

      return res.status(401).send({
        message: 'No can do, Captain!',
      });
    } catch (error) {
      next(error);
    }
  });

getFilesWithKeyword('subroute', __dirname).forEach((file: string) => {
  const { router } = require(file);

  router
    ? storageRouter.use('/storage', router)
    : console.warn(`${file} doesn't seen to export a 'router'`);
});
