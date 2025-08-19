const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Načtěte proměnné prostředí pro Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Chyba: Ujistěte se, že máte v .env.local definované NEXT_PUBLIC_SUPABASE_URL a NEXT_PUBLIC_SUPABASE_ANON_KEY");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const uploadLayoutData = async () => {
    try {
        console.log('Načítám soubor warehouse-layout.json...');
        const layoutPath = path.join(__dirname, 'public', 'data', 'warehouse-layout.json');
        const layoutData = JSON.parse(fs.readFileSync(layoutPath, 'utf8'));

        if (!Array.isArray(layoutData)) {
            throw new Error('JSON data nejsou pole!');
        }

        console.log(`Nalezeno ${layoutData.length} pozic k nahrání.`);

        // Data pro Supabase musí být objekty s klíči odpovídajícími sloupcům
        const dataToInsert = layoutData.map(item => ({
            id: String(item.id),
            address: item.address,
            type: item.type
        }));

        // Rozdělení na menší části pro nahrání (Supabase má limity)
        const chunkSize = 1000;
        for (let i = 0; i < dataToInsert.length; i += chunkSize) {
            const chunk = dataToInsert.slice(i, i + chunkSize);
            console.log(`Nahrávám část ${i / chunkSize + 1}...`);

            const { error } = await supabase
                .from('warehouse_layout')
                .upsert(chunk, { onConflict: 'id' });

            if (error) {
                throw error;
            }
        }

        console.log('✅ Úspěšně nahráno!');
    } catch (error) {
        console.error('❌ Selhalo nahrávání layoutu:', error.message);
    }
};

uploadLayoutData();