#!/usr/bin/env node

// Test script for verifying Vercel deployment will work
const path = require('path');

console.log('🧪 Testing Vercel deployment compatibility...\n');

// Test 1: Check if built files exist
console.log('1️⃣ Checking compiled files...');
const fs = require('fs');
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
    console.log('✅ dist/ directory exists');
    const appModulePath = path.join(distPath, 'app.module.js');
    if (fs.existsSync(appModulePath)) {
        console.log('✅ app.module.js compiled successfully');
    } else {
        console.log('❌ app.module.js not found in dist/');
    }
} else {
    console.log('❌ dist/ directory not found');
}

// Test 2: Check if API handler can load
console.log('\n2️⃣ Testing API handler...');
try {
    const handler = require('./api/index.js');
    console.log('✅ API handler loads without errors');
    console.log('✅ Handler type:', typeof handler);
} catch (error) {
    console.log('❌ API handler failed to load:', error.message);
}

// Test 3: Check dependencies
console.log('\n3️⃣ Testing critical dependencies...');
try {
    require('@nestjs/core');
    console.log('✅ @nestjs/core available');
    
    require('@nestjs/common');
    console.log('✅ @nestjs/common available');
    
    require('class-validator');
    console.log('✅ class-validator available');
    
    require('reflect-metadata');
    console.log('✅ reflect-metadata available');
} catch (error) {
    console.log('❌ Dependency check failed:', error.message);
}

// Test 4: Check if AppModule can be imported
console.log('\n4️⃣ Testing AppModule import...');
try {
    const { AppModule } = require('./dist/app.module');
    console.log('✅ AppModule imported successfully');
    console.log('✅ AppModule type:', typeof AppModule);
} catch (error) {
    console.log('❌ AppModule import failed:', error.message);
    console.log('🔄 Trying src fallback...');
    try {
        require('ts-node/register');
        const { AppModule } = require('./src/app.module');
        console.log('✅ AppModule imported from src (with ts-node)');
    } catch (srcError) {
        console.log('❌ src fallback also failed:', srcError.message);
    }
}

console.log('\n🎯 Deployment Test Complete!');
