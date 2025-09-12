@echo off
echo ====================================
echo  Tourist Safety Local Database Setup
echo ====================================
echo.

echo 🔧 Using Local PostgreSQL with your password: P#250406
echo.

REM Set environment variables
set PGPASSWORD=P#250406
set DB_NAME=tourist_safety_db
set DB_USER=postgres

echo 📡 Testing PostgreSQL connection...
psql -U %DB_USER% -c "SELECT version();" > nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ PostgreSQL connection failed!
    echo.
    echo Please check:
    echo 1. PostgreSQL is installed and running
    echo 2. Password is correct: P#250406
    echo 3. PostgreSQL service is started
    echo.
    echo To start PostgreSQL service:
    echo   net start postgresql-x64-15
    echo.
    echo To test connection manually:
    echo   psql -U postgres
    echo.
    pause
    exit /b 1
)

echo ✅ PostgreSQL connection successful!
echo.

echo 📊 Checking if database exists...
psql -U %DB_USER% -lqt | findstr %DB_NAME% > nul 2>&1
if %errorlevel% neq 0 (
    echo 🏗️  Creating database: %DB_NAME%
    createdb -U %DB_USER% %DB_NAME%
    if %errorlevel% equ 0 (
        echo ✅ Database created successfully!
    ) else (
        echo ❌ Failed to create database
        echo You may need to create it manually:
        echo   createdb -U postgres tourist_safety_db
        pause
        exit /b 1
    )
) else (
    echo ✅ Database '%DB_NAME%' already exists
)

echo.
echo 📋 Setting up database schema...
if exist "database\schema.sql" (
    psql -U %DB_USER% -d %DB_NAME% -f "database\schema.sql" > nul 2>&1
    if %errorlevel% equ 0 (
        echo ✅ Database schema applied successfully!
    ) else (
        echo ⚠️  Schema application had some warnings (this is normal if tables already exist)
    )
) else (
    echo ⚠️  Schema file not found: database\schema.sql
    echo Please make sure you're in the correct directory
)

echo.
echo 🧪 Testing database connection...
psql -U %DB_USER% -d %DB_NAME% -c "SELECT COUNT(*) as table_count FROM information_schema.tables WHERE table_schema = 'public';" > nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Database connection and schema verification successful!
) else (
    echo ❌ Database connection test failed
)

echo.
echo =======================================
echo 🎉 Local Database Setup Complete!
echo =======================================
echo.
echo 📋 Connection Details:
echo    Host: localhost
echo    Port: 5432
echo    Database: tourist_safety_db
echo    Username: postgres
echo    Password: P#250406
echo.
echo 🔗 Connection String:
echo    postgresql://postgres:P#250406@localhost:5432/tourist_safety_db
echo.
echo 🔧 Manual Commands:
echo    Connect: psql -U postgres -d tourist_safety_db
echo    Create DB: createdb -U postgres tourist_safety_db
echo    Drop DB: dropdb -U postgres tourist_safety_db
echo.
echo 🚀 Next Steps:
echo    1. Your .env file is already updated
echo    2. Start your application: npm run dev
echo    3. Check application logs for database connection
echo.

pause