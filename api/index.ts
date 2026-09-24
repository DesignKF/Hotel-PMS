import express, { Request, Response } from 'express';
import { apiRouter } from '../src/server/apiRouter.ts';

const app = express();

app.disable('x-powered-by');
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', runtime: 'vercel-serverless' });
});

// Support both '/api' and direct root routes
app.use('/api', apiRouter);
app.use('/', apiRouter);

export default app;
