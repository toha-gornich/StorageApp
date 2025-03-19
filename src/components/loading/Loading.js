import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { app } from '../../FirebaseConfig';
import { getAuth } from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  getDoc, 
  doc, 
  runTransaction, 
  serverTimestamp, 
  Timestamp 
} from 'firebase/firestore';

function ProductForm() {
  const auth = getAuth(app);
  const [product, setProduct] = useState({
    name: '',
    barcode: '',
    price: '',
    weightOrVolume: '',
    expiryDate: '',
    idCategory: '',
    idStorage: '',
    idStorageArea: '',
    idSupplier: '',
    quantity: '',
  });

  // Стан для імпорту Excel
  const [excelData, setExcelData] = useState([]);
  const [importStatus, setImportStatus] = useState({ current: 0, total: 0 });
  const [importErrors, setImportErrors] = useState([]);
  const [isImporting, setIsImporting] = useState(false);

  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [storages, setStorages] = useState([]);
  const [storageAreas, setStorageAreas] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const db = getFirestore(app);

  // Завантаження категорій, постачальників, складів та місць
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Отримання категорій
        const categorySnapshot = await getDocs(collection(db, 'categories'));
        const categoriesData = categorySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setCategories(categoriesData);

        // Отримання постачальників
        const supplierSnapshot = await getDocs(collection(db, 'suppliers'));
        const suppliersData = supplierSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setSuppliers(suppliersData);

        // Отримання складів
        const storageSnapshot = await getDocs(collection(db, 'storages'));
        const storagesData = storageSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setStorages(storagesData);

        // Отримання місць на складі
        const storageAreaSnapshot = await getDocs(collection(db, 'storageAreas'));
        const storageAreasData = storageAreaSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setStorageAreas(storageAreasData);
      } catch (error) {
        console.error('Помилка при завантаженні даних:', error);
        setMessage({ text: 'Помилка при завантаженні даних', type: 'error' });
      }
    };

    fetchData();
  }, [db]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProduct((prevProduct) => ({
      ...prevProduct,
      [name]: value,
    }));
  };

  // Функція для отримання актуальних назв пов'язаних сутностей
  const getRelatedEntityNames = async (productData) => {
    try {
      // Отримання назви категорії
      const categoryDoc = await getDoc(doc(db, 'categories', productData.idCategory));
      const categoryName = categoryDoc.exists() ? categoryDoc.data().name : 'Невідома категорія';

      // Отримання назви постачальника
      const supplierDoc = await getDoc(doc(db, 'suppliers', productData.idSupplier));
      const supplierName = supplierDoc.exists() ? supplierDoc.data().name : 'Невідомий постачальник';

      // Отримання адреси складу
      const storageDoc = await getDoc(doc(db, 'storages', productData.idStorage));
      const storageAddress = storageDoc.exists() ? storageDoc.data().address : 'Невідома адреса';

      // Отримання назви місця на складі
      const storageAreaDoc = await getDoc(doc(db, 'storageAreas', productData.idStorageArea));
      const storageAreaName = storageAreaDoc.exists() ? storageAreaDoc.data().name : 'Невідоме місце';

      return {
        categoryName,
        supplierName,
        storageAddress,
        storageAreaName
      };
    } catch (error) {
      console.error('Помилка при отриманні пов\'язаних даних:', error);
      return {
        categoryName: 'Помилка завантаження',
        supplierName: 'Помилка завантаження',
        storageAddress: 'Помилка завантаження',
        storageAreaName: 'Помилка завантаження'
      };
    }
  };

  // Функція для обробки Excel-файлу
  const handleExcelFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = evt.target.result;
      const workbook = XLSX.read(data, { type: 'binary' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      setExcelData(jsonData);
      setMessage({ text: `Завантажено ${jsonData.length} товарів з Excel`, type: 'success' });
    };
    reader.readAsBinaryString(file);
  };

  // Пошук ID за назвою сутності
  const findEntityIdByName = (entityArray, entityName, entityKey = 'name') => {
    const entity = entityArray.find(item => 
      item[entityKey].toLowerCase() === entityName.toLowerCase()
    );
    return entity ? entity.id : null;
  };

  // Функція імпорту товарів
  const importProducts = async () => {
    if (excelData.length === 0) {
      setMessage({ text: 'Немає даних для імпорту', type: 'error' });
      return;
    }

    setIsImporting(true);
    setImportStatus({ current: 0, total: excelData.length });
    setImportErrors([]);

    for (let i = 0; i < excelData.length; i++) {
      try {
        const item = excelData[i];
        
        // Знаходимо ID категорії, постачальника, складу та місця на складі
        const idCategory = findEntityIdByName(categories, item.category);
        const idSupplier = findEntityIdByName(suppliers, item.supplier);
        const idStorage = findEntityIdByName(storages, item.storage, 'address');
        const idStorageArea = findEntityIdByName(storageAreas, item.storageArea);

        if (!idCategory || !idSupplier || !idStorage || !idStorageArea) {
          throw new Error(
            `Не знайдено: ${!idCategory ? 'категорію' : ''} ${!idSupplier ? 'постачальника' : ''} ${!idStorage ? 'склад' : ''} ${!idStorageArea ? 'місце на складі' : ''}`
          );
        }

        // Формуємо об'єкт товару
        const productToSave = {
          name: item.name,
          barcode: item.barcode || '',
          price: parseFloat(item.price) || 0,
          weightOrVolume: item.weightOrVolume || '',
          expiryDate: item.expiryDate || '',
          idCategory,
          idSupplier,
          idStorage,
          idStorageArea,
          quantity: parseInt(item.quantity, 10) || 0
        };

        // Отримуємо інформацію про пов'язані сутності
        const relatedEntities = await getRelatedEntityNames(productToSave);

        // Транзакція для запису товару
        await runTransaction(db, async (transaction) => {
          // Додаємо товар
          const productRef = doc(collection(db, 'products'));
          transaction.set(productRef, productToSave);

          // Створюємо запис у журналі транзакцій
          const transactionRef = doc(collection(db, 'transactions'));
          transaction.set(transactionRef, {
            type: 'product_added_from_excel',
            timestamp: serverTimestamp(),
            userId: auth.currentUser ? auth.currentUser.uid : 'anonymous',
            userName: auth.currentUser ? auth.currentUser.displayName || auth.currentUser.email : 'anonymous',
            productId: productRef.id,
            productName: productToSave.name,
            productBarcode: productToSave.barcode,
            productPrice: productToSave.price,
            productQuantity: productToSave.quantity,
            categoryId: productToSave.idCategory,
            categoryName: relatedEntities.categoryName,
            supplierId: productToSave.idSupplier,
            supplierName: relatedEntities.supplierName,
            storageId: productToSave.idStorage,
            storageAddress: relatedEntities.storageAddress,
            storageAreaId: productToSave.idStorageArea,
            storageAreaName: relatedEntities.storageAreaName,
          });

          return { productId: productRef.id, transactionId: transactionRef.id };
        });

        setImportStatus(prev => ({ ...prev, current: i + 1 }));
      } catch (error) {
        console.error(`Помилка при імпорті рядка №${i + 1}:`, error);
        setImportErrors(prev => [...prev, { row: i + 1, name: excelData[i].name, error: error.message }]);
        setImportStatus(prev => ({ ...prev, current: i + 1 }));
      }
    }

    const successCount = importStatus.current - importErrors.length;
    setMessage({ 
      text: `Імпорт завершено. Успішно імпортовано: ${successCount} з ${excelData.length} товарів.`,
      type: importErrors.length > 0 ? 'warning' : 'success'
    });
    
    setIsImporting(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ text: '', type: '' });

    try {
      // Перетворення текстових полів на числові, де це необхідно
      const productToSave = {
        ...product,
        price: parseFloat(product.price),
        quantity: parseInt(product.quantity, 10)
      };

      // Отримуємо інформацію про пов'язані сутності для журналу транзакцій
      const relatedEntities = await getRelatedEntityNames(productToSave);

      // Використовуємо транзакцію для атомарного запису в дві колекції
      await runTransaction(db, async (transaction) => {
        // Додаємо товар до колекції products
        const productRef = doc(collection(db, 'products'));
        transaction.set(productRef, productToSave);

        // Створюємо запис у журналі транзакцій
        const transactionRef = doc(collection(db, 'transactions'));
        transaction.set(transactionRef, {
          type: 'product_added',
          timestamp: serverTimestamp(),
          userId: auth.currentUser ? auth.currentUser.uid : 'anonymous', // Якщо використовується аутентифікація
          userName: auth.currentUser ? auth.currentUser.displayName || auth.currentUser.email : 'anonymous',
          productId: productRef.id,
          productName: productToSave.name,
          productBarcode: productToSave.barcode,
          productPrice: productToSave.price,
          productQuantity: productToSave.quantity,
          categoryId: productToSave.idCategory,
          categoryName: relatedEntities.categoryName,
          supplierId: productToSave.idSupplier,
          supplierName: relatedEntities.supplierName,
          storageId: productToSave.idStorage,
          storageAddress: relatedEntities.storageAddress,
          storageAreaId: productToSave.idStorageArea,
          storageAreaName: relatedEntities.storageAreaName,
        });

        return { productId: productRef.id, transactionId: transactionRef.id };
      });

      console.log('Товар успішно додано з записом в журнал транзакцій');
      setMessage({ text: 'Товар успішно додано до бази даних з записом історії', type: 'success' });

      // Очищення форми після успішного додавання
      setProduct({
        name: '',
        barcode: '',
        price: '',
        weightOrVolume: '',
        expiryDate: '',
        idCategory: '',
        idStorage: '',
        idStorageArea: '',
        idSupplier: '',
        quantity: '',
      });
    } catch (error) {
      console.error('Помилка при додаванні товару:', error);
      setMessage({ text: 'Помилка при додаванні товару: ' + error.message, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  // Компонент для відображення шаблону Excel
  const downloadExcelTemplate = () => {
    // Створюємо шаблон для скачування
    const template = [
      {
        name: 'Приклад продукту',
        barcode: '1234567890123',
        price: '100.50',
        weightOrVolume: '500 г',
        expiryDate: '2025-12-31',
        category: categories[0]?.name || 'Вкажіть назву категорії',
        supplier: suppliers[0]?.name || 'Вкажіть назву постачальника',
        storage: storages[0]?.address || 'Вкажіть адресу складу',
        storageArea: storageAreas[0]?.name || 'Вкажіть назву місця',
        quantity: '10'
      }
    ];
    
    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Шаблон");
    XLSX.writeFile(wb, "товари_шаблон.xlsx");
  };

  const fileInputStyles = {
    original: {
      position: 'absolute',
      width: '0.1px',
      height: '0.1px',
      opacity: '0',
      overflow: 'hidden',
      zIndex: '-1'
    },
    custom: {
      display: 'inline-block',
      padding: '6px 12px',
      cursor: 'pointer',
      border: '1px solid #ced4da',
      borderRadius: '4px',
      backgroundColor: '#f8f9fa'
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <h2>Заповнення товару на склад</h2>
      </div>
      <div className="card-body">
        {message.text && (
          <div className={`alert ${message.type === 'success' ? 'alert-success' : message.type === 'warning' ? 'alert-warning' : 'alert-danger'}`}>
            {message.text}
          </div>
        )}

        {/* Секція для імпорту з Excel */}
        <div className="card mb-4">
          <div className="card-header">
            <h3>Масовий імпорт товарів з Excel</h3>
          </div>
          <div className="card-body">
            <div className="form-group">
              <label htmlFor="excelFile">Оберіть файл Excel (.xlsx)</label>
              <input
                    type="file"
                    className="form-control-file"
                    id="excelFile"
                    accept=".xlsx, .xls"
                    onChange={handleExcelFile}
                    style={fileInputStyles.original}
                  />
                  <label htmlFor="excelFile" style={fileInputStyles.custom}>
                    Обрати файл
                  </label>
                  
              <small className="text-muted">
                Формат файлу: Excel з колонками name, barcode, price, weightOrVolume, expiryDate, category, supplier, storage, storageArea, quantity
              </small>
            </div>
            
            <div className="d-flex mt-3">
              <button
                type="button"
                className="btn btn-secondary mr-2"
                onClick={downloadExcelTemplate}
                disabled={isImporting}
              >
                Завантажити шаблон
              </button>
              
              <button
                type="button"
                className="btn btn-success ml-2"
                onClick={importProducts}
                disabled={isImporting || excelData.length === 0}
              >
                {isImporting ? `Імпортую... (${importStatus.current}/${importStatus.total})` : 'Імпортувати товари'}
              </button>
            </div>

            {/* Прогрес імпорту */}
            {isImporting && (
              <div className="mt-3">
                <div className="progress">
                  <div
                    className="progress-bar"
                    role="progressbar"
                    style={{ width: `${(importStatus.current / importStatus.total * 100).toFixed(1)}%` }}
                    aria-valuenow={(importStatus.current / importStatus.total * 100).toFixed(1)}
                    aria-valuemin="0"
                    aria-valuemax="100"
                  >
                    {(importStatus.current / importStatus.total * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
            )}

            {/* Помилки імпорту */}
            {importErrors.length > 0 && (
              <div className="mt-3">
                <h4>Помилки імпорту ({importErrors.length}):</h4>
                <div className="table-responsive">
                  <table className="table table-sm table-striped">
                    <thead>
                      <tr>
                        <th>Рядок</th>
                        <th>Товар</th>
                        <th>Помилка</th>
                      </tr>
                    </thead>
                    <tbody>
                      {importErrors.map((err, idx) => (
                        <tr key={idx}>
                          <td>{err.row}</td>
                          <td>{err.name}</td>
                          <td>{err.error}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Форма додавання одиничного товару */}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Назва товару</label>
            <input
              type="text"
              className="form-control"
              id="name"
              name="name"
              value={product.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="barcode">Штрих-код</label>
            <input
              type="text"
              className="form-control"
              id="barcode"
              name="barcode"
              value={product.barcode}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="price">Ціна</label>
            <input
              type="number"
              className="form-control"
              id="price"
              name="price"
              value={product.price}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="weightOrVolume">Вага/Об'єм</label>
            <input
              type="text"
              className="form-control"
              id="weightOrVolume"
              name="weightOrVolume"
              value={product.weightOrVolume}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="expiryDate">Термін придатності</label>
            <input
              type="date"
              className="form-control"
              id="expiryDate"
              name="expiryDate"
              value={product.expiryDate}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="idCategory">Категорія</label>
            <select
              className="form-control"
              id="idCategory"
              name="idCategory"
              value={product.idCategory}
              onChange={handleChange}
              required
            >
              <option value="">Виберіть категорію</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="idSupplier">Постачальник</label>
            <select
              className="form-control"
              id="idSupplier"
              name="idSupplier"
              value={product.idSupplier}
              onChange={handleChange}
              required
            >
              <option value="">Виберіть постачальника</option>
              {suppliers.map(supplier => (
                <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="idStorage">Склад (Адреса)</label>
            <select
              className="form-control"
              id="idStorage"
              name="idStorage"
              value={product.idStorage}
              onChange={handleChange}
              required
            >
              <option value="">Виберіть склад</option>
              {storages.map(storage => (
                <option key={storage.id} value={storage.id}>{storage.address}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="idStorageArea">Місце на складі</label>
            <select
              className="form-control"
              id="idStorageArea"
              name="idStorageArea"
              value={product.idStorageArea}
              onChange={handleChange}
              required
            >
              <option value="">Виберіть місце на складі</option>
              {storageAreas.map(area => (
                <option key={area.id} value={area.id}>{area.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="quantity">Кількість</label>
            <input
              type="number"
              className="form-control"
              id="quantity"
              name="quantity"
              value={product.quantity}
              onChange={handleChange}
              required
            />
          </div>

          <div className="mt-4 mb-2">
            <button type="submit" className="btn btn-primary" disabled={isLoading}>
              {isLoading ? 'Додаємо...' : 'Додати товар'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ProductForm;