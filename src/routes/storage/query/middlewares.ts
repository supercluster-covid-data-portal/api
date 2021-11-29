import { Method } from 'axios';
import { NextFunction, Request, Response } from 'express';
import { fetchQueries, getStoredQueryById, methodRequiresQueryId } from './utils';

export const populateResponseLocals = async (req: Request, res: Response, next: NextFunction) => {
  const etag = req.header('If-Match') || '';
  const tokenBearer = req.header('Authorization') || '';
  const userId = req.header('UserID') || '';

  const queryId = req.params.queryId;

  res.locals = {
    ...res.locals,
    etag,
    storedQueryHandler: fetchQueries(etag, tokenBearer, userId),
    queryId,
    userId,
  };

  next();
};

export const endpointRequiresQueryId = async (req: Request, res: Response, next: NextFunction) => {
  const { storedQueryHandler, queryId } = res.locals;

  if (methodRequiresQueryId(req.method.toUpperCase() as Method)) {
    try {
      if (queryId) {
        const previousQuery =
          queryId !== 'all' && (await storedQueryHandler().then(getStoredQueryById(queryId)));

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

  next();
};

export const surviveEndpointFailures = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  switch (error.status) {
    case 400:
    case 401:
    case 403:
      return res.status(error.status).send({
        message: error.message,
      });

    case 404:
      return res.status(400).send({
        message: 'We could not find a stored query using that ID',
      });

    default:
      return next(error);
  }
};
