import { useState } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import './App.css';

function App() {
  // Römork modelleri ve state'i
  const [orders, setOrders] = useState({
    '768 (250x125)': 0,
    '769 (210x125)': 0,
    '771 (175x110)': 0,
    '775 (300x150)': 0,
    '776 (250x150)': 0,
  });

  const [mrpList, setMrpList] = useState([]);

  // Input değerleri değiştiğinde state'i güncelle
  const handleInputChange = (model, value) => {
    setOrders({
      ...orders,
      [model]: parseInt(value) || 0,
    });
  };

  // Backend'e istek at ve listeyi al
 const calculateMRP = async () => {
    try {
      // Localhost'ta iken 3001 portuna, canlı Vercel sitesindeyken direkt /api/ yoluna gider
      const apiUrl = window.location.hostname === 'localhost' 
        ? 'http://localhost:3001/api/calculate-mrp' 
        : '/api/calculate-mrp';

      const response = await axios.post(apiUrl, {
        orders: orders
      });
      setMrpList(response.data);
    } catch (error) {
      console.error("Hesaplama hatası:", error);
      alert("Backend'e bağlanılamadı.");
    }
  };
  // Sonuçları gerçek Excel (.xlsx) olarak indirme fonksiyonu
  const exportToExcel = () => {
    if (mrpList.length === 0) return;

    // 1. Veriyi Excel'in anlayacağı tablo yapısına (JSON objesine) dönüştürüyoruz
    const excelData = mrpList.map(item => ({
      "PARÇA NUMARASI": item.partNo,
      "Malzeme": item.material,
      "Toplam İhtiyaç (Adet)": item.totalQuantity
    }));

    // 2. Boş bir çalışma kitabı (Workbook) ve sayfa (Worksheet) oluşturuyoruz
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Toplu Sipariş Listesi");

    // 3. Sütun genişliklerini metinler sığacak şekilde otomatik ayarlıyoruz
    const wscols = [
      { wch: 25 }, // Parça Numarası sütunu genişliği
      { wch: 35 }, // Malzeme sütunu genişliği
      { wch: 20 }  // Adet sütunu genişliği
    ];
    worksheet['!cols'] = wscols;

    // 4. Dosyayı doğrudan .xlsx formatında kullanıcıya indirtiyoruz
    XLSX.writeFile(workbook, "Toplu_Uretim_Malzeme_Listesi.xlsx");
  };

  return (
    <div className="container" style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>Römork Sipariş Paneli</h1>
      
      <div className="order-panel" style={{ marginBottom: '30px', display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '300px' }}>
        {Object.keys(orders).map((model) => (
          <div key={model} style={{ display: 'flex', justifyContent: 'space-between' }}>
            <label>{model}:</label>
            <input 
              type="number" 
              min="0" 
              value={orders[model]} 
              onChange={(e) => handleInputChange(model, e.target.value)} 
              style={{ width: '60px' }}
            />
          </div>
        ))}
        <button onClick={calculateMRP} style={{ marginTop: '10px', padding: '10px', cursor: 'pointer' }}>
          Sipariş Listesini Oluştur
        </button>
      </div>

      {mrpList.length > 0 && (
        <div className="results">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2>Üretim İhtiyaç Listesi (MRP)</h2>
            <button onClick={exportToExcel} style={{ padding: '8px', cursor: 'pointer', backgroundColor: '#4CAF50', color: 'white', border: 'none' }}>
              Profesyonel Excel İndir
            </button>
          </div>
          
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f2f2f2', textAlign: 'left' }}>
                <th style={{ border: '1px solid #ddd', padding: '8px' }}>Parça Numarası</th>
                <th style={{ border: '1px solid #ddd', padding: '8px' }}>Malzeme</th>
                <th style={{ border: '1px solid #ddd', padding: '8px' }}>Toplam İhtiyaç (Adet)</th>
              </tr>
            </thead>
            <tbody>
              {mrpList.map((item, index) => (
                <tr key={index}>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{item.partNo}</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{item.material}</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px', fontWeight: 'bold' }}>{item.totalQuantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default App;