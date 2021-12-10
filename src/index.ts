require('dotenv').config({
  debug: process.env.NODE_ENV === 'development',
});

import Arranger from '@overture-stack/arranger-server';
import { Router } from 'express';

import { BASE_ENDPOINT, HEALTH_ENDPOINT } from './constants/endpoint';
import { getEsClient } from './esClient';
import app from './server';

const port = Number(process.env.PORT || 4000);

Arranger({ pingPath: HEALTH_ENDPOINT }).then((arrangerRouter: Router) => {
  app.use(BASE_ENDPOINT, arrangerRouter);

  app.listen(port, () => {
    const message = 'Supercluster API started on port: ' + port;
    const line = '-'.repeat(message.length);

    console.info(`\n${line}`);
    console.info(message);
    console.info(`${line}\n`);
  });
});

// init elasticsearch
getEsClient();
