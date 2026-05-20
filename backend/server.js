const express = require('express');
const cors = require('cors');
const fs = require('fs');
const csv = require('csv-parser');
const path = require('path'); // BUNA İHTİYACIMIZ VAR

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/calculate-mrp', (req, res) => {
    const orders = req.body.orders; 
    const results = {};

    // DİKKAT: Vercel bulut ortamında dosyayı bulabilmesi için __dirname kullanıyoruz
    const csvFilePath = path.join(__dirname, 'ANA_VERI_TABANI.csv');

    fs.createReadStream(csvFilePath)
        .pipe(csv({ 
            separator: ';',
            mapHeaders: ({ header, index }) => {
                if (index === 0) return 'model';
                if (index === 2) return 'parcaNo';
                if (index === 3) return 'malzeme';
                if (index === 7) return 'adet';
                return header;
            }
        })) 
        .on('data', (row) => {
            const model = row.model ? row.model.trim() : '';
            const partNo = row.parcaNo ? row.parcaNo.trim() : '';
            const material = row.malzeme ? row.malzeme.trim() : '';
            
            const qtyStr = row.adet ? row.adet.toString().replace(',', '.') : '0';
            const qtyPerUnit = parseFloat(qtyStr) || 0; 

            if (orders[model] && orders[model] > 0) {
                const totalQty = qtyPerUnit * orders[model];

                if (!results[partNo]) {
                    results[partNo] = { partNo, material, totalQuantity: 0 };
                }
                results[partNo].totalQuantity += totalQty;
            }
        })
        .on('end', () => {
            res.json(Object.values(results));
        })
        .on('error', (err) => {
            res.status(500).json({ error: 'CSV okunurken hata', details: err });
        });
});

// VERCEL İÇİN EN KRİTİK KISIM: 
// Localhost'tayken portu dinle, Vercel'deyken ise sadece dışarı aktar (export et)
if (process.env.NODE_ENV !== 'production') {
    const PORT = 3001;
    app.listen(PORT, () => {
        console.log(`Backend ${PORT} portunda çalışıyor...`);
    });
}

module.exports = app;