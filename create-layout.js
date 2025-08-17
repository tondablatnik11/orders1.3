// create-layout.js (finální, robustní verze)

const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

// --- Krok 1: Definice cest a klíčových slov ---
const dataDir = path.join(__dirname, 'public', 'data');
const targetSheetName = 'Regalplätze';
const jsonOutputPath = path.join(dataDir, 'warehouse-layout.json');

let excelFilePath = null;

try {
    console.log(`Prohledávám složku: ${dataDir}`);
    const files = fs.readdirSync(dataDir);

    // --- Krok 2: Automatické nalezení správného souboru ---
    // Hledáme soubor, který obsahuje "Stellplätze" a končí na .xlsx
    const targetFile = files.find(file => 
        file.toLowerCase().includes('stellplätze') && file.toLowerCase().endsWith('.xlsx')
    );

    if (!targetFile) {
        console.error('❌ CHYBA: Ve složce "public/data" nebyl nalezen žádný vhodný .xlsx soubor (např. "Stellplätze_...xlsx").');
        console.log('   Nalezené soubory:', files.join(', ') || 'Žádné');
        process.exit(1);
    }
    
    excelFilePath = path.join(dataDir, targetFile);
    console.log(`Nalezen soubor ke zpracování: ${targetFile}`);

    // --- Krok 3: Zpracování nalezeného souboru ---
    const workbook = XLSX.readFile(excelFilePath);

    if (!workbook.SheetNames.includes(targetSheetName)) {
        console.error(`❌ CHYBA: V souboru "${targetFile}" nebyl nalezen list s názvem "${targetSheetName}"!`);
        console.log(`   Dostupné listy: ${workbook.SheetNames.join(', ')}`);
        process.exit(1);
    }

    console.log(`Zpracovávám list: "${targetSheetName}"`);
    const worksheet = workbook.Sheets[targetSheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);
    console.log(`Nalezeno ${jsonData.length} řádků k transformaci.`);

    // --- Krok 4: Transformace a uložení ---
    const layoutData = jsonData.map(position => {
        const id = position['Platzadresse im Barcode ohne Bindestrich -> Stellplatz'];
        const address = position['Platzadresse visuelle Darstellung'];

        if (!id || !address) {
            console.warn('Přeskakuji řádek kvůli chybějícím klíčovým datům:', position);
            return null;
        }

        return {
            id: String(id),
            address: String(address),
            type: position.KLT || 'Pallet',
        };
    }).filter(Boolean);

    fs.writeFileSync(jsonOutputPath, JSON.stringify(layoutData, null, 2));

    console.log('-----------------------------------------------------------------');
    console.log(`✅ ÚSPĚCH! Soubor warehouse-layout.json byl úspěšně vytvořen.`);
    console.log(`   Cesta: ${jsonOutputPath}`);
    console.log(`   Celkem uloženo ${layoutData.length} platných skladových pozic.`);

} catch (error) {
    console.error('❌ Nastala neočekávaná chyba:', error);
    process.exit(1);
}