require('dotenv').config();

import Arranger from '@caravinci/arranger-server';
import { Router } from 'express';

import { BASE_ENDPOINT } from './constants/endpoint';
import app from './server';

const port = Number(process.env.PORT || 8080);

Arranger().then((arrangerRouter: Router) => {
  app.use(BASE_ENDPOINT, arrangerRouter);

  app.listen(port, () => {
    const message = 'Supercluster API started on port: ' + port;
    const line = '-'.repeat(message.length);

    console.info(`\n${line}`);
    console.info(message);
    console.info(`${line}\n`);
  });
});
