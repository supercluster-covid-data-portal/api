import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';

import { BASE_ENDPOINT, HEALTH_ENDPOINT, SWAGGER_ENDPOINT } from './constants/endpoint';
import logger from './logger';
import apiRoutes, { healthRouter, swaggerRouter } from './routes';

const app = express();

/************************************************************************************
 *                              Basic Express Middlewares
 ***********************************************************************************/

app.set('json spaces', 4);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);

// Handle logs in console during development
app.use(
  morgan('dev', {
    skip: (req, res) => {
      // logs everything but health checks on dev, errors only otherwise
      return process.env.NODE_ENV === 'development' || process.env.DEBUG === 'true'
        ? req.originalUrl.includes(HEALTH_ENDPOINT)
        : res.statusCode < 400;
    },
  }),
);

// Handle security and origin in production
if (process.env.NODE_ENV === 'production') {
  app.use(helmet());
  app.disable('x-powered-by');
}

/************************************************************************************
 *                               Register all routes
 ***********************************************************************************/

app.use(BASE_ENDPOINT, apiRoutes());
app.use(HEALTH_ENDPOINT, healthRouter);
app.use(SWAGGER_ENDPOINT, swaggerRouter);

/************************************************************************************
 *                               Express Error Handling
 ***********************************************************************************/

app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (error.response) {
    if (error.response.status === 409) {
      return res.status(400).send({
        message: 'Conflict updating the information',
      });
    }
  } else if (error.request) {
    // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
    // http.ClientRequest in node.js
    logger.error(error.request);
  } else {
    logger.error(error.message);
  }

  return res.status(error.status || 500).json({
    errorName: error.name,
    message: error.message,
    ...(error.stack && { stack: error.stack }),
  });
});

export default app;
