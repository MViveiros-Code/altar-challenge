1..10 | ForEach-Object {
    Start-Process "curl" -ArgumentList "-u Admin:1234 -F `"file=@tests/largeCSV.csv`" -k -O https://localhost:3000/upload"
}