import React, { useState, useEffect, useRef } from 'react';
import { app } from '../../FirebaseConfig';
import { getFirestore, collection, getDocs, addDoc, doc, getDoc, updateDoc, query, where } from 'firebase/firestore';
import * as XLSX from 'xlsx';

function ProductUnloading() {
  const [unloading, setUnloading] = useState({
    productId: '',
    quantity: '',
    destinationType: 'storage', // 'storage' або 'shop'
    destinationId: '',
    unloadingDate: new Date().toISOString().split('T')[0],
    reason: '',
    responsiblePerson: '',
    storageLocation: '',
  });

  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [storages, setStorages] = useState([]);
  const [shops, setShops] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [destinations, setDestinations] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchBy, setSearchBy] = useState('name'); // 'name', 'barcode' або 'location'
  const [storageLocations, setStorageLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState('');
  const fileInputRef = useRef(null);
  const [bulkUnloadingData, setBulkUnloadingData] = useState([]);
  const [showBulkPreview, setShowBulkPreview] = useState(false);

  const db = getFirestore(app);

  // Завантаження необхідних даних
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        // Отримання товарів
        const productSnapshot = await getDocs(collection(db, 'products'));
        const productsData = productSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setProducts(productsData);
        setFilteredProducts(productsData);

        // Отримання складів
        const storageSnapshot = await getDocs(collection(db, 'storages'));
        const storagesData = storageSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setStorages(storagesData);

        // Отримання магазинів
        const shopSnapshot = await getDocs(collection(db, 'shops'));
        const shopsData = shopSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setShops(shopsData);

        // Збираємо унікальні місця зберігання з усіх товарів
        const locations = new Set();
        productsData.forEach(product => {
          if (product.storageLocation) {
            locations.add(product.storageLocation);
          }
        });
        setStorageLocations(Array.from(locations));
      } catch (error) {
        console.error('Помилка при завантаженні даних:', error);
        setMessage({ text: 'Помилка при завантаженні даних: ' + error.message, type: 'error' });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [db]);

  // Фільтрація товарів при зміні пошукового запиту або вибраного місця
  useEffect(() => {
    let results = [...products];

    // Фільтрація за місцем зберігання, якщо вибрано
    if (selectedLocation) {
      results = results.filter(product => product.storageLocation === selectedLocation);
    }

    // Пошуковий запит
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();

      if (searchBy === 'name') {
        results = results.filter(product =>
          product.name.toLowerCase().includes(term)
        );
      } else if (searchBy === 'barcode') {
        results = results.filter(product =>
          product.barcode.toLowerCase().includes(term)
        );
      } else if (searchBy === 'category') {
        results = results.filter(product =>
          product.category && product.category.toLowerCase().includes(term)
        );
      }
    }

    setFilteredProducts(results);
  }, [searchTerm, searchBy, products, selectedLocation]);

  // Оновлення списку доступних пунктів призначення при зміні типу призначення
  useEffect(() => {
    if (unloading.destinationType === 'storage') {
      setDestinations(storages);
    } else if (unloading.destinationType === 'shop') {
      setDestinations(shops);
    }
  }, [unloading.destinationType, storages, shops]);

  // Завантаження детальної інформації про обраний товар
  useEffect(() => {
    const fetchProductDetails = async () => {
      if (unloading.productId) {
        try {
          const productDoc = await getDoc(doc(db, 'products', unloading.productId));
          if (productDoc.exists()) {
            setSelectedProduct({ id: productDoc.id, ...productDoc.data() });
          }
        } catch (error) {
          console.error('Помилка при отриманні деталей товару:', error);
        }
      } else {
        setSelectedProduct(null);
      }
    };

    fetchProductDetails();
  }, [unloading.productId, db]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUnloading((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Очистка ID призначення при зміні типу призначення
    if (name === 'destinationType') {
      setUnloading((prev) => ({
        ...prev,
        destinationId: '',
      }));
    }
  };

  const handleLocationChange = (e) => {
    const location = e.target.value;
    setSelectedLocation(location);

    // Якщо вибрано нове місце, оновлюємо фільтрований список
    if (location) {
      const locationProducts = products.filter(product =>
        product.storageLocation === location
      );
      setFilteredProducts(locationProducts);
    } else {
      setFilteredProducts(products);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleSearchByChange = (e) => {
    setSearchBy(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ text: '', type: '' });

    try {
      if (!selectedProduct) {
        throw new Error('Товар не знайдено');
      }

      // Перевірка доступної кількості
      if (parseInt(unloading.quantity, 10) > selectedProduct.quantity) {
        throw new Error('Кількість для вивантаження перевищує наявну кількість');
      }

      // Створення запису про вивантаження
      const unloadingToSave = {
        ...unloading,
        quantity: parseInt(unloading.quantity, 10),
        unloadingDate: unloading.unloadingDate,
        productName: selectedProduct.name,
        productBarcode: selectedProduct.barcode,
        storageLocation: selectedProduct.storageLocation || '',
        createdAt: new Date()
      };

      // Додавання запису в колекцію транзакцій/вивантажень
      const unloadingRef = await addDoc(collection(db, 'unloadings'), unloadingToSave);

      // Оновлення кількості товару на складі
      const productRef = doc(db, 'products', unloading.productId);
      await updateDoc(productRef, {
        quantity: selectedProduct.quantity - parseInt(unloading.quantity, 10)
      });

      console.log('Вивантаження успішно зареєстровано з ID:', unloadingRef.id);
      setMessage({ text: 'Товар успішно вивантажено', type: 'success' });

      // Очищення форми
      setUnloading({
        productId: '',
        quantity: '',
        destinationType: 'storage',
        destinationId: '',
        unloadingDate: new Date().toISOString().split('T')[0],
        reason: '',
        responsiblePerson: '',
        storageLocation: '',
      });
      setSelectedProduct(null);
    } catch (error) {
      console.error('Помилка при вивантаженні товару:', error);
      setMessage({ text: 'Помилка при вивантаженні товару: ' + error.message, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  // Функція для обробки завантаження Excel файлу
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        // Перевірка структури даних
        if (jsonData.length === 0) {
          setMessage({ text: 'Файл не містить даних', type: 'error' });
          return;
        }

        // Очікувана структура: barcode або productId, quantity, destinationType, destinationId (опціонально), reason
        const validatedData = jsonData.map(row => {
          // Знаходимо товар за штрих-кодом
          const product = products.find(p =>
            p.barcode === String(row.barcode) ||
            p.id === row.productId
          );

          if (!product) {
            return { ...row, valid: false, error: 'Товар не знайдено' };
          }

          if (!row.quantity || row.quantity <= 0) {
            return { ...row, valid: false, error: 'Невірна кількість' };
          }

          if (row.quantity > product.quantity) {
            return { ...row, valid: false, error: 'Кількість перевищує наявну' };
          }

          return {
            productId: product.id,
            productName: product.name,
            barcode: product.barcode,
            quantity: parseInt(row.quantity, 10),
            destinationType: row.destinationType || unloading.destinationType,
            destinationId: row.destinationId || '',
            reason: row.reason || 'Масове вивантаження',
            unloadingDate: row.unloadingDate || unloading.unloadingDate,
            responsiblePerson: row.responsiblePerson || unloading.responsiblePerson,
            storageLocation: product.storageLocation || '',
            valid: true
          };
        });

        setBulkUnloadingData(validatedData);
        setShowBulkPreview(true);
        setMessage({ text: '', type: '' });
      } catch (error) {
        console.error('Помилка при обробці файлу:', error);
        setMessage({ text: 'Помилка при обробці файлу: ' + error.message, type: 'error' });
      }
    };
    reader.readAsArrayBuffer(file);
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
  // Функція для обробки масового вивантаження
  const handleBulkUnloading = async () => {
    setIsLoading(true);
    setMessage({ text: '', type: '' });

    try {
      const validItems = bulkUnloadingData.filter(item => item.valid);

      if (validItems.length === 0) {
        throw new Error('Немає валідних товарів для вивантаження');
      }

      let successCount = 0;
      let errorCount = 0;

      // Послідовна обробка кожного елемента
      for (const item of validItems) {
        try {
          // Отримуємо актуальні дані товару
          const productRef = doc(db, 'products', item.productId);
          const productSnap = await getDoc(productRef);

          if (!productSnap.exists()) {
            errorCount++;
            continue;
          }

          const currentProduct = productSnap.data();

          // Повторна перевірка кількості
          if (item.quantity > currentProduct.quantity) {
            errorCount++;
            continue;
          }

          // Створення запису про вивантаження
          const unloadingToSave = {
            productId: item.productId,
            quantity: item.quantity,
            destinationType: item.destinationType,
            destinationId: item.destinationId,
            unloadingDate: item.unloadingDate,
            reason: item.reason,
            responsiblePerson: item.responsiblePerson,
            productName: currentProduct.name,
            productBarcode: currentProduct.barcode,
            storageLocation: currentProduct.storageLocation || '',
            createdAt: new Date()
          };

          // Додавання запису про вивантаження
          await addDoc(collection(db, 'unloadings'), unloadingToSave);

          // Оновлення кількості товару
          await updateDoc(productRef, {
            quantity: currentProduct.quantity - item.quantity
          });

          successCount++;
        } catch (error) {
          console.error('Помилка при обробці товару:', error);
          errorCount++;
        }
      }

      // Оновлення списку товарів після масового вивантаження
      const productSnapshot = await getDocs(collection(db, 'products'));
      const productsData = productSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProducts(productsData);
      setFilteredProducts(productsData);

      setMessage({
        text: `Масове вивантаження завершено. Успішно: ${successCount}, з помилками: ${errorCount}`,
        type: successCount > 0 ? 'success' : 'error'
      });

      // Скидання стану
      setBulkUnloadingData([]);
      setShowBulkPreview(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Помилка при масовому вивантаженні:', error);
      setMessage({ text: 'Помилка при масовому вивантаженні: ' + error.message, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  // Функція для скасування масового вивантаження
  const cancelBulkUnloading = () => {
    setBulkUnloadingData([]);
    setShowBulkPreview(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Функція для завантаження шаблону Excel
  const downloadTemplate = () => {
    const template = [
      {
        barcode: '1234567890123',
        quantity: 10,
        destinationType: 'storage', // або 'shop', 'writeoff'
        destinationId: '', // ID місця призначення
        reason: 'Переміщення',
        unloadingDate: new Date().toISOString().split('T')[0],
        responsiblePerson: 'Іван Петров'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Шаблон');
    XLSX.writeFile(wb, 'шаблон_вивантаження.xlsx');
  };

  return (
    <div className="card">
      <div className="card-header">
        <h2>Вивантаження товару зі складу</h2>
      </div>
      <div className="card-body">
        {message.text && (
          <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-danger'}`}>
            {message.text}
          </div>
        )}

        {/* Розділ масового вивантаження */}
        <div className="card mb-4">
          <div className="card-header">
            <h4>Масове вивантаження через Excel</h4>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-6">
                <div className="form-group">
                  <label htmlFor="excelFile">Виберіть файл Excel</label>
                  <input
                    type="file"
                    className="form-control-file"
                    id="excelFile"
                    accept=".xlsx, .xls"
                    onChange={handleFileUpload}
                    ref={fileInputRef}
                    style={fileInputStyles.original}
                  />
                  <label htmlFor="excelFile" style={fileInputStyles.custom}>
                    Обрати файл
                  </label>
                  <small className="form-text text-muted mt-2">
                    Завантажте Excel файл з даними для вивантаження
                  </small>
                </div>
              </div>
              <div className="col-md-6">
                <button
                  type="button"
                  className="btn btn-outline-primary mt-4"
                  onClick={downloadTemplate}
                >
                  Завантажити шаблон Excel
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Попередній перегляд масового вивантаження */}
        {showBulkPreview && (
          <div className="card mb-4">
            <div className="card-header">
              <h4>Попередній перегляд масового вивантаження</h4>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-striped">
                  <thead>
                    <tr>
                      <th>Штрихкод</th>
                      <th>Назва</th>
                      <th>Кількість</th>
                      <th>Тип призначення</th>
                      <th>Причина</th>
                      <th>Статус</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bulkUnloadingData.map((item, index) => (
                      <tr key={index} className={item.valid ? '' : 'table-danger'}>
                        <td>{item.barcode}</td>
                        <td>{item.productName || '-'}</td>
                        <td>{item.quantity}</td>
                        <td>{item.destinationType}</td>
                        <td>{item.reason}</td>
                        <td>
                          {item.valid ?
                            <span className="badge badge-success">Готово</span> :
                            <span className="badge badge-danger" title={item.error}>{item.error}</span>
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-3">
                <button
                  type="button"
                  className="btn btn-success mr-2"
                  onClick={handleBulkUnloading}
                  disabled={isLoading || bulkUnloadingData.filter(i => i.valid).length === 0}
                >
                  {isLoading ? 'Обробка...' : 'Підтвердити вивантаження'}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary ml-2"
                  onClick={cancelBulkUnloading}
                  disabled={isLoading}
                >
                  Скасувати
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Розширений пошук товарів */}
        <div className="card mb-4">
          <div className="card-header">
            <h4>Пошук товару</h4>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-4">
                <div className="form-group">
                  <label htmlFor="searchBy">Шукати за:</label>
                  <select
                    className="form-control"
                    id="searchBy"
                    value={searchBy}
                    onChange={handleSearchByChange}
                  >
                    <option value="name">Назвою</option>
                    <option value="barcode">Штрих-кодом</option>
                    <option value="category">Категорією</option>
                  </select>
                </div>
              </div>
              <div className="col-md-8">
                <div className="form-group">
                  <label htmlFor="searchTerm">Пошуковий запит:</label>
                  <input
                    type="text"
                    className="form-control"
                    id="searchTerm"
                    value={searchTerm}
                    onChange={handleSearch}
                    placeholder={`Введіть ${searchBy === 'name' ? 'назву' : searchBy === 'barcode' ? 'штрих-код' : 'категорію'} товару`}
                  />
                </div>
              </div>
            </div>
            <div className="row mt-2">
              <div className="col-md-6">
                <div className="form-group">
                  <label htmlFor="storageLocation">Місце на складі:</label>
                  <select
                    className="form-control"
                    id="storageLocation"
                    value={selectedLocation}
                    onChange={handleLocationChange}
                  >
                    <option value="">Всі місця</option>
                    {storageLocations.map((location, index) => (
                      <option key={index} value={location}>
                        {location}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="col-md-6">
                <div className="form-group">
                  <label>Знайдено товарів: {filteredProducts.length}</label>
                </div>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="productId">Товар</label>
            <select
              className="form-control"
              id="productId"
              name="productId"
              value={unloading.productId}
              onChange={handleChange}
              required
            >
              <option value="">Виберіть товар</option>
              {filteredProducts.map(product => (
                <option key={product.id} value={product.id}>
                  {product.name} - {product.barcode}
                  {product.storageLocation ? ` (Місце: ${product.storageLocation})` : ''}
                  (Доступно: {product.quantity})
                </option>
              ))}
            </select>
            <small className="form-text text-muted">
              {filteredProducts.length === 0 ? 'Немає товарів, що відповідають критеріям пошуку' :
                `Знайдено ${filteredProducts.length} товарів. Використовуйте пошук вище для фільтрації.`}
            </small>
          </div>

          {selectedProduct && (
            <div className="alert alert-info mt-2">
              <h5>Інформація про товар:</h5>
              <p>Назва: {selectedProduct.name}</p>
              <p>Штрих-код: {selectedProduct.barcode}</p>
              <p>Ціна: {selectedProduct.price}</p>
              <p>Доступна кількість: {selectedProduct.quantity}</p>
              {selectedProduct.storageLocation && (
                <p>Місце на складі: {selectedProduct.storageLocation}</p>
              )}
              {selectedProduct.expiryDate && (
                <p>Термін придатності: {selectedProduct.expiryDate}</p>
              )}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="quantity">Кількість для вивантаження</label>
            <input
              type="number"
              className="form-control"
              id="quantity"
              name="quantity"
              value={unloading.quantity}
              onChange={handleChange}
              min="1"
              max={selectedProduct?.quantity || 1}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="destinationType">Тип призначення</label>
            <select
              className="form-control"
              id="destinationType"
              name="destinationType"
              value={unloading.destinationType}
              onChange={handleChange}
              required
            >
              <option value="storage">Інший склад</option>
              <option value="shop">Магазин</option>
              <option value="writeoff">Списання</option>
            </select>
          </div>

          {unloading.destinationType !== 'writeoff' && (
            <div className="form-group">
              <label htmlFor="destinationId">Місце призначення</label>
              <select
                className="form-control"
                id="destinationId"
                name="destinationId"
                value={unloading.destinationId}
                onChange={handleChange}
                required
              >
                <option value="">Виберіть {unloading.destinationType === 'storage' ? 'склад' : 'магазин'}</option>
                {destinations.map(dest => (
                  <option key={dest.id} value={dest.id}>
                    {unloading.destinationType === 'storage' ? dest.address : dest.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="reason">Причина вивантаження</label>
            <textarea
              className="form-control"
              id="reason"
              name="reason"
              value={unloading.reason}
              onChange={handleChange}
              rows="2"
              required
            ></textarea>
          </div>

          <div className="form-group">
            <label htmlFor="unloadingDate">Дата вивантаження</label>
            <input
              type="date"
              className="form-control"
              id="unloadingDate"
              name="unloadingDate"
              value={unloading.unloadingDate}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="responsiblePerson">Відповідальна особа</label>
            <input
              type="text"
              className="form-control"
              id="responsiblePerson"
              name="responsiblePerson"
              value={unloading.responsiblePerson}
              onChange={handleChange}
              required
            />
          </div>

          <div className="mt-4 mb-2">
            <button type="submit" className="btn btn-primary" disabled={isLoading}>
              {isLoading ? 'Вивантаження...' : 'Вивантажити товар'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ProductUnloading;