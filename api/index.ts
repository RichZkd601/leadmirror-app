import type { Request, Response } from 'express';
import { createServer } from '../server/index';

const app = createServer();

export default function handler(req: Request, res: Response) {
  return new Promise((resolve, reject) => {
    app(req, res, (err: any) => {
      if (err) {
        reject(err);
      } else {
        resolve(undefined);
      }
    });
  });
}
