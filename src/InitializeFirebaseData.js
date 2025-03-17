import React, { useState, useEffect } from 'react';
import { app } from './FirebaseConfig';
import { getFirestore, collection, addDoc, getDocs } from 'firebase/firestore';

function InitializeFirebaseData() {
  const [initialized, setInitialized] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [logs, setLogs] = useState([]);
  // const [clearingDB, setClearingDB] = useState(false);

  const db = getFirestore(app);

  // Перевірка чи вже є дані в базі
  const checkExistingData = async () => {
    try {
      const categoriesSnapshot = await getDocs(collection(db, 'categories'));
      const suppliersSnapshot = await getDocs(collection(db, 'suppliers'));
      const storagesSnapshot = await getDocs(collection(db, 'storages'));
      const storageAreasSnapshot = await getDocs(collection(db, 'storageAreas'));
      const productsSnapshot = await getDocs(collection(db, 'products'));

      const hasData = 
        categoriesSnapshot.size > 0 || 
        suppliersSnapshot.size > 0 || 
        storagesSnapshot.size > 0 || 
        storageAreasSnapshot.size > 0 ||
        productsSnapshot.size > 0;

      return hasData;
    } catch (error) {
      console.error('Помилка перевірки даних:', error);
      return false;
    }
  };

  // Додавання запису до логів
  const addLog = (text) => {
    setLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), text }]);
  };

  // Ініціалізація всіх даних
  const initializeAllData = async () => {
    setLoading(true);
    setMessage({ text: '', type: '' });
    setLogs([]);
    
    try {
      // Перевірка існуючих даних
      const hasExistingData = await checkExistingData();
      
      if (hasExistingData) {
        setMessage({ 
          text: 'Дані вже існують в базі. Можливе дублювання при повторній ініціалізації.',
          type: 'warning'
        });
      }

      // Додавання категорій
      addLog('Почато додавання категорій...');
      const categories = [
        { name: 'Продукти харчування', description: 'Їжа та продукти харчування' },
        { name: 'Напої', description: 'Вода, соки, газовані напої' },
        { name: 'Електроніка', description: 'Електронні пристрої та аксесуари' },
        { name: 'Одяг', description: 'Чоловічий, жіночий та дитячий одяг' },
        { name: 'Побутова хімія', description: 'Миючі та чистячі засоби' },
        { name: 'Будівельні матеріали', description: 'Матеріали для будівництва та ремонту' }
      ];

      const categoryRefs = {};
      for (const category of categories) {
        const docRef = await addDoc(collection(db, 'categories'), category);
        categoryRefs[category.name] = docRef.id;
        addLog(`Додано категорію: ${category.name}`);
      }

      // Додавання постачальників
      addLog('Почато додавання постачальників...');
      const suppliers = [
        { name: 'ТОВ "Велика Поставка"', phone: '+380501234567', email: 'supply@bigdeliver.com', address: 'м. Київ, вул. Київська, 1' },
        { name: 'ТОВ "Швидке Замовлення"', phone: '+380672345678', email: 'orders@fastorder.com', address: 'м. Львів, вул. Львівська, 10' },
        { name: 'ПП "Надійний Партнер"', phone: '+380953456789', email: 'info@relpartner.com', address: 'м. Одеса, вул. Одеська, 5' },
        { name: 'ФОП Іванов І.І.', phone: '+380964567890', email: 'ivanov@gmail.com', address: 'м. Харків, вул. Харківська, 15' }
      ];

      const supplierRefs = {};
      for (const supplier of suppliers) {
        const docRef = await addDoc(collection(db, 'suppliers'), supplier);
        supplierRefs[supplier.name] = docRef.id;
        addLog(`Додано постачальника: ${supplier.name}`);
      }

      // Додавання складів
      addLog('Почато додавання складів...');
      const storages = [
        { name: 'Центральний склад', address: 'м. Київ, вул. Складська, 1', capacity: 1000, description: 'Головний склад компанії' },
        { name: 'Західний склад', address: 'м. Львів, вул. Західна, 10', capacity: 500, description: 'Склад для західного регіону' },
        { name: 'Південний склад', address: 'м. Одеса, вул. Південна, 5', capacity: 500, description: 'Склад для південного регіону' },
        { name: 'Східний склад', address: 'м. Харків, вул. Східна, 15', capacity: 800, description: 'Склад для східного регіону' }
      ];

      const storageRefs = {};
      for (const storage of storages) {
        const docRef = await addDoc(collection(db, 'storages'), storage);
        storageRefs[storage.name] = docRef.id;
        addLog(`Додано склад: ${storage.name}`);
      }

      // Додавання місць на складах
      addLog('Почато додавання місць на складах...');
      const storageAreas = [
        // Центральний склад
        { name: 'Секція A1', description: 'Продукти харчування', storageId: storageRefs['Центральний склад'] },
        { name: 'Секція A2', description: 'Напої', storageId: storageRefs['Центральний склад'] },
        { name: 'Секція B1', description: 'Електроніка', storageId: storageRefs['Центральний склад'] },
        { name: 'Секція B2', description: 'Одяг', storageId: storageRefs['Центральний склад'] },
        
        // Західний склад
        { name: 'Секція A1', description: 'Продукти харчування', storageId: storageRefs['Західний склад'] },
        { name: 'Секція A2', description: 'Напої', storageId: storageRefs['Західний склад'] },
        
        // Південний склад
        { name: 'Секція A1', description: 'Продукти харчування', storageId: storageRefs['Південний склад'] },
        { name: 'Секція B1', description: 'Побутова хімія', storageId: storageRefs['Південний склад'] },
        
        // Східний склад
        { name: 'Секція A1', description: 'Продукти харчування', storageId: storageRefs['Східний склад'] },
        { name: 'Секція C1', description: 'Будівельні матеріали', storageId: storageRefs['Східний склад'] }
      ];

      const storageAreaRefs = {};
      for (const area of storageAreas) {
        const docRef = await addDoc(collection(db, 'storageAreas'), area);
        const key = `${area.name}-${area.storageId}`;
        storageAreaRefs[key] = docRef.id;
        addLog(`Додано місце на складі: ${area.name} (${area.description})`);
      }

      // Додавання продуктів
      addLog('Почато додавання тестових продуктів...');
      const products = [
        // Продукти харчування
        {
          name: 'Цукор білий',
          barcode: '4820000910019',
          price: 42.50,
          weightOrVolume: '1 кг',
          expiryDate: new Date('2025-12-31').toISOString().split('T')[0],
          idCategory: categoryRefs['Продукти харчування'],
          idSupplier: supplierRefs['ТОВ "Велика Поставка"'],
          idStorage: storageRefs['Центральний склад'],
          idStorageArea: storageAreaRefs[`Секція A1-${storageRefs['Центральний склад']}`],
          quantity: 200
        },
        {
          name: 'Борошно пшеничне',
          barcode: '4820000910026',
          price: 38.75,
          weightOrVolume: '2 кг',
          expiryDate: new Date('2025-10-15').toISOString().split('T')[0],
          idCategory: categoryRefs['Продукти харчування'],
          idSupplier: supplierRefs['ТОВ "Велика Поставка"'],
          idStorage: storageRefs['Західний склад'],
          idStorageArea: storageAreaRefs[`Секція A1-${storageRefs['Західний склад']}`],
          quantity: 150
        },
        {
          name: 'Макарони спагетті',
          barcode: '4820000910033',
          price: 45.20,
          weightOrVolume: '500 г',
          expiryDate: new Date('2025-11-25').toISOString().split('T')[0],
          idCategory: categoryRefs['Продукти харчування'],
          idSupplier: supplierRefs['ПП "Надійний Партнер"'],
          idStorage: storageRefs['Південний склад'],
          idStorageArea: storageAreaRefs[`Секція A1-${storageRefs['Південний склад']}`],
          quantity: 180
        },
        
        // Напої
        {
          name: 'Вода мінеральна негазована',
          barcode: '4820000920018',
          price: 18.90,
          weightOrVolume: '1.5 л',
          expiryDate: new Date('2025-06-10').toISOString().split('T')[0],
          idCategory: categoryRefs['Напої'],
          idSupplier: supplierRefs['ТОВ "Швидке Замовлення"'],
          idStorage: storageRefs['Центральний склад'],
          idStorageArea: storageAreaRefs[`Секція A2-${storageRefs['Центральний склад']}`],
          quantity: 300
        },
        {
          name: 'Сік яблучний',
          barcode: '4820000920025',
          price: 54.30,
          weightOrVolume: '1 л',
          expiryDate: new Date('2025-05-20').toISOString().split('T')[0],
          idCategory: categoryRefs['Напої'],
          idSupplier: supplierRefs['ТОВ "Швидке Замовлення"'],
          idStorage: storageRefs['Західний склад'],
          idStorageArea: storageAreaRefs[`Секція A2-${storageRefs['Західний склад']}`],
          quantity: 120
        },
        
        // Електроніка
        {
          name: 'Зарядний пристрій USB Type-C',
          barcode: '4820000930017',
          price: 450.00,
          weightOrVolume: '50 г',
          expiryDate: '',
          idCategory: categoryRefs['Електроніка'],
          idSupplier: supplierRefs['ФОП Іванов І.І.'],
          idStorage: storageRefs['Центральний склад'],
          idStorageArea: storageAreaRefs[`Секція B1-${storageRefs['Центральний склад']}`],
          quantity: 50
        },
        {
          name: 'Навушники бездротові',
          barcode: '4820000930024',
          price: 1250.00,
          weightOrVolume: '200 г',
          expiryDate: '',
          idCategory: categoryRefs['Електроніка'],
          idSupplier: supplierRefs['ФОП Іванов І.І.'],
          idStorage: storageRefs['Центральний склад'],
          idStorageArea: storageAreaRefs[`Секція B1-${storageRefs['Центральний склад']}`],
          quantity: 30
        },
        
        // Одяг
        {
          name: 'Футболка чоловіча',
          barcode: '4820000940016',
          price: 350.00,
          weightOrVolume: '150 г',
          expiryDate: '',
          idCategory: categoryRefs['Одяг'],
          idSupplier: supplierRefs['ПП "Надійний Партнер"'],
          idStorage: storageRefs['Центральний склад'],
          idStorageArea: storageAreaRefs[`Секція B2-${storageRefs['Центральний склад']}`],
          quantity: 100
        },
        
        // Побутова хімія
        {
          name: 'Засіб для миття посуду',
          barcode: '4820000950015',
          price: 85.75,
          weightOrVolume: '500 мл',
          expiryDate: new Date('2026-01-15').toISOString().split('T')[0],
          idCategory: categoryRefs['Побутова хімія'],
          idSupplier: supplierRefs['ТОВ "Велика Поставка"'],
          idStorage: storageRefs['Південний склад'],
          idStorageArea: storageAreaRefs[`Секція B1-${storageRefs['Південний склад']}`],
          quantity: 80
        },
        
        // Будівельні матеріали
        {
          name: 'Цемент будівельний',
          barcode: '4820000960014',
          price: 165.00,
          weightOrVolume: '25 кг',
          expiryDate: new Date('2025-12-01').toISOString().split('T')[0],
          idCategory: categoryRefs['Будівельні матеріали'],
          idSupplier: supplierRefs['ФОП Іванов І.І.'],
          idStorage: storageRefs['Східний склад'],
          idStorageArea: storageAreaRefs[`Секція C1-${storageRefs['Східний склад']}`],
          quantity: 40
        }
      ];

      for (const product of products) {
        await addDoc(collection(db, 'products'), product);
        addLog(`Додано продукт: ${product.name} (${product.barcode})`);
      }

      setMessage({ text: 'Всі дані успішно додані до бази даних Firebase!', type: 'success' });
      setInitialized(true);
    } catch (error) {
      console.error('Помилка ініціалізації даних:', error);
      setMessage({ text: 'Помилка ініціалізації даних: ' + error.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-4">
      <div className="card">
        <div className="card-header bg-primary text-white">
          <h2>Ініціалізація бази даних Firebase</h2>
        </div>
        <div className="card-body">
          {message.text && (
            <div className={`alert ${message.type === 'success' ? 'alert-success' : message.type === 'warning' ? 'alert-warning' : 'alert-danger'}`}>
              {message.text}
            </div>
          )}
          
          <p>Цей інструмент додасть початкові дані до вашої бази Firebase:</p>
          <ul>
            <li>6 категорій товарів</li>
            <li>4 постачальника</li>
            <li>4 склади</li>
            <li>10 місць на складах</li>
            <li>10 тестових продуктів у різних категоріях</li>
          </ul>
          
          <div className="mb-4">
            <button 
              className="btn btn-primary" 
              onClick={initializeAllData} 
              disabled={loading}
            >
              {loading ? 'Ініціалізація...' : 'Ініціалізувати базу даних'}
            </button>
          </div>
          
          {logs.length > 0 && (
            <div className="mt-4">
              <h4>Журнал ініціалізації:</h4>
              <div className="logs-container p-3 bg-light border" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {logs.map((log, index) => (
                  <div key={index} className="log-entry">
                    <span className="log-time text-muted">[{log.time}]</span> {log.text}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {initialized && (
            <div className="mt-4 alert alert-success">
              <h4>Ініціалізація завершена!</h4>
              <p>Тепер ви можете перейти до форми додавання товарів.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default InitializeFirebaseData;