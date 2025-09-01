#!/usr/bin/env node

/**
 * Script untuk manual delete file dari storage menggunakan service role
 * 
 * Cara menjalankan:
 * node scripts/manual-delete.js <filename>
 * 
 * Contoh:
 * node scripts/manual-delete.js 1756695283729-9wskjgsh1lt.JPG
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function manualDelete(fileName) {
  try {
    console.log(`🧪 Manual deletion of file: ${fileName}\n`);
    
    // Create service role client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
    
    const bucketName = process.env.SUPABASE_BUCKET_NAME || 'gastronomi';
    const filePath = `makanan/${fileName}`;
    
    console.log(`📋 Configuration:`);
    console.log(`   Bucket: ${bucketName}`);
    console.log(`   File Path: ${filePath}`);
    console.log(`   Service Role Key: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Not Set'}\n`);
    
    // List all files first
    console.log('📁 Listing all files in storage...');
    const { data: allFiles, error: listError } = await supabase.storage
      .from(bucketName)
      .list('makanan');
    
    if (listError) {
      console.error('❌ Error listing files:', listError);
      return;
    }
    
    console.log(`📁 Found ${allFiles?.length || 0} files:`);
    allFiles?.forEach((file, index) => {
      console.log(`   ${index + 1}. ${file.name}`);
    });
    
    // Check if target file exists
    const fileExists = allFiles?.some(f => f.name === fileName);
    console.log(`\n📁 Target file "${fileName}" exists: ${fileExists}`);
    
    if (!fileExists) {
      console.log('⚠️ File not found, nothing to delete');
      return;
    }
    
    // Try to delete
    console.log(`\n🗑️ Attempting to delete: ${filePath}`);
    const { error: deleteError } = await supabase.storage
      .from(bucketName)
      .remove([filePath]);
    
    if (deleteError) {
      console.error('❌ Delete error:', deleteError);
      console.error('Error details:', {
        message: deleteError.message,
        statusCode: deleteError.statusCode,
        filePath: filePath,
        bucketName: bucketName
      });
      return;
    }
    
    console.log('✅ Delete command executed successfully');
    
    // Verify deletion
    console.log('\n🔍 Verifying deletion...');
    const { data: filesAfterDelete, error: verifyError } = await supabase.storage
      .from(bucketName)
      .list('makanan');
    
    if (verifyError) {
      console.error('❌ Error verifying deletion:', verifyError);
      return;
    }
    
    const stillExists = filesAfterDelete?.some(f => f.name === fileName);
    console.log(`📁 File "${fileName}" still exists: ${stillExists}`);
    
    if (stillExists) {
      console.log('❌ File still exists after deletion attempt!');
      console.log('📁 Remaining files:');
      filesAfterDelete?.forEach((file, index) => {
        console.log(`   ${index + 1}. ${file.name}`);
      });
    } else {
      console.log('🎉 File successfully deleted!');
      console.log(`📁 Remaining files: ${filesAfterDelete?.length || 0}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function main() {
  const fileName = process.argv[2];
  
  if (!fileName) {
    console.log('Usage: node scripts/manual-delete.js <filename>');
    console.log('Example: node scripts/manual-delete.js 1756695283729-9wskjgsh1lt.JPG');
    return;
  }
  
  console.log('🚀 Manual Storage Delete Tool\n');
  await manualDelete(fileName);
}

main().catch(console.error);
