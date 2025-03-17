import React, { useState, useEffect } from 'react';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';
import { app } from '../../FirebaseConfig'; 

function Inventory() {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Дані для фільтрації
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [storages, setStorages] = useState([]);
  const [storageAreas, setStorageAreas] = useState([]);
  
  // Стан фільтрів
  const [filters, setFilters] = useState({
    searchQuery: '',
    category: '',
    supplier: '',
    storage: '',
    storageArea: ''
  });
  
  const db = getFirestore(app);
  
  // Завантаження всіх потрібних даних при монтуванні компонента
  useEffect(() => {
    const fetchAllData = async () => {
      setIsLoading(true);
      try {
        // Завантаження продуктів
        const productsSnapshot = await getDocs(collection(db, 'products'));
        const productsData = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setProducts(productsData);
        setFilteredProducts(productsData);
        
        // Завантаження категорій
        const categoriesSnapshot = await getDocs(collection(db, 'categories'));
        const categoriesData = categoriesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setCategories(categoriesData);
        
        // Завантаження постачальників
        const suppliersSnapshot = await getDocs(collection(db, 'suppliers'));
        const suppliersData = suppliersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setSuppliers(suppliersData);
        
        // Завантаження складів
        const storagesSnapshot = await getDocs(collection(db, 'storages'));
        const storagesData = storagesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setStorages(storagesData);
        
        // Завантаження місць на складах
        const storageAreasSnapshot = await getDocs(collection(db, 'storageAreas'));
        const storageAreasData = storageAreasSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setStorageAreas(storageAreasData);
        
      } catch (err) {
        setError(`Помилка при завантаженні даних: ${err.message}`);
        console.error('Помилка при завантаженні даних:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAllData();
  }, [db]);
  
  // Обробник зміни фільтрів
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Застосування фільтрів
  useEffect(() => {
    let result = [...products];
    
    // Фільтр за пошуковим запитом (шукаємо в назві та штрих-коді)
    if (filters.searchQuery) {
      const searchLower = filters.searchQuery.toLowerCase();
      result = result.filter(product => 
        product.name.toLowerCase().includes(searchLower) || 
        product.barcode.toLowerCase().includes(searchLower)
      );
    }
    
    // Фільтр за категорією
    if (filters.category) {
      result = result.filter(product => product.idCategory === filters.category);
    }
    
    // Фільтр за постачальником
    if (filters.supplier) {
      result = result.filter(product => product.idSupplier === filters.supplier);
    }
    
    // Фільтр за складом
    if (filters.storage) {
      result = result.filter(product => product.idStorage === filters.storage);
    }
    
    // Фільтр за місцем на складі
    if (filters.storageArea) {
      result = result.filter(product => product.idStorageArea === filters.storageArea);
    }
    
    setFilteredProducts(result);
  }, [filters, products]);
  
  // Скидання всіх фільтрів
  const resetFilters = () => {
    setFilters({
      searchQuery: '',
      category: '',
      supplier: '',
      storage: '',
      storageArea: ''
    });
  };
  
  // Допоміжні функції для отримання назв за ID
  const getCategoryName = (categoryId) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : 'Невідомо';
  };
  
  const getSupplierName = (supplierId) => {
    const supplier = suppliers.find(sup => sup.id === supplierId);
    return supplier ? supplier.name : 'Невідомо';
  };
  
  const getStorageName = (storageId) => {
    const storage = storages.find(store => store.id === storageId);
    return storage ? storage.name : 'Невідомо';
  };
  
  const getStorageAreaName = (areaId) => {
    const area = storageAreas.find(a => a.id === areaId);
    return area ? area.name : 'Невідомо';
  };
  
  // Фільтрація місць на складі відповідно до обраного складу
  const filteredStorageAreas = filters.storage 
    ? storageAreas.filter(area => area.storageId === filters.storage) 
    : storageAreas;
  
  if (isLoading) {
    return <div className="alert alert-info">Завантаження даних...</div>;
  }
  
  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  return (
    <div className="container mt-4">
      <h1 className="mb-4">Список товарів на складах</h1>
      
      {/* Блок фільтрів */}
      <div className="card mb-4">
        <div className="card-header">
          <h3>Фільтри та пошук</h3>
        </div>
        <div className="card-body">
          <div className="row">
            {/* Пошук по назві або штрих-коду */}
            <div className="col-md-12 mb-3">
              <label htmlFor="searchQuery">Пошук за назвою або штрих-кодом:</label>
              <input
                type="text"
                className="form-control"
                id="searchQuery"
                name="searchQuery"
                value={filters.searchQuery}
                onChange={handleFilterChange}
                placeholder="Введіть текст для пошуку..."
              />
            </div>
            
            {/* Фільтр за категорією */}
            <div className="col-md-3 mb-3">
              <label htmlFor="category">Категорія:</label>
              <select
                className="form-control"
                id="category"
                name="category"
                value={filters.category}
                onChange={handleFilterChange}
              >
                <option value="">Всі категорії</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </div>
            
            {/* Фільтр за постачальником */}
            <div className="col-md-3 mb-3">
              <label htmlFor="supplier">Постачальник:</label>
              <select
                className="form-control"
                id="supplier"
                name="supplier"
                value={filters.supplier}
                onChange={handleFilterChange}
              >
                <option value="">Всі постачальники</option>
                {suppliers.map(supplier => (
                  <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                ))}
              </select>
            </div>
            
            {/* Фільтр за складом */}
            <div className="col-md-3 mb-3">
              <label htmlFor="storage">Склад:</label>
              <select
                className="form-control"
                id="storage"
                name="storage"
                value={filters.storage}
                onChange={handleFilterChange}
              >
                <option value="">Всі склади</option>
                {storages.map(storage => (
                  <option key={storage.id} value={storage.id}>{storage.name}</option>
                ))}
              </select>
            </div>
            
            {/* Фільтр за місцем на складі */}
            <div className="col-md-3 mb-3">
              <label htmlFor="storageArea">Місце на складі:</label>
              <select
                className="form-control"
                id="storageArea"
                name="storageArea"
                value={filters.storageArea}
                onChange={handleFilterChange}
                disabled={!filters.storage}
              >
                <option value="">Всі місця</option>
                {filteredStorageAreas.map(area => (
                  <option key={area.id} value={area.id}>{area.name}</option>
                ))}
              </select>
            </div>
            
            {/* Кнопка скидання фільтрів */}
            <div className="col-12 text-right">
              <button 
                className="btn btn-secondary" 
                onClick={resetFilters}
              >
                Скинути фільтри
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Статистика результатів */}
      <div className="mb-3">
        <p>Знайдено товарів: <strong>{filteredProducts.length}</strong> з {products.length}</p>
      </div>
      
      {/* Таблиця з товарами */}
      {filteredProducts.length === 0 ? (
        <div className="alert alert-warning">
          Товари не знайдено. Спробуйте змінити параметри фільтрації.
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-striped table-bordered">
            <thead className="thead-dark">
              <tr>
                <th>№</th>
                <th>Назва товару</th>
                <th>Штрих-код</th>
                <th>Ціна</th>
                <th>Вага/Об'єм</th>
                <th>Термін придатності</th>
                <th>Категорія</th>
                <th>Постачальник</th>
                <th>Склад</th>
                <th>Місце</th>
                <th>Кількість</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product, index) => (
                <tr key={product.id}>
                  <td>{index + 1}</td>
                  <td>{product.name}</td>
                  <td>{product.barcode}</td>
                  <td>{product.price.toFixed(2)} грн</td>
                  <td>{product.weightOrVolume}</td>
                  <td>{product.expiryDate ? new Date(product.expiryDate).toLocaleDateString() : '-'}</td>
                  <td>{getCategoryName(product.idCategory)}</td>
                  <td>{getSupplierName(product.idSupplier)}</td>
                  <td>{getStorageName(product.idStorage)}</td>
                  <td>{getStorageAreaName(product.idStorageArea)}</td>
                  <td>{product.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Inventory;