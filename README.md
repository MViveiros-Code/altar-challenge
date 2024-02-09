# altar-challenge
Service BFF File Handler


**-Compiling**

  npx tsc

**-Executing tests**
  
  npm test

**-Executing server (port 3000)**
  
  node server.js

**-Generating dummy csv file ~250MB to folder teste (folder needs to exist)**
  
  node generateLargeCSV.js

**-Example using command line curl to upload file**
  
  curl -u Admin:1234 -F "file=@tests/largeCSV.csv" -k -O https://localhost:3000/upload

**-Example using powershel to launch multiple upload file**
  
  powershell multi.ps1
