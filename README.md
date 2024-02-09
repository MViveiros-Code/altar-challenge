# altar-challenge
Service BFF File Handler

**-Prepare enviroment by installing dependencies and instal typescript if not already**
  
  npm install
  
  npm install typescript --save-dev
  
  npm install @types/express --save-dev

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
