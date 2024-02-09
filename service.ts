import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import pidusage from 'pidusage';
import circuitBreaker from 'opossum';
import pinoHttp from "pino-http"
import expressPino from 'express-pino-logger';
import { v4 as uuidv4 } from 'uuid';


import DynamicThrottler from './throttler';
//

// Initialize express app
const app = express();
//const port = 3000;

const Semaphore = require('semaphore');
const https = require('https');
const basicAuth = require('express-basic-auth');
const rateLimit = require('express-rate-limit');


// Authorizer for basic authentication
const myAuthorizer = (username: string, password: string) => {
  const userMatches = basicAuth.safeCompare(username, "Admin");
  const passwordMatches = basicAuth.safeCompare(password, "1234");
  return userMatches & passwordMatches;
};

// Apply a rate limit to prevent more than 1 request per 10 seconds per client
const limiter = rateLimit({
  windowMs: 10 * 1000, // 10 seconds
  max: 10, // Limit each IP to x request per windowMs
  message: 'You have exceeded 1 request in 10 seconds limit!', 
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Initialize DynamicThrottler with thresholds
const throttler = new DynamicThrottler({
  highCpuThreshold: 80, // CPU usage threshold
  highMemoryThreshold: 1 * 1024 * 1024 * 1024, // Memory threshold (1 GB)
});

//Semaphore for limiting the upload to a max o 5 simultaneously
const semaphore = new Semaphore(5);

// Load SSL certificates
const httpsOptions = {
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.pem')
};

//Set uuid usage
app.use((req, res, next) => {
  req.id = uuidv4(); // Assign a unique ID to each request
  next();
});

// Initialize express-pino-logger with custom serializers to include the request ID
app.use(expressPino({
  serializers: {
    req(req) {
      req.id = req.raw.id;
      return req;
    }
  }
}));

// Use Basic authentication in express app
app.use(basicAuth({
  authorizer: myAuthorizer,
  challenge: true,
}));


// Use the throttler middleware in Express app
app.use(throttler.middleware());

// Apply the rate limiter middleware to all requests
app.use(limiter);

// Set storage engine for upload files
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    const uploadPath = path.join(__dirname, '/uploads/');
    // Ensure upload directory exists
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: function(req, file, cb) {
    cb(null, file.fieldname + '-' + uuidv4() + path.extname(file.originalname));
  }
});

// Initialize upload middleware with storage engine and file size limit
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 300 * 1024 * 1024 }, // 250 MB
});

// Configure circuit breaker options
const options = {
  timeout: 5000, // If our function takes longer than 5 seconds, trigger a failure
  errorThresholdPercentage: 50, // If 50% of requests fail, open the circuit
  resetTimeout: 10000, // After 10 seconds, try again.
};

// File processing function to be wrapped by the circuit breaker
async function processFile(req: express.Request, res: express.Response) {
  return new Promise((resolve, reject) => {
    // Simulate file processing with a setTimeout
    setTimeout(() => {
      // Here, replace with actual file processing logic and decide to resolve or reject based on the outcome
      resolve(`File ${req.file?.originalname} is being processed.`);
    }, 1000);
  });
}

// Create the circuit breaker with your file processing function and options
const breaker = new circuitBreaker(processFile, options);

// Optionally, listen to circuit breaker events for monitoring or logging
breaker.on('open', () => console.log('Circuit breaker opened'));
breaker.on('close', () => console.log('Circuit breaker closed'));
breaker.on('halfOpen', () => console.log('Circuit breaker half open'));

// Placeholder function for checking the health of an external resources
// Replace this with actual health check logic for your external dependencies
async function checkExternalHealth(): Promise<boolean> {
  // Simulate database check with a promise
  return new Promise((resolve) => {
    setTimeout(() => {
      const isHealthy = true; // Assume is healthy
      resolve(isHealthy);
    }, 100); // Simulate async operation delay
  });
}


// Define a route for uploads
app.post('/upload', upload.single('file'), async (req, res) => {
  if (!req.file) {
    req.log.warn({ reqId: req.id }, 'No file uploaded');
    return res.status(400).send('No file uploaded.');
  }
  // Acquire a semaphore slot before processing the file
  semaphore.take(() => {
    breaker.fire(req, res)
      .then((message) => {
        res.send(message);
      })
      .catch((error) => {
        req.log.error({ reqId: req.id, err: error }, 'Failed to process file or circuit breaker opened');
        res.status(500).send('Failed to process file or service is currently unavailable.');
      })
      .finally(() => {
        semaphore.leave();
      });
  });



  /*semaphore.take(async () => {
    try {
        req.log.info({ reqId: req.id, fileName: req.file?.originalname }, 'File upload started');

      // Simulate file processing
      // Replace this with your actual file processing logic
      setTimeout(() => {
        req.log.info({ reqId: req.id, fileName: req.file?.originalname }, 'File processing completed');
        res.send(`File ${req.file?.originalname} is being processed.`);
      }, 1000); // Simulate processing delay
    } catch (error) {
      req.log.error({ reqId: req.id, err: error }, 'Failed to process file');
      res.status(500).send('Failed to process file.');
    } finally {
      // Ensure the semaphore is released once processing is done or if an error occurs
      semaphore.leave();
    }
  });*/
  
});

//returns current health 
app.get('/health', async (req, res) => {
  try {
    const stats = await pidusage(process.pid);
    const externalHealth = await checkExternalHealth();
	  const memory = await process.memoryUsage();

    const healthReport = {
      cpuUsage: stats.cpu,
      memoryUsage: {
        // Convert bytes to MB for readability
        rss: stats.memory / 1024 / 1024, // Resident Set Size
        rss2 : memory.rss / 1024 / 1024, // Resident Set Size
		heapTotal: memory.heapTotal / 1024 / 1024, // V8's total available memory
        heapUsed: memory.heapUsed / 1024 / 1024, // V8's used memory
      },
      externalDependencies: {
        externalHealt: externalHealth ? "healthy" : "unhealthy",
        // Add other external dependencies here
      },
      status: "healthy", // Or "unhealthy" based on your criteria
    };

    // Determine overall health status
    if (!externalHealth || stats.cpu > 80 /* example CPU threshold */) {
      healthReport.status = "unhealthy";
    }

    res.json(healthReport);
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve health status." });
  }
});

// Export your app for use in other files, such as tests
export { app };