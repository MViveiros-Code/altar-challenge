import fs from 'fs';
import { app } from './service'; // Import your Express app

const https = require('https');

const port = 3000;

// Load SSL certificates
const httpsOptions = {
    key: fs.readFileSync('key.pem'),
    cert: fs.readFileSync('cert.pem')
  };

// Start server
// Create HTTPS server
https.createServer(httpsOptions, app).listen(port, () => {
    console.log(`HTTPS Server running on port ${port}`);
  });

/*app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});*/