import path from 'path';

import manifest from '@/../package.json';

const swaggerJsdocConfig = {
  definition: {
    openapi: '3.0.2',
    info: {
      title: manifest.name,
      version: manifest.version,
      description: manifest.description,
    },
  },
  apis: [
    path.resolve(
      process.cwd(),
      process.env.NODE_ENV === 'production'
        ? 'dist/routes/**/*.router.js'
        : 'src/routes/**/*.router.ts',
    ),
  ],
};

export default swaggerJsdocConfig;
