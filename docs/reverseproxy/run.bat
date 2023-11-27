@echo off
:start

go run [Your go location (C:\xxx)]\openai.go -backend https://api.openai.com -proxy socks5://localhost:2070

timeout /t 5
goto start