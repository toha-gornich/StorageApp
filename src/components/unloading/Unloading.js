import React, { useState, useEffect } from 'react';
import { app } from '../../FirebaseConfig';
import { getFirestore, collection, getDocs, addDoc, doc, getDoc, updateDoc } from 'firebase/firestore';

function ProductUnloading() {
  const [unloading, setUnloading] = useState({
    productId: '',
    quantity: '',
    destinationType: 'storage', // 'storage' або 'shop'
    destinationId: '',
    unloadingDate: new Date().toISOString().split('T')[0],
    reason: '',
    responsiblePerson: '',
  });

  const [products, setProducts] = useState([]);
  const [storages, setStorages] = useState([]);
  const [shops, setShops] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [destinations, setDestinations] = useState([]);

  const db = getFirestore(app);

  // Завантаження необхідних даних
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Отримання товарів
        const productSnapshot = await getDocs(collection(db, 'products'));
        const productsData = productSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setProducts(productsData);

        // Отримання складів
        const storageSnapshot = await getDocs(collection(db, 'storages'));
        const storagesData = storageSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setStorages(storagesData);

        // Отримання магазинів
        const shopSnapshot = await getDocs(collection(db, 'shops'));
        const shopsData = shopSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setShops(shopsData);
      } catch (error) {
        console.error('Помилка при завантаженні даних:', error);
        setMessage({ text: 'Помилка при завантаженні даних: ' + error.message, type: 'error' });
      }
    };

    fetchData();
  }, [db]);

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
      });
      setSelectedProduct(null);
    } catch (error) {
      console.error('Помилка при вивантаженні товару:', error);
      setMessage({ text: 'Помилка при вивантаженні товару: ' + error.message, type: 'error' });
    } finally {
      setIsLoading(false);
    }
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
              {products.map(product => (
                <option key={product.id} value={product.id}>
                  {product.name} - {product.barcode} (Доступно: {product.quantity})
                </option>
              ))}
            </select>
          </div>

          {selectedProduct && (
            <div className="alert alert-info mt-2">
              <h5>Інформація про товар:</h5>
              <p>Назва: {selectedProduct.name}</p>
              <p>Штрих-код: {selectedProduct.barcode}</p>
              <p>Ціна: {selectedProduct.price}</p>
              <p>Доступна кількість: {selectedProduct.quantity}</p>
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