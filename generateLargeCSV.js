const fs = require('fs');
const { Readable } = require('stream');

class DataStream extends Readable {
  constructor(options) {
    super(options);
    this.maxLines = 5000000; // Adjust the number of lines to get the desired file size
    this.currentLine = 0;
  }

  _read() {
    if (this.currentLine++ >= this.maxLines) {
      this.push(null); // No more data
    } else {
      const data = `Row${this.currentLine},${Math.random()},${new Date().toISOString()}\n`;
      this.push(data);
    }
  }
}

const filePath = './tests/largeCSV.csv';
const writableStream = fs.createWriteStream(filePath);

const dataStream = new DataStream();

dataStream.pipe(writableStream).on('finish', () => {
  console.log('CSV file has been generated.');
});
