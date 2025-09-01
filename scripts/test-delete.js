#!/usr/bin/env node

/**
 * Script untuk test manual deletion file dari storage
 * 
 * Cara menjalankan:
 * node scripts/test-delete.js <filename>
 * 
 * Contoh:
 * node scripts/test-delete.js 1756694769695-zbsdivfrmjq.JPG
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

async function testDelete(fileName) {
  console.log(`🧪 Testing deletion of file: ${fileName}\n`);
  
  try {
    const response = await makeRequest('POST', '/api/test/delete-storage', {
      fileName: fileName
    });
    
    if (response.status === 200) {
      const { message, deleted, filesBefore, filesAfter } = response.data;
      
      console.log(`📋 Result: ${message}`);
      console.log(`✅ Deleted: ${deleted}`);
      console.log(`📁 Files before: ${filesBefore.length}`);
      console.log(`📁 Files after: ${filesAfter.length}`);
      
      if (filesBefore.length > 0) {
        console.log('\n📂 Files before deletion:');
        filesBefore.forEach((file, index) => {
          console.log(`   ${index + 1}. ${file}`);
        });
      }
      
      if (filesAfter.length > 0) {
        console.log('\n📂 Files after deletion:');
        filesAfter.forEach((file, index) => {
          console.log(`   ${index + 1}. ${file}`);
        });
      }
      
      if (deleted) {
        console.log('\n🎉 File successfully deleted!');
      } else {
        console.log('\n❌ File deletion failed!');
      }
    } else {
      console.error('❌ Error:', response.data);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function main() {
  const fileName = process.argv[2];
  
  if (!fileName) {
    console.log('Usage: node scripts/test-delete.js <filename>');
    console.log('Example: node scripts/test-delete.js 1756694769695-zbsdivfrmjq.JPG');
    return;
  }
  
  console.log('🚀 Storage Delete Test Tool\n');
  await testDelete(fileName);
}

main().catch(console.error);
