import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const requiredProductionVariables = ['JWT_SECRET', 'ADMIN_PASSWORD'];
const missingVariables = requiredProductionVariables.filter(name => !process.env[name]);

if (missingVariables.length > 0) {
  console.warn(
    `[PMS Warning] Production environment variables not set: ${missingVariables.join(', ')}. Using default credentials.`
  );
}

const { apiRouter } = await import('./src/server/apiRouter.ts');
const app = express();
const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const staticDirectory = path.join(currentDirectory, 'dist');
const port = Number(process.env.PORT || 3000);

app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

app.get('/api/health', (_request, response) => {
  response.status(200).json({ status: 'ok' });
});
app.use('/api', apiRouter);

app.use(express.static(staticDirectory));
app.get('*', (request, response, next) => {
  if (request.path.startsWith('/api/')) {
    next();
    return;
  }
  response.sendFile(path.join(staticDirectory, 'index.html'));
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Moshi Urban PMS is listening on port ${port}`);
});
