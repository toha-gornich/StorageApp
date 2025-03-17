import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from '../../contexts/AuthContext';
import { collection, addDoc, getDocs, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../FirebaseConfig';

export default function Dashboard() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('products');
  
  // Стани для різних типів даних
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [storages, setStorages] = useState([]);
  const [storageAreas, setStorageAreas] = useState([]);
  
  // Стани для форм додавання нових даних
  const [newProduct, setNewProduct] = useState({
    name: '',
    barcode: '',
    price: 0,
    weightOrVolume: '',
    expiryDate: '',
    idCategory: '',
    idSupplier: '',
    idStorage: '',
    idStorageArea: '',
    quantity: 0
  });
  
  const [newSupplier, setNewSupplier] = useState({
    name: '',
    phone: '',
    email: '',
    address: ''
  });
  
  const [newCategory, setNewCategory] = useState({
    name: '',
    description: ''
  });
  
  const [newStorage, setNewStorage] = useState({
    name: '',
    address: '',
    capacity: 0,
    description: ''
  });

  const [newStorageArea, setNewStorageArea] = useState({
    name: '',
    description: '',
    storageId: ''
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    if (currentUser === null) {
      navigate("/login");
    } else {
      // Завантаження даних при зміні активної вкладки
      loadTabData(activeTab);
    }
  }, [currentUser, navigate, activeTab]);

  // Функція для завантаження даних відповідно до активної вкладки
  const loadTabData = async (tab) => {
    setLoading(true);
    try {
      switch (tab) {
        case 'products':
          const productsSnapshot = await getDocs(collection(db, 'products'));
          const productsData = productsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setProducts(productsData);
          break;
        case 'suppliers':
          const suppliersSnapshot = await getDocs(collection(db, 'suppliers'));
          const suppliersData = suppliersSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setSuppliers(suppliersData);
          break;
        case 'categories':
          const categoriesSnapshot = await getDocs(collection(db, 'categories'));
          const categoriesData = categoriesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setCategories(categoriesData);
          break;
        case 'storages':
          const storagesSnapshot = await getDocs(collection(db, 'storages'));
          const storagesData = storagesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setStorages(storagesData);
          break;
        case 'storageAreas':
          const areasSnapshot = await getDocs(collection(db, 'storageAreas'));
          const areasData = areasSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setStorageAreas(areasData);
          break;
        default:
          break;
      }
    } catch (error) {
      console.error('Помилка завантаження даних:', error);
      setMessage({ text: `Помилка завантаження даних: ${error.message}`, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Функції для додавання нових записів
  const addProduct = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addDoc(collection(db, 'products'), newProduct);
      setMessage({ text: 'Продукт успішно додано!', type: 'success' });
      setNewProduct({
        name: '',
        barcode: '',
        price: 0,
        weightOrVolume: '',
        expiryDate: '',
        idCategory: '',
        idSupplier: '',
        idStorage: '',
        idStorageArea: '',
        quantity: 0
      });
      loadTabData('products');
    } catch (error) {
      console.error('Помилка додавання продукту:', error);
      setMessage({ text: `Помилка додавання продукту: ${error.message}`, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const addSupplier = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addDoc(collection(db, 'suppliers'), newSupplier);
      setMessage({ text: 'Постачальника успішно додано!', type: 'success' });
      setNewSupplier({
        name: '',
        phone: '',
        email: '',
        address: ''
      });
      loadTabData('suppliers');
    } catch (error) {
      console.error('Помилка додавання постачальника:', error);
      setMessage({ text: `Помилка додавання постачальника: ${error.message}`, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const addCategory = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addDoc(collection(db, 'categories'), newCategory);
      setMessage({ text: 'Категорію успішно додано!', type: 'success' });
      setNewCategory({
        name: '',
        description: ''
      });
      loadTabData('categories');
    } catch (error) {
      console.error('Помилка додавання категорії:', error);
      setMessage({ text: `Помилка додавання категорії: ${error.message}`, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const addStorage = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addDoc(collection(db, 'storages'), newStorage);
      setMessage({ text: 'Склад успішно додано!', type: 'success' });
      setNewStorage({
        name: '',
        address: '',
        capacity: 0,
        description: ''
      });
      loadTabData('storages');
    } catch (error) {
      console.error('Помилка додавання складу:', error);
      setMessage({ text: `Помилка додавання складу: ${error.message}`, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const addStorageArea = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addDoc(collection(db, 'storageAreas'), newStorageArea);
      setMessage({ text: 'Місце на складі успішно додано!', type: 'success' });
      setNewStorageArea({
        name: '',
        description: '',
        storageId: ''
      });
      loadTabData('storageAreas');
    } catch (error) {
      console.error('Помилка додавання місця на складі:', error);
      setMessage({ text: `Помилка додавання місця на складі: ${error.message}`, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Функція для видалення записів
  const deleteItem = async (collection, id) => {
    if (window.confirm('Ви впевнені, що хочете видалити цей запис?')) {
      setLoading(true);
      try {
        await deleteDoc(doc(db, collection, id));
        setMessage({ text: 'Запис успішно видалено!', type: 'success' });
        loadTabData(activeTab);
      } catch (error) {
        console.error('Помилка видалення запису:', error);
        setMessage({ text: `Помилка видалення запису: ${error.message}`, type: 'error' });
      } finally {
        setLoading(false);
      }
    }
  };

  if (!currentUser) return <p>Завантаження...</p>;
  return (
    <div className="container mt-4">
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h4>Панель керування</h4>
              <button className="btn btn-outline-danger" onClick={logout}>
                Вийти
              </button>
            </div>
            <div className="card-body">
              <h5 className="mb-4">Вітаємо, {currentUser.displayName || "Користувач"}!</h5>
              
              {/* Повідомлення про статус */}
              {message.text && (
                <div className={`alert alert-${message.type === 'error' ? 'danger' : message.type}`}>
                  {message.text}
                </div>
              )}
              
              {/* Вкладки навігації */}
              <ul className="nav nav-tabs mb-4">
                <li className="nav-item">
                  <button 
                    className={`nav-link ${activeTab === 'products' ? 'active' : ''}`}
                    onClick={() => setActiveTab('products')}
                  >
                    Товари
                  </button>
                </li>
                <li className="nav-item">
                  <button 
                    className={`nav-link ${activeTab === 'suppliers' ? 'active' : ''}`}
                    onClick={() => setActiveTab('suppliers')}
                  >
                    Постачальники
                  </button>
                </li>
                <li className="nav-item">
                  <button 
                    className={`nav-link ${activeTab === 'categories' ? 'active' : ''}`}
                    onClick={() => setActiveTab('categories')}
                  >
                    Категорії
                  </button>
                </li>
                <li className="nav-item">
                  <button 
                    className={`nav-link ${activeTab === 'storages' ? 'active' : ''}`}
                    onClick={() => setActiveTab('storages')}
                  >
                    Склади
                  </button>
                </li>
                <li className="nav-item">
                  <button 
                    className={`nav-link ${activeTab === 'storageAreas' ? 'active' : ''}`}
                    onClick={() => setActiveTab('storageAreas')}
                  >
                    Місця на складах
                  </button>
                </li>
              </ul>

              {/* Вміст вкладок */}
              <div className="tab-content">
                {/* Вкладка товарів */}
                {activeTab === 'products' && (
                  <div>
                    <h5>Управління товарами</h5>
                    <button 
                      className="btn btn-primary mb-3"
                      data-bs-toggle="modal"
                      data-bs-target="#addProductModal"
                    >
                      Додати новий товар
                    </button>
                    
                    {/* Таблиця товарів */}
                    <div className="table-responsive">
                      <table className="table table-striped table-hover">
                        <thead>
                          <tr>
                            <th>Назва</th>
                            <th>Штрих-код</th>
                            <th>Ціна</th>
                            <th>Кількість</th>
                            <th>Дії</th>
                          </tr>
                        </thead>
                        <tbody>
                          {products.map(product => (
                            <tr key={product.id}>
                              <td>{product.name}</td>
                              <td>{product.barcode}</td>
                              <td>{product.price} грн</td>
                              <td>{product.quantity}</td>
                              <td>
                                <button 
                                  className="btn btn-sm btn-info me-2"
                                  onClick={() => {/* функція редагування */}}
                                >
                                  Редагувати
                                </button>
                                <button 
                                  className="btn btn-sm btn-danger"
                                  onClick={() => {/* функція видалення */}}
                                >
                                  Видалити
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Вкладка постачальників */}
                {activeTab === 'suppliers' && (
                  <div>
                    <h5>Управління постачальниками</h5>
                    <button 
                      className="btn btn-primary mb-3"
                      data-bs-toggle="modal"
                      data-bs-target="#addSupplierModal"
                    >
                      Додати нового постачальника
                    </button>
                    
                    {/* Таблиця постачальників */}
                    <div className="table-responsive">
                      <table className="table table-striped table-hover">
                        <thead>
                          <tr>
                            <th>Назва</th>
                            <th>Телефон</th>
                            <th>Email</th>
                            <th>Адреса</th>
                            <th>Дії</th>
                          </tr>
                        </thead>
                        <tbody>
                          {suppliers.map(supplier => (
                            <tr key={supplier.id}>
                              <td>{supplier.name}</td>
                              <td>{supplier.phone}</td>
                              <td>{supplier.email}</td>
                              <td>{supplier.address}</td>
                              <td>
                                <button 
                                  className="btn btn-sm btn-info me-2"
                                  onClick={() => {/* функція редагування */}}
                                >
                                  Редагувати
                                </button>
                                <button 
                                  className="btn btn-sm btn-danger"
                                  onClick={() => {/* функція видалення */}}
                                >
                                  Видалити
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Вкладка категорій */}
                {activeTab === 'categories' && (
                  <div>
                    <h5>Управління категоріями</h5>
                    <button 
                      className="btn btn-primary mb-3"
                      data-bs-toggle="modal"
                      data-bs-target="#addCategoryModal"
                    >
                      Додати нову категорію
                    </button>
                    
                    {/* Таблиця категорій */}
                    <div className="table-responsive">
                      <table className="table table-striped table-hover">
                        <thead>
                          <tr>
                            <th>Назва</th>
                            <th>Опис</th>
                            <th>Дії</th>
                          </tr>
                        </thead>
                        <tbody>
                          {categories.map(category => (
                            <tr key={category.id}>
                              <td>{category.name}</td>
                              <td>{category.description}</td>
                              <td>
                                <button 
                                  className="btn btn-sm btn-info me-2"
                                  onClick={() => {/* функція редагування */}}
                                >
                                  Редагувати
                                </button>
                                <button 
                                  className="btn btn-sm btn-danger"
                                  onClick={() => {/* функція видалення */}}
                                >
                                  Видалити
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Вкладка складів */}
                {activeTab === 'storages' && (
                  <div>
                    <h5>Управління складами</h5>
                    <button 
                      className="btn btn-primary mb-3"
                      data-bs-toggle="modal"
                      data-bs-target="#addStorageModal"
                    >
                      Додати новий склад
                    </button>
                    
                    {/* Таблиця складів */}
                    <div className="table-responsive">
                      <table className="table table-striped table-hover">
                        <thead>
                          <tr>
                            <th>Назва</th>
                            <th>Адреса</th>
                            <th>Місткість</th>
                            <th>Опис</th>
                            <th>Дії</th>
                          </tr>
                        </thead>
                        <tbody>
                          {storages.map(storage => (
                            <tr key={storage.id}>
                              <td>{storage.name}</td>
                              <td>{storage.address}</td>
                              <td>{storage.capacity}</td>
                              <td>{storage.description}</td>
                              <td>
                                <button 
                                  className="btn btn-sm btn-info me-2"
                                  onClick={() => {/* функція редагування */}}
                                >
                                  Редагувати
                                </button>
                                <button 
                                  className="btn btn-sm btn-danger"
                                  onClick={() => {/* функція видалення */}}
                                >
                                  Видалити
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Вкладка місць на складах */}
                {activeTab === 'storageAreas' && (
                  <div>
                    <h5>Управління місцями на складах</h5>
                    <button 
                      className="btn btn-primary mb-3"
                      data-bs-toggle="modal"
                      data-bs-target="#addStorageAreaModal"
                    >
                      Додати нове місце на складі
                    </button>
                    
                    {/* Таблиця місць на складах */}
                    <div className="table-responsive">
                      <table className="table table-striped table-hover">
                        <thead>
                          <tr>
                            <th>Назва</th>
                            <th>Опис</th>
                            <th>Склад</th>
                            <th>Дії</th>
                          </tr>
                        </thead>
                        <tbody>
                          {storageAreas.map(area => (
                            <tr key={area.id}>
                              <td>{area.name}</td>
                              <td>{area.description}</td>
                              <td>{storages.find(s => s.id === area.storageId)?.name || 'Невідомий склад'}</td>
                              <td>
                                <button 
                                  className="btn btn-sm btn-info me-2"
                                  onClick={() => {/* функція редагування */}}
                                >
                                  Редагувати
                                </button>
                                <button 
                                  className="btn btn-sm btn-danger"
                                  onClick={() => {/* функція видалення */}}
                                >
                                  Видалити
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
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