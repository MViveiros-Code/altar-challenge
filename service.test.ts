
import request from 'supertest';
import { app } from './service'; // Import your Express app

// upload.test.ts
describe('Concurrent Uploads', () => {
  it('should handle multiple uploads', async () => {
    const promises = [];
    for (let i = 0; i < 5; i++) {
      const promise = request(app)
        .post('/upload')
        .auth('Admin', '1234')
        .attach('file', Buffer.alloc(250 * 1024 * 1024), `test-${i}.csv`) // Simulate a 250MB file upload
        .expect(200);
      promises.push(promise);
    }

    await Promise.all(promises);
  });
});


// throttling.test.ts
/*describe('Dynamic Throttling', () => {
  it('should throttle under high load', async () => {
    // Mock the system metrics to simulate high load
    jest.mock('./systemMetrics', () => ({
      getCPUPressure: () => 90, // Simulate high CPU usage
      getMemoryPressure: () => 90, // Simulate low available memory
    }));

    // Attempt to upload a file and expect a throttle response (e.g., HTTP 429)
    await request(app)
      .post('/upload')
      .auth('Admin', '1234')
      .attach('file', Buffer.alloc(10 * 1024 * 1024), 'test.csv') // Smaller file for this test
      .expect(429); // Assuming 429 is used for throttling response
  });
});*/

// resilience.test.ts
/*describe('Service Resilience', () => {
  it('should recover from a file processing failure', async () => {
    // Mock the file processing to throw an error
    jest.mock('./fileProcessor', () => ({
      processFile: () => {
        throw new Error('Simulated processing error');
      },
    }));

    // Upload a file and expect the service to handle the error gracefully
    await request(app)
      .post('/upload')
      .auth('Admin', '1234')
      .attach('file', Buffer.alloc(1 * 1024 * 1024), 'test.csv') // Use a smaller file for this test
      .expect(500); // Assuming your service responds with 500 on processing errors
  });
});*/