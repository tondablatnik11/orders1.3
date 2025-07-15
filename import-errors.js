// import-errors.js
const fs = require('fs');
const XLSX = require('xlsx');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Načtěte si klíče ze .env souboru, abyste je neměli v kódu
const supabaseUrl = process.env.SUPABASE_URL;
// Použijte SERVICE_ROLE_KEY, protože tento skript běží na serveru a obchází RLS
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const FILE_PATH = './Error_monitor.XLSX'; // Cesta k vašemu souboru

async function importData() {
  console.log('Reading file...');
  const workbook = XLSX.readFile(FILE_PATH);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const jsonData = XLSX.utils.sheet_to_json(worksheet);

  console.log(`Found ${jsonData.length} rows to process.`);

  const processedData = jsonData.map(row => {
    const text1 = row['Text']?.trim() || '';
    const text2 = row['Text.1']?.trim() || '';

    return {
        timestamp: new Date(`${row['Created On']} ${row['Time']}`).toISOString(),
        description: `${text1} ${text2}`.trim() || 'N/A',
        material: row['Material'] || 'N/A',
        error_location: row['Storage Bin'] || 'N/A',
        order_reference: row['Dest.Storage Bin'] || 'N/A',
        user: row['Created By'] || 'N/A',
        target_qty: row['Source target qty'] || 0,
        actual_qty: row['Source actual qty.'] || 0,
        diff_qty: row['Source bin differ.'] || 0,
    };
  });

  console.log('Uploading data to Supabase...');
  // Rozdělíme data na menší části, abychom nezahlitli Supabase
  const CHUNK_SIZE = 50;
  for (let i = 0; i < processedData.length; i += CHUNK_SIZE) {
      const chunk = processedData.slice(i, i + CHUNK_SIZE);
      const { error } = await supabase.from('errors').insert(chunk);
      if (error) {
          console.error('Error inserting chunk:', error);
          return;
      }
      console.log(`Uploaded chunk ${i / CHUNK_SIZE + 1}...`);
  }

  console.log('Import finished successfully!');
}

importData();