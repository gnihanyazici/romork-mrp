const express = require('express');
const cors = require('cors');
const fs = require('fs');
const csv = require('csv-parser');

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/calculate-mrp', (req, res) => {
    const orders = req.body.orders; 
    const results = {};

    fs.createReadStream('ANA_VERI_TABANI.csv')
        .pipe(csv({ 
            separator: ';',
            // Sütun isimlerindeki bozuklukları görmezden gelip sıraya göre (index) isim atıyoruz
            mapHeaders: ({ header, index }) => {
                if (index === 0) return 'model';
                if (index === 2) return 'parcaNo';
                if (index === 3) return 'malzeme';
                if (index === 7) return 'adet';
                return header;
            }
        })) 
        .on('data', (row) => {
            // Verilerin etrafındaki gizli boşlukları temizliyoruz (trim)
            const model = row.model ? row.model.trim() : '';
            const partNo = row.parcaNo ? row.parcaNo.trim() : '';
            const material = row.malzeme ? row.malzeme.trim() : '';
            
            // Excel'deki virgüllü rakamları (Örn: 1,5) sistemin anladığı noktaya (1.5) çeviriyoruz
            const qtyStr = row.adet ? row.adet.toString().replace(',', '.') : '0';
            const qtyPerUnit = parseFloat(qtyStr) || 0; 

            // Eğer girilen siparişlerde bu model varsa ve adedi 0'dan büyükse hesapla
            if (orders[model] && orders[model] > 0) {
                const totalQty = qtyPerUnit * orders[model];

                // Parça listede yoksa ekle
                if (!results[partNo]) {
                    results[partNo] = {
                        partNo: partNo,
                        material: material,
                        totalQuantity: 0
                    };
                }
                // Varsa üstüne topla
                results[partNo].totalQuantity += totalQty;
            }
        })
        .on('end', () => {
            res.json(Object.values(results)); // Sonucu React'a gönder
        })
        .on('error', (err) => {
            res.status(500).json({ error: 'CSV okunurken hata oluştu', details: err });
        });
});

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Backend ${PORT} portunda çalışıyor...`);
});