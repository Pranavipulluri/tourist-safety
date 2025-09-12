# PostgreSQL Installation and Setup Script for Tourist Safety System

Write-Host "🐘 PostgreSQL Installation and Setup for Tourist Safety System" -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan

# Check if running as administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")

if (-not $isAdmin) {
    Write-Host "⚠️  This script needs to run as Administrator to install PostgreSQL" -ForegroundColor Yellow
    Write-Host "Please right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Alternative: Manual PostgreSQL Installation" -ForegroundColor Green
    Write-Host "1. Download from: https://www.postgresql.org/download/windows/" -ForegroundColor White
    Write-Host "2. Install with default settings" -ForegroundColor White
    Write-Host "3. Remember the password for 'postgres' user" -ForegroundColor White
    Write-Host "4. Run this script again" -ForegroundColor White
    pause
    exit
}

# Function to check if PostgreSQL is installed
function Test-PostgreSQL {
    try {
        $version = psql --version 2>$null
        return $version -ne $null
    }
    catch {
        return $false
    }
}

# Check if PostgreSQL is already installed
if (Test-PostgreSQL) {
    Write-Host "✅ PostgreSQL is already installed!" -ForegroundColor Green
    $version = psql --version
    Write-Host "Version: $version" -ForegroundColor White
} else {
    Write-Host "📦 Installing PostgreSQL..." -ForegroundColor Yellow
    
    # Try different installation methods
    Write-Host "Trying Chocolatey installation..." -ForegroundColor White
    
    # Check if Chocolatey is installed
    try {
        choco --version 2>$null
        Write-Host "✅ Chocolatey found, installing PostgreSQL..." -ForegroundColor Green
        choco install postgresql --yes
    }
    catch {
        Write-Host "⚠️  Chocolatey not found. Trying winget..." -ForegroundColor Yellow
        
        # Try winget
        try {
            winget install PostgreSQL.PostgreSQL
        }
        catch {
            Write-Host "❌ Automatic installation failed" -ForegroundColor Red
            Write-Host ""
            Write-Host "Please install PostgreSQL manually:" -ForegroundColor Yellow
            Write-Host "1. Download from: https://www.postgresql.org/download/windows/" -ForegroundColor White
            Write-Host "2. Run the installer" -ForegroundColor White
            Write-Host "3. Use these settings:" -ForegroundColor White
            Write-Host "   - Username: postgres" -ForegroundColor Gray
            Write-Host "   - Password: password (or remember what you choose)" -ForegroundColor Gray
            Write-Host "   - Port: 5432" -ForegroundColor Gray
            Write-Host "4. Run this script again after installation" -ForegroundColor White
            pause
            exit
        }
    }
}

# Wait for PostgreSQL service to start
Write-Host "🚀 Starting PostgreSQL service..." -ForegroundColor Yellow
try {
    Start-Service -Name "postgresql*" -ErrorAction SilentlyContinue
    Write-Host "✅ PostgreSQL service started" -ForegroundColor Green
}
catch {
    Write-Host "⚠️  PostgreSQL service might already be running or needs manual start" -ForegroundColor Yellow
}

# Create database
Write-Host "📊 Setting up Tourist Safety database..." -ForegroundColor Yellow

$dbName = "tourist_safety_db"
$username = "postgres"

# Check if database exists
try {
    $dbExists = psql -U $username -lqt | Select-String $dbName
    if ($dbExists) {
        Write-Host "✅ Database '$dbName' already exists" -ForegroundColor Green
    } else {
        Write-Host "Creating database '$dbName'..." -ForegroundColor White
        createdb -U $username $dbName
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Database created successfully" -ForegroundColor Green
        } else {
            Write-Host "❌ Failed to create database. You may need to do this manually:" -ForegroundColor Red
            Write-Host "createdb -U postgres tourist_safety_db" -ForegroundColor Gray
        }
    }
}
catch {
    Write-Host "⚠️  Could not check database automatically" -ForegroundColor Yellow
    Write-Host "Please create database manually if needed:" -ForegroundColor White
    Write-Host "createdb -U postgres tourist_safety_db" -ForegroundColor Gray
}

# Run database schema
Write-Host "📋 Setting up database schema..." -ForegroundColor Yellow
if (Test-Path "database\schema.sql") {
    try {
        psql -U $username -d $dbName -f "database\schema.sql"
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Database schema set up successfully" -ForegroundColor Green
        } else {
            Write-Host "⚠️  Schema setup had some issues (might be normal if tables already exist)" -ForegroundColor Yellow
        }
    }
    catch {
        Write-Host "❌ Could not run schema file automatically" -ForegroundColor Red
        Write-Host "Please run manually: psql -U postgres -d tourist_safety_db -f database\schema.sql" -ForegroundColor Gray
    }
} else {
    Write-Host "⚠️  Schema file not found at database\schema.sql" -ForegroundColor Yellow
}

# Test connection
Write-Host "🧪 Testing database connection..." -ForegroundColor Yellow
try {
    $result = psql -U $username -d $dbName -c "SELECT version();" 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Database connection successful!" -ForegroundColor Green
    } else {
        Write-Host "❌ Database connection failed" -ForegroundColor Red
    }
}
catch {
    Write-Host "⚠️  Could not test connection automatically" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎉 Database Setup Complete!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Connection Details:" -ForegroundColor Cyan
Write-Host "   Host: localhost" -ForegroundColor White
Write-Host "   Port: 5432" -ForegroundColor White
Write-Host "   Database: tourist_safety_db" -ForegroundColor White
Write-Host "   Username: postgres" -ForegroundColor White
Write-Host "   Password: [your postgres password]" -ForegroundColor White
Write-Host ""
Write-Host "🔧 Manual Commands:" -ForegroundColor Cyan
Write-Host "   Connect: psql -U postgres -d tourist_safety_db" -ForegroundColor Gray
Write-Host "   Create DB: createdb -U postgres tourist_safety_db" -ForegroundColor Gray
Write-Host "   Run Schema: psql -U postgres -d tourist_safety_db -f database\schema.sql" -ForegroundColor Gray
Write-Host ""
Write-Host "🚀 Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Update your .env file with correct database password" -ForegroundColor White
Write-Host "   2. Start your application: npm run dev" -ForegroundColor White
Write-Host "   3. Test the connection" -ForegroundColor White
Write-Host ""

pause