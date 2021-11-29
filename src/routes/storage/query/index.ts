import { NextFunction, Request, Response, Router } from 'express';

import createHashString from '@/utils/createHashString';

import {
  endpointRequiresQueryId,
  populateResponseLocals,
  surviveEndpointFailures,
} from './middlewares';
import {
  compareDifferentQueries,
  getStoredQueryById,
  initialiseQueryStorage,
  validateNextQuery,
} from './utils';
import logger from '@/logger';
import { StoredQueriesResponse } from './types';

const queryRouter: Router = Router({
  caseSensitive: true,
  mergeParams: true,
});

// WIP this can be better split into separate routes (with/out queryId)
const route = queryRouter.route('/:queryId?');

route.all([populateResponseLocals, endpointRequiresQueryId]);

/************************************************************************************
 *         Allows users to store, edit and delete their own "search queries"
 ************************************************************************************
 *
 *  GET /query (gets a list of all queries for the current user)
 *  GET /query/{id} (gets a specific query by its ID)
 *  POST /query (stores a query, and responds with the corresponding ID)
 *  PUT /query/{id} (update if exist) idempotent
 *  DELETE /query/{id}
 *  DELETE /query/all (delete all)
 *
 ***********************************************************************************/

route.get(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { storedQueryHandler, queryId } = res.locals;

    const data = await storedQueryHandler().then((response: StoredQueriesResponse) =>
      queryId ? getStoredQueryById(queryId) : response,
    );
    const countData = Object.keys(data.queries).length;

    return res.status(200).send({
      ...data,
      message: `Found ${countData === 1 ? 'a' : countData || 'no'} quer${
        countData === 1 ? 'y' : 'ies'
      }`,
    });
  } catch (error: any) {
    logger.error(`/storage/query--> GET Error: ${error.message}`);
    next(error);
  }
});

route.post(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const nextQuery = req.body;
    await validateNextQuery(nextQuery);

    const { storedQueryHandler } = res.locals;
    const newId = createHashString();
    // TODO: handle existing ID.
    const data = await storedQueryHandler({
      data: [
        {
          op: 'add',
          path: `/queries/${newId}`,
          value: nextQuery,
        },
      ],
      method: 'PATCH',
    });

    res.status(200).send({
      ...data,
      message: 'Query stored successfully',
    });
  } catch (error: any) {
    logger.error(`/storage/query--> POST Error: ${error.message}`);
    next(error);
  }
});

route.put(async (req: Request, res: Response, next: NextFunction) => {
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
        ...data,
        message: 'Query updated successfully',
      });
    }

    return res.status(200).send({
      message: 'The new query matched the existing one',
    });
  } catch (error: any) {
    logger.error(`/storage/query--> PUT Error: ${error.message}`);
    next(error);
  }
});

route.delete(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { etag, storedQueryHandler, queryId } = res.locals;

    if (queryId === 'all') {
      const data = await initialiseQueryStorage(etag);
      return res.status(200).send({
        ...data,
        message: 'All queries deleted',
      });
    }

    const data = await storedQueryHandler({
      data: [
        {
          op: 'remove',
          path: `/queries/${queryId}`,
        },
      ],
      method: 'PATCH',
    });

    return res.status(200).send({
      ...data,
      message: 'Query deleted successfully',
    });
  } catch (error: any) {
    logger.error(`/storage/query--> DELETE Error: ${error.message}`);
    next(error);
  }
});

// Local common error handling;
queryRouter.use(surviveEndpointFailures);

export default queryRouter;
