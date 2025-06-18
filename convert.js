const fs = require('fs');

// Read the CSV file
const csvData = fs.readFileSync('LGSdilimler.csv', 'utf8');

// Split into lines and remove header
const lines = csvData.split('\n').slice(1);

// Initialize the result object
const result = {
    "2021": [],
    "2022": [],
    "2023": []
};

// Process each line
lines.forEach(line => {
    if (line.trim()) {
        const [p2021, y2021, p2022, y2022, p2023, y2023] = line.split(';');
        
        if (p2021 && y2021) {
            result["2021"].push({
                puan: parseFloat(p2021.replace(',', '.')),
                yuzdelik: parseFloat(y2021.replace(',', '.'))
            });
        }
        
        if (p2022 && y2022) {
            result["2022"].push({
                puan: parseFloat(p2022.replace(',', '.')),
                yuzdelik: parseFloat(y2022.replace(',', '.'))
            });
        }
        
        if (p2023 && y2023) {
            result["2023"].push({
                puan: parseFloat(p2023.replace(',', '.')),
                yuzdelik: parseFloat(y2023.replace(',', '.'))
            });
        }
    }
});

// Sort each year's data by score in descending order
Object.keys(result).forEach(year => {
    result[year].sort((a, b) => b.puan - a.puan);
});

// Write to JSON file
fs.writeFileSync('LGSdilimler.json', JSON.stringify(result, null, 2));

console.log('Conversion completed successfully!'); 