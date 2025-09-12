@echo off
echo 🚀 Testing Database Connection for Vercel Deployment
echo ===================================================
echo.
echo This script will test if your database connection works for Vercel deployment.
echo Make sure you have set the DATABASE_URL environment variable.
echo.

node test-vercel-database.js

echo.
echo Test completed. If there are errors, check VERCEL_POSTGRES_FIX.md for solutions.
pause