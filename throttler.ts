import { Request, Response, NextFunction } from 'express';
import pidusage from 'pidusage';

interface ThrottleOptions {
  highCpuThreshold: number; // percentage, e.g., 80 for 80%
  highMemoryThreshold: number; // in bytes, e.g., 1 GB as 1 * 1024 * 1024 * 1024
}

class DynamicThrottler {
  private options: ThrottleOptions;

  constructor(options: ThrottleOptions) {
    this.options = options;
  }

  shouldThrottle(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      pidusage(process.pid, (err, stats) => {
        if (err) {
          reject(err);
          return;
        }

        const cpuOverloaded = stats.cpu > this.options.highCpuThreshold;
        const memoryOverloaded = stats.memory > this.options.highMemoryThreshold;

        resolve(cpuOverloaded || memoryOverloaded);
      });
    });
  }

  middleware(): (req: Request, res: Response, next: NextFunction) => void {
    return async (req: Request, res: Response, next: NextFunction) => {
      const shouldThrottle = await this.shouldThrottle();

      if (shouldThrottle) {
        res.status(429).send('Server is too busy. Please try again later.');
      } else {
        next();
      }
    };
  }
}

export default DynamicThrottler;
