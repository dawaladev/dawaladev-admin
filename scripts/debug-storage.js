#!/usr/bin/env node

/**
 * Script untuk debug masalah storage cleanup
 * 
 * Cara menjalankan:
 * node scripts/debug-storage.js
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

async function debugStorage() {
  console.log('🔍 Debugging storage issues...\n');
  
  try {
    // Check storage status
    console.log('1. Checking storage status...');
    const statusResponse = await makeRequest('GET', '/api/storage/cleanup');
    
    if (statusResponse.status === 200) {
      const { totalFiles, usedFiles, orphanedFiles, orphanedFileNames } = statusResponse.data;
      
      console.log('📊 Storage Status:');
      console.log(`   Total files in storage: ${totalFiles}`);
      console.log(`   Files used by database: ${usedFiles}`);
      console.log(`   Orphaned files: ${orphanedFiles}`);
      
      if (orphanedFiles > 0) {
        console.log('\n🗑️  Orphaned files:');
        orphanedFileNames.forEach((fileName, index) => {
          console.log(`   ${index + 1}. ${fileName}`);
        });
      }
    } else {
      console.error('❌ Error checking storage status:', statusResponse.data);
    }
    
    // Get all makanan from database
    console.log('\n2. Checking makanan in database...');
    const makananResponse = await makeRequest('GET', '/api/makanan');
    
    if (makananResponse.status === 200) {
      const makanan = makananResponse.data;
      console.log(`📋 Found ${makanan.length} makanan in database:`);
      
      makanan.forEach((item, index) => {
        console.log(`   ${index + 1}. ID: ${item.id}, Name: ${item.namaMakanan}`);
        
        // Parse foto URLs
        let fotoUrls = [];
        try {
          if (item.foto) {
            if (Array.isArray(item.foto)) {
              fotoUrls = item.foto;
            } else {
              fotoUrls = JSON.parse(item.foto);
            }
          }
        } catch (error) {
          console.log(`      ❌ Error parsing foto: ${error.message}`);
        }
        
        console.log(`      📸 Foto URLs (${fotoUrls.length}):`);
        fotoUrls.forEach((url, urlIndex) => {
          const urlParts = url.split('/');
          const fileName = urlParts[urlParts.length - 1];
          console.log(`         ${urlIndex + 1}. ${fileName}`);
        });
      });
    } else {
      console.error('❌ Error fetching makanan:', makananResponse.data);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function main() {
  console.log('🚀 Storage Debug Tool\n');
  await debugStorage();
}

main().catch(console.error);
