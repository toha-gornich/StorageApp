import React, { useState, useEffect } from 'react';
import { app } from '../../FirebaseConfig';
import { getFirestore, collection, addDoc, getDocs } from 'firebase/firestore';

function ProductForm() {
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

      // Додавання продукту до колекції products
      const docRef = await addDoc(collection(db, 'products'), productToSave);

      console.log('Товар успішно додано з ID:', docRef.id);
      setMessage({ text: 'Товар успішно додано до бази даних', type: 'success' });

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

  return (
    <div className="card">
      <div className="card-header">
        <h2>Заповнення товару на склад</h2>
      </div>
      <div className="card-body">
        {message.text && (
          <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-danger'}`}>
            {message.text}
          </div>
        )}

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

