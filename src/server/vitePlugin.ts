import express from 'express';
import { apiRouter } from './apiRouter.ts';
import type { Plugin } from 'vite';

export function userManagementApiPlugin(): Plugin {
  return {
    name: 'user-management-api',
    configureServer(server) {
      const app = express();
      app.use(express.json());
      app.use(express.urlencoded({ extended: true }));
      app.use('/api', apiRouter);

      server.middlewares.use(app);
    }
  };
}
