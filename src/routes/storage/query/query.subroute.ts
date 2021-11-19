import { AxiosError, Method } from 'axios';
import { NextFunction, Request, Response, Router } from 'express';

import createHashString from '../../../utils/createHashString';
import {
  compareDifferentQueries,
  fetchQueries,
  getQueryById,
  initialiseQueryStorage,
  needsQueryId,
  validateNextQuery,
} from './utils';

export const router: Router = Router({
  caseSensitive: true,
});

/************************************************************************************
 *         Allows users to store, edit and delete their own "search queries"
 ************************************************************************************
 *
 *  GET /query (gets a list of all queries for the current user)
 *  GET /query/{id} (gets an individual query by its ID)
 *  POST /query (stores a query, and responds with the corresponding ID)
 *  PUT /query/{id} (update if exist) idempotent
 *  DELETE /query/{id}
 *  DELETE /query/all (delete all)
 *
 ***********************************************************************************/

router
  .route('/query/:queryId?')

  .all(async (req, res, next) => {
    const queryId = req.params.queryId;

    if (needsQueryId(req.method.toUpperCase() as Method)) {
      try {
        if (queryId) {
          const previousQuery = queryId !== 'all' && (await getQueryById(queryId));

          if (previousQuery) {
            res.locals = {
              ...res.locals,
              previousQuery,
            };
          }
        } else {
          return res.status(400).send({
            message: 'This request needs a valid query ID',
          });
        }
      } catch (error: any) {
        console.error(error);
        next(error);
      }
    }

    const etag = req.header('If-Match') || '';

    res.locals = {
      ...res.locals,
      etag,
      storedQueryHandler: fetchQueries(etag),
      queryId,
    };

    next();
  })

  .get(async (req, res, next) => {
    try {
      const { storedQueryHandler, queryId } = res.locals;

      const data = [undefined, 'all'].includes(queryId)
        ? await storedQueryHandler()
        : await getQueryById(queryId);

      const countData = Object.keys(data.queries).length;

      return res.status(200).send({
        data,
        message: `Found ${countData === 1 ? 'a' : countData || 'no'} quer${
          countData === 1 ? 'y' : 'ies'
        }`,
      });
    } catch (error: any) {
      console.error(error.message);
      next(error);
    }
  })

  .post(async (req, res, next) => {
    try {
      const nextQuery = req.body;
      await validateNextQuery(nextQuery);

      const { storedQueryHandler } = res.locals;
      const newId = createHashString();
      // TODO: handle existing ID.
      const data = await storedQueryHandler({
        data: JSON.stringify([
          {
            op: 'add',
            path: `/queries/${newId}`,
            value: nextQuery,
          },
        ]),
        method: 'PATCH',
      });

      res.status(200).send({
        data,
        message: 'Query stored successfully',
      });
    } catch (error: any) {
      console.error(error.message);
      next(error);
    }
  })

  .put(async (req, res, next) => {
    try {
      const nextQuery = req.body;
      await validateNextQuery(nextQuery);

      const { previousQuery, queryId, storedQueryHandler } = res.locals;

      if (compareDifferentQueries(previousQuery, nextQuery)) {
        const data = await storedQueryHandler({
          data: [
            {
              op: 'replace',
              path: `/queries/${queryId}`,
              value: nextQuery,
            },
          ],
          method: 'PATCH',
        });

        return res.status(200).send({
          data,
          message: 'Query updated successfully',
        });
      }

      return res.status(200).send({
        message: 'The new query matched the existing one',
      });
    } catch (error: any) {
      console.error(error.message);
      next(error);
    }
  })

  .delete(async (req, res, next) => {
    try {
      const { etag, storedQueryHandler, queryId } = res.locals;

      if (queryId === 'all') {
        const data = await initialiseQueryStorage(etag);
        return res.status(200).send({
          data,
          message: 'All queries deleted',
        });
      }

      const data = await storedQueryHandler({
        data: JSON.stringify([
          {
            op: 'remove',
            path: `/queries/${queryId}`,
          },
        ]),
        method: 'PATCH',
      });

      return res.status(200).send({
        data,
        message: 'Query deleted successfully',
      });
    } catch (error: any) {
      console.error(error.message);
      next(error);
    }
  });

/************************************************************************************
 *                    Endpoint-Specific Common Error Handling
 ***********************************************************************************/

router.use((error: any, req: Request, res: Response, next: NextFunction) => {
  return error.status === 400
    ? res.status(400).send({
        message: error.message,
      })
    : error.status === 404
    ? res.status(400).send({
        message: 'We could not find a stored query using that ID',
      })
    : next(error);
});
