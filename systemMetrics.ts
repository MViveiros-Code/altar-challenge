// systemMetrics.ts
export const getCPUPressure = (): number => {
    // This is a simple example. You might want to calculate average CPU load over time.
    const cpus = require('os').cpus();
    let totalLoad = 0;
    cpus.forEach((core: any) => {
      const { times } = core;
      totalLoad += times.user;
      totalLoad += times.nice;
      totalLoad += times.sys;
    });
    return totalLoad / cpus.length; // Simplified; consider a more accurate calculation
  };
  
  export const getMemoryPressure = (): number => {
    const totalMemory = require('os').totalmem();
    const freeMemory = require('os').freemem();
    return ((totalMemory - freeMemory) / totalMemory) * 100; // Percentage of used memory
  };
  