@echo off
echo ===================================
echo    Tourist Safety Database Starter
echo ===================================
echo.

echo Checking if Docker is available...
docker --version >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Docker found! Starting database with Docker...
    echo.
    docker-compose up postgres redis -d
    if %errorlevel% equ 0 (
        echo ✅ Database started successfully with Docker!
        echo.
        echo 📋 Database Connection Details:
        echo    Host: localhost
        echo    Port: 5432
        echo    Database: tourist_safety_db
        echo    Username: postgres
        echo    Password: password123
        echo.
        echo 🔧 To connect manually:
        echo    docker exec -it tourist_safety_postgres psql -U postgres -d tourist_safety_db
        echo.
        pause
        exit /b 0
    ) else (
        echo ❌ Failed to start database with Docker
        echo Please make sure Docker Desktop is running
        echo.
    )
) else (
    echo ⚠️  Docker not found or not running
    echo.
)

echo Checking if PostgreSQL is installed locally...
psql --version >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ PostgreSQL found! Starting local database...
    echo.
    
    REM Start PostgreSQL service
    net start postgresql-x64-15 >nul 2>&1
    if %errorlevel% equ 0 (
        echo ✅ PostgreSQL service started
    ) else (
        echo ⚠️  PostgreSQL service might already be running
    )
    
    REM Check if database exists
    psql -U postgres -lqt | findstr tourist_safety_db >nul 2>&1
    if %errorlevel% neq 0 (
        echo 📊 Creating database...
        createdb -U postgres tourist_safety_db
        if %errorlevel% equ 0 (
            echo ✅ Database created successfully
        ) else (
            echo ❌ Failed to create database
            echo Please run: createdb -U postgres tourist_safety_db
        )
    ) else (
        echo ✅ Database already exists
    )
    
    REM Run schema if needed
    echo 📋 Setting up database schema...
    psql -U postgres -d tourist_safety_db -f database/schema.sql >nul 2>&1
    if %errorlevel% equ 0 (
        echo ✅ Database schema updated successfully
    ) else (
        echo ⚠️  Schema update had some issues (might be normal if already exists)
    )
    
    echo.
    echo ✅ Local PostgreSQL database is ready!
    echo.
    echo 📋 Database Connection Details:
    echo    Host: localhost
    echo    Port: 5432
    echo    Database: tourist_safety_db
    echo    Username: postgres
    echo    Password: [your postgres password]
    echo.
    echo 🔧 To connect manually:
    echo    psql -U postgres -d tourist_safety_db
    echo.
    pause
    exit /b 0
) else (
    echo ❌ PostgreSQL not found locally
    echo.
)

echo ================================
echo   Database Setup Required
echo ================================
echo.
echo Please choose one of the following options:
echo.
echo 1. Install Docker Desktop:
echo    https://www.docker.com/products/docker-desktop/
echo    Then run: docker-compose up postgres redis -d
echo.
echo 2. Install PostgreSQL locally:
echo    https://www.postgresql.org/download/windows/
echo    Then run this script again
echo.
echo 3. Use online PostgreSQL service:
echo    - Render.com (free tier)
echo    - Heroku Postgres (free tier)
echo    - Supabase (free tier)
echo.
pause