import React, { useState, useEffect } from 'react';
import { db } from '../../FirebaseConfig';
import { collection, query, where, getDocs, onSnapshot, doc, getDoc } from 'firebase/firestore';

function Home() {
  // Стани компонента
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [expiringProducts, setExpiringProducts] = useState([]);
  const [storages, setStorages] = useState([]);
  const [selectedStorage, setSelectedStorage] = useState('all');
  const [loading, setLoading] = useState(true);
  const [loadingExpiring, setLoadingExpiring] = useState(true);

  // Отримання списку складів з Firestore
  useEffect(() => {
    const fetchStorages = async () => {
      try {
        const storagesCollection = collection(db, 'storages');
        const storagesSnapshot = await getDocs(storagesCollection);
        const storagesList = storagesSnapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name
        }));
        setStorages(storagesList);
      } catch (error) {
        console.error('Помилка при отриманні списку складів:', error);
      }
    };

    fetchStorages();
  }, []);

  // Отримання продуктів з низьким запасом
  useEffect(() => {
    setLoading(true);
    
    // Базовий запит до колекції продуктів
    let productsRef = collection(db, 'products');
    let productsQuery;
    
    if (selectedStorage === 'all') {
      // Запит на всі продукти
      productsQuery = query(productsRef);
    } else {
      // Запит на продукти з конкретного складу
      productsQuery = query(productsRef, where('idStorage', '==', selectedStorage));
    }
    
    // Використовуємо onSnapshot для реального часу
    const unsubscribe = onSnapshot(productsQuery, async (snapshot) => {
      try {
        // Фільтруємо продукти, які потребують замовлення
        const products = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(product => product.quantity <= product.minQuantity);
        
        // Для кожного продукту отримуємо інформацію про склад
        const productsWithStorageInfo = await Promise.all(products.map(async (product) => {
          try {
            // Отримуємо інформацію про склад для продукту
            const storageDocRef = doc(db, 'storages', product.idStorage);
            const storageSnapshot = await getDoc(storageDocRef);
            const storageName = storageSnapshot.exists() ? storageSnapshot.data().name : 'Невідомий склад';
            
            return {
              ...product,
              storage: storageName
            };
          } catch (error) {
            console.error('Помилка при отриманні інформації про склад:', error);
            return {
              ...product,
              storage: 'Помилка завантаження'
            };
          }
        }));
        
        setLowStockProducts(productsWithStorageInfo);
        setLoading(false);
      } catch (error) {
        console.error('Помилка при обробці даних:', error);
        setLoading(false);
      }
    }, (error) => {
      console.error('Помилка при підписці на колекцію:', error);
      setLoading(false);
    });
    
    // Повертаємо функцію скасування підписки
    return () => unsubscribe();
  }, [selectedStorage]);

 // Отримання продуктів, що закінчуються або прострочені
useEffect(() => {
  setLoadingExpiring(true);
  
  // Базовий запит до колекції продуктів
  let productsRef = collection(db, 'products');
  let productsQuery;
  
  if (selectedStorage === 'all') {
    productsQuery = query(productsRef);
  } else {
    productsQuery = query(productsRef, where('idStorage', '==', selectedStorage));
  }
  
  // Розрахунок дати тиждень наперед
  const currentDate = new Date();
  const oneWeekAhead = new Date();
  oneWeekAhead.setDate(currentDate.getDate() + 7);
  
  console.log('Поточна дата:', currentDate);
  console.log('Дата через тиждень:', oneWeekAhead);
  
  const unsubscribe = onSnapshot(productsQuery, async (snapshot) => {
    try {
      // Виводимо всі продукти для діагностики
      console.log('Всі отримані продукти:', snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      
      // Фільтруємо продукти, які закінчуються або вже прострочені
      const products = snapshot.docs
        .map(doc => {
          const product = { id: doc.id, ...doc.data() };
          console.log(`Продукт ${product.name}, expiryDate:`, product.expiryDate);
          
          // Перевіряємо формат дати
          if (!product.expiryDate) {
            console.log(`Продукт ${product.name} не має дати закінчення терміну`);
            return product;
          }
          
          // Діагностика типу дати
          console.log(`Тип дати для ${product.name}:`, typeof product.expiryDate);
          
          // Спробуємо різні способи перетворення дати
          let expiryDate;
          
          if (product.expiryDate instanceof Date) {
            expiryDate = product.expiryDate;
            console.log(`${product.name}: Дата вже є об'єктом Date`);
          } else if (product.expiryDate && product.expiryDate.seconds) {
            // Firestore Timestamp
            expiryDate = new Date(product.expiryDate.seconds * 1000);
            console.log(`${product.name}: Firestore Timestamp перетворено в Date:`, expiryDate);
          } else if (typeof product.expiryDate === 'string') {
            // Рядок дати
            expiryDate = new Date(product.expiryDate);
            console.log(`${product.name}: Рядок дати перетворено в Date:`, expiryDate);
            
            // Перевірка на невалідну дату
            if (isNaN(expiryDate.getTime())) {
              console.log(`${product.name}: НЕВАЛІДНА ДАТА після перетворення!`);
              // Спробуємо виправити формат, якщо це "2024-18-03"
              const parts = product.expiryDate.split('-');
              if (parts.length === 3) {
                console.log(`Спроба виправити дату ${product.expiryDate} -> ${parts[0]}-${parts[2]}-${parts[1]}`);
                expiryDate = new Date(`${parts[0]}-${parts[2]}-${parts[1]}`);
                console.log(`Результат виправлення:`, expiryDate);
              }
            }
          } else {
            console.log(`${product.name}: Невідомий формат дати:`, product.expiryDate);
            expiryDate = new Date(0); // Використовуємо давню дату як фоллбек
          }
          
          product._processedExpiryDate = expiryDate;
          product._isExpiredByCalc = expiryDate <= currentDate;
          product._isExpiringByCalc = expiryDate <= oneWeekAhead;
          
          console.log(`${product.name}: Оброблена дата:`, expiryDate);
          console.log(`${product.name}: Прострочено: ${product._isExpiredByCalc}, Закінчується: ${product._isExpiringByCalc}`);
          
          return product;
        })
        .filter(product => {
          // Якщо немає дати закінчення терміну, пропускаємо
          if (!product.expiryDate) return false;
          
          // Використовуємо вже обчислену дату
          return product._isExpiringByCalc;
        });
      
      console.log('Відфільтровані продукти:', products);
      
      // Решта коду залишається без змін...
      const productsWithStorageInfo = await Promise.all(products.map(async (product) => {
        try {
          const storageDocRef = doc(db, 'storages', product.idStorage);
          const storageSnapshot = await getDoc(storageDocRef);
          const storageName = storageSnapshot.exists() ? storageSnapshot.data().name : 'Невідомий склад';
          
          // Використовуємо вже обчислену дату
          const expiryDate = product._processedExpiryDate;
          const formattedExpiryDate = expiryDate.toLocaleDateString('uk-UA');
          const isExpired = product._isExpiredByCalc;
          
          return {
            ...product,
            storage: storageName,
            formattedExpiryDate,
            isExpired
          };
        } catch (error) {
          console.error('Помилка при отриманні інформації про склад:', error);
          return {
            ...product,
            storage: 'Помилка завантаження',
            formattedExpiryDate: 'Невідомо',
            isExpired: false
          };
        }
      }));
      
      setExpiringProducts(productsWithStorageInfo);
      setLoadingExpiring(false);
    } catch (error) {
      console.error('Помилка при обробці даних:', error);
      setLoadingExpiring(false);
    }
  }, (error) => {
    console.error('Помилка при підписці на колекцію:', error);
    setLoadingExpiring(false);
  });
  
  return () => unsubscribe();
}, [selectedStorage]);
  // Функція для визначення стилю в залежності від кількості товару
  const getStockStatusClass = (quantity, minQuantity) => {
    if (quantity < minQuantity * 0.5) return 'text-danger';
    if (quantity <= minQuantity) return 'text-warning';
    return 'text-success';
  };

  // Функція для визначення стилю в залежності від терміну придатності
  const getExpiryStatusClass = (isExpired) => {
    return isExpired ? 'text-danger' : 'text-warning';
  };

  // Обробник зміни вибраного складу
  const handleStorageChange = (e) => {
    setSelectedStorage(e.target.value);
  };

  return (
    <div className="card">
      <div className="card-header">
        <h2>Головна сторінка</h2>
      </div>
      <div className="card-body">
        <p>Виберіть потрібний розділ у навігаційному меню.</p>
        
        {/* Фільтр складів */}
        <div className="d-flex align-items-center mb-3">
          <label htmlFor="mainStorageFilter" className="me-2">Склад:</label>
          <select 
            id="mainStorageFilter" 
            className="form-select form-select-sm" 
            value={selectedStorage} 
            onChange={handleStorageChange}
            style={{ width: '180px' }}
          >
            <option value="all">Всі склади</option>
            {storages.map(storage => (
              <option key={storage.id} value={storage.id}>
                {storage.name}
              </option>
            ))}
          </select>
        </div>
        
        {/* Таблиця товарів з низьким запасом */}
        <div className="mt-4">
          <div className="card">
            <div className="card-header bg-warning text-white">
              <h5 className="mb-0">
                <i className="fas fa-exclamation-triangle me-2"></i>
                Товари, що потребують замовлення
              </h5>
            </div>
            <div className="card-body p-0">
              <div className="low-stock-container" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {loading ? (
                  <div className="text-center p-3">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Завантаження...</span>
                    </div>
                  </div>
                ) : lowStockProducts.length > 0 ? (
                  <table className="table table-hover table-sm mb-0">
                    <thead className="sticky-top bg-light">
                      <tr>
                        <th>Назва товару</th>
                        <th>Кількість</th>
                        <th>Склад</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lowStockProducts.map((product) => (
                        <tr key={product.id}>
                          <td>{product.name}</td>
                          <td className={getStockStatusClass(product.quantity, product.minQuantity)}>
                            {product.quantity} / {product.minQuantity}
                          </td>
                          <td>{product.storage}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="text-center p-3">
                    <p className="text-success mb-0">Всі товари в достатній кількості</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Таблиця товарів, що закінчуються або прострочені */}
        <div className="mt-4">
          <div className="card">
            <div className="card-header bg-danger text-white">
              <h5 className="mb-0">
                <i className="fas fa-clock me-2"></i>
                Товари, що прострочені або закінчуються протягом тижня
              </h5>
            </div>
            <div className="card-body p-0">
              <div className="expiring-container" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {loadingExpiring ? (
                  <div className="text-center p-3">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Завантаження...</span>
                    </div>
                  </div>
                ) : expiringProducts.length > 0 ? (
                  <table className="table table-hover table-sm mb-0">
                    <thead className="sticky-top bg-light">
                      <tr>
                        <th>Назва товару</th>
                        <th>Термін придатності</th>
                        <th>Статус</th>
                        <th>Кількість</th>
                        <th>Склад</th>
                      </tr>
                    </thead>
                    <tbody>
                      {expiringProducts.map((product) => (
                        <tr key={product.id}>
                          <td>{product.name}</td>
                          <td>{product.formattedExpiryDate}</td>
                          <td className={getExpiryStatusClass(product.isExpired)}>
                            {product.isExpired ? 'Прострочено' : 'Закінчується термін'}
                          </td>
                          <td>{product.quantity}</td>
                          <td>{product.storage}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="text-center p-3">
                    <p className="text-success mb-0">Немає товарів, що закінчуються або прострочені</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;