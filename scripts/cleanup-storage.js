#!/usr/bin/env node

/**
 * Script untuk membersihkan file gambar yang tidak terpakai di Supabase Storage
 * 
 * Cara menjalankan:
 * 1. Pastikan Anda sudah login sebagai SUPER_ADMIN
 * 2. Jalankan: node scripts/cleanup-storage.js
 * 
 * Atau bisa juga menggunakan curl:
 * curl -X POST http://localhost:3000/api/storage/cleanup \
 *   -H "Authorization: Bearer YOUR_TOKEN"
 */

const https = require('https');
const http = require('http');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

async function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_BASE_URL);
    const isHttps = url.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    if (data) {
      const jsonData = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(jsonData);
    }

    const req = client.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve({ status: res.statusCode, data: parsed });
        } catch (error) {
          resolve({ status: res.statusCode, data: responseData });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function checkStorageStatus() {
  console.log('🔍 Checking storage status...');
  
  try {
    const response = await makeRequest('GET', '/api/storage/cleanup');
    
    if (response.status === 200) {
      const { totalFiles, usedFiles, orphanedFiles, orphanedFileNames } = response.data;
      
      console.log('\n📊 Storage Status:');
      console.log(`   Total files in storage: ${totalFiles}`);
      console.log(`   Files used by database: ${usedFiles}`);
      console.log(`   Orphaned files: ${orphanedFiles}`);
      
      if (orphanedFiles > 0) {
        console.log('\n🗑️  Orphaned files:');
        orphanedFileNames.forEach((fileName, index) => {
          console.log(`   ${index + 1}. ${fileName}`);
        });
        
        console.log('\n⚠️  These files are taking up storage space but are not referenced in the database.');
        console.log('   Run cleanup to remove them.');
      } else {
        console.log('\n✅ No orphaned files found! Storage is clean.');
      }
    } else {
      console.error('❌ Error checking storage status:', response.data);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function runCleanup() {
  console.log('🧹 Starting storage cleanup...');
  
  try {
    const response = await makeRequest('POST', '/api/storage/cleanup');
    
    if (response.status === 200) {
      const { message, totalDeleted, deletedFiles, errors } = response.data;
      
      console.log(`\n✅ ${message}`);
      console.log(`   Files deleted: ${totalDeleted}`);
      
      if (deletedFiles.length > 0) {
        console.log('\n🗑️  Deleted files:');
        deletedFiles.forEach((fileName, index) => {
          console.log(`   ${index + 1}. ${fileName}`);
        });
      }
      
      if (errors.length > 0) {
        console.log('\n⚠️  Errors:');
        errors.forEach((error, index) => {
          console.log(`   ${index + 1}. ${error}`);
        });
      }
    } else {
      console.error('❌ Error running cleanup:', response.data);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function main() {
  const command = process.argv[2];
  
  console.log('🚀 Supabase Storage Cleanup Tool\n');
  
  if (command === 'cleanup') {
    await runCleanup();
  } else if (command === 'status') {
    await checkStorageStatus();
  } else {
    console.log('Usage:');
    console.log('  node scripts/cleanup-storage.js status   - Check storage status');
    console.log('  node scripts/cleanup-storage.js cleanup - Run cleanup');
    console.log('\nNote: You need to be logged in as SUPER_ADMIN to run these commands.');
  }
}

main().catch(console.error);
