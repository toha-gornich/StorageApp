import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from '../../contexts/AuthContext';
import { collection, addDoc, getDocs, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../FirebaseConfig';
import bootstrap from 'bootstrap/dist/js/bootstrap.bundle.min.js';

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
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingStorage, setEditingStorage] = useState(null);
  const [editingStorageArea, setEditingStorageArea] = useState(null);
  const editProduct = (product) => {
    setEditingProduct(product);

    // Set form fields with product data
    setTimeout(() => {
      document.getElementById('productId').value = product.id;
      document.getElementById('editProductName').value = product.name;
      document.getElementById('editProductBarcode').value = product.barcode || '';
      document.getElementById('editProductPrice').value = product.price;
      document.getElementById('editProductQuantity').value = product.quantity;
      document.getElementById('editProductWeightOrVolume').value = product.weightOrVolume || '';
      document.getElementById('editProductExpiryDate').value = product.expiryDate || '';

      if (document.getElementById('editProductCategory')) {
        document.getElementById('editProductCategory').value = product.idCategory || '';
      }
      if (document.getElementById('editProductSupplier')) {
        document.getElementById('editProductSupplier').value = product.idSupplier || '';
      }
      if (document.getElementById('editProductStorage')) {
        document.getElementById('editProductStorage').value = product.idStorage || '';
      }
      if (document.getElementById('editProductStorageArea')) {
        document.getElementById('editProductStorageArea').value = product.idStorageArea || '';
      }

      // Open modal
      const modal = new bootstrap.Modal(document.getElementById('editProductModal'));
      modal.show();
    }, 100);
  };

  const editSupplier = (supplier) => {
    setEditingSupplier(supplier);

    setTimeout(() => {
      document.getElementById('supplierId').value = supplier.id;
      document.getElementById('editSupplierName').value = supplier.name;
      document.getElementById('editSupplierPhone').value = supplier.phone || '';
      document.getElementById('editSupplierEmail').value = supplier.email || '';
      document.getElementById('editSupplierAddress').value = supplier.address || '';

      const modal = new bootstrap.Modal(document.getElementById('editSupplierModal'));
      modal.show();
    }, 100);
  };

  const editCategory = (category) => {
    setEditingCategory(category);

    setTimeout(() => {
      document.getElementById('categoryId').value = category.id;
      document.getElementById('editCategoryName').value = category.name;
      document.getElementById('editCategoryDescription').value = category.description || '';

      const modal = new bootstrap.Modal(document.getElementById('editCategoryModal'));
      modal.show();
    }, 100);
  };

  const editStorage = (storage) => {
    setEditingStorage(storage);

    setTimeout(() => {
      document.getElementById('storageId').value = storage.id;
      document.getElementById('editStorageName').value = storage.name;
      document.getElementById('editStorageAddress').value = storage.address || '';
      document.getElementById('editStorageCapacity').value = storage.capacity || '';
      document.getElementById('editStorageDescription').value = storage.description || '';

      const modal = new bootstrap.Modal(document.getElementById('editStorageModal'));
      modal.show();
    }, 100);
  };

  const editStorageArea = (area) => {
    setEditingStorageArea(area);

    setTimeout(() => {
      document.getElementById('storageAreaId').value = area.id;
      document.getElementById('editAreaName').value = area.name;
      document.getElementById('editAreaDescription').value = area.description || '';
      document.getElementById('editAreaStorage').value = area.storageId || '';

      const modal = new bootstrap.Modal(document.getElementById('editStorageAreaModal'));
      modal.show();
    }, 100);
  };

  // Update functions to save changes
  const updateProduct = async (e) => {
    e.preventDefault();
    setLoading(true);

    const productId = document.getElementById('productId').value;
    const updatedProduct = {
      name: document.getElementById('editProductName').value,
      barcode: document.getElementById('editProductBarcode').value,
      price: parseFloat(document.getElementById('editProductPrice').value),
      quantity: parseInt(document.getElementById('editProductQuantity').value),
      weightOrVolume: document.getElementById('editProductWeightOrVolume').value,
      expiryDate: document.getElementById('editProductExpiryDate').value,
      idCategory: document.getElementById('editProductCategory').value,
      idSupplier: document.getElementById('editProductSupplier').value,
      idStorage: document.getElementById('editProductStorage').value,
      idStorageArea: document.getElementById('editProductStorageArea').value
    };

    try {
      await updateDoc(doc(db, 'products', productId), updatedProduct);
      setMessage({ text: 'Продукт успішно оновлено!', type: 'success' });

      // Close modal and reload data
      const modal = bootstrap.Modal.getInstance(document.getElementById('editProductModal'));
      modal.hide();
      loadTabData('products');
    } catch (error) {
      console.error('Помилка оновлення продукту:', error);
      setMessage({ text: `Помилка оновлення продукту: ${error.message}`, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const updateProductStorageSelection = (storageId) => {
    // Filter storage areas based on the selected storage
    const filteredAreas = storageAreas.filter(area => area.storageId === storageId);

    // Clear and populate the storage area dropdown
    const storageAreaSelect = document.getElementById('editProductStorageArea');
    storageAreaSelect.innerHTML = '<option value="">Виберіть місце на складі</option>';

    filteredAreas.forEach(area => {
      const option = document.createElement('option');
      option.value = area.id;
      option.textContent = area.name;
      storageAreaSelect.appendChild(option);
    });
  };

  const updateSupplier = async (e) => {
    e.preventDefault();
    setLoading(true);

    const supplierId = document.getElementById('supplierId').value;
    const updatedSupplier = {
      name: document.getElementById('editSupplierName').value,
      phone: document.getElementById('editSupplierPhone').value,
      email: document.getElementById('editSupplierEmail').value,
      address: document.getElementById('editSupplierAddress').value
    };

    try {
      await updateDoc(doc(db, 'suppliers', supplierId), updatedSupplier);
      setMessage({ text: 'Постачальника успішно оновлено!', type: 'success' });

      const modal = bootstrap.Modal.getInstance(document.getElementById('editSupplierModal'));
      modal.hide();
      loadTabData('suppliers');
    } catch (error) {
      console.error('Помилка оновлення постачальника:', error);
      setMessage({ text: `Помилка оновлення постачальника: ${error.message}`, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const updateCategory = async (e) => {
    e.preventDefault();
    setLoading(true);

    const categoryId = document.getElementById('categoryId').value;
    const updatedCategory = {
      name: document.getElementById('editCategoryName').value,
      description: document.getElementById('editCategoryDescription').value
    };

    try {
      await updateDoc(doc(db, 'categories', categoryId), updatedCategory);
      setMessage({ text: 'Категорію успішно оновлено!', type: 'success' });

      const modal = bootstrap.Modal.getInstance(document.getElementById('editCategoryModal'));
      modal.hide();
      loadTabData('categories');
    } catch (error) {
      console.error('Помилка оновлення категорії:', error);
      setMessage({ text: `Помилка оновлення категорії: ${error.message}`, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const updateStorage = async (e) => {
    e.preventDefault();
    setLoading(true);

    const storageId = document.getElementById('storageId').value;
    const updatedStorage = {
      name: document.getElementById('editStorageName').value,
      address: document.getElementById('editStorageAddress').value,
      capacity: parseFloat(document.getElementById('editStorageCapacity').value) || 0,
      description: document.getElementById('editStorageDescription').value
    };

    try {
      await updateDoc(doc(db, 'storages', storageId), updatedStorage);
      setMessage({ text: 'Склад успішно оновлено!', type: 'success' });

      const modal = bootstrap.Modal.getInstance(document.getElementById('editStorageModal'));
      modal.hide();
      loadTabData('storages');
    } catch (error) {
      console.error('Помилка оновлення складу:', error);
      setMessage({ text: `Помилка оновлення складу: ${error.message}`, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const updateStorageArea = async (e) => {
    e.preventDefault();
    setLoading(true);

    const areaId = document.getElementById('storageAreaId').value;
    const updatedArea = {
      name: document.getElementById('editAreaName').value,
      description: document.getElementById('editAreaDescription').value,
      storageId: document.getElementById('editAreaStorage').value
    };

    try {
      await updateDoc(doc(db, 'storageAreas', areaId), updatedArea);
      setMessage({ text: 'Місце на складі успішно оновлено!', type: 'success' });

      const modal = bootstrap.Modal.getInstance(document.getElementById('editStorageAreaModal'));
      modal.hide();
      loadTabData('storageAreas');
    } catch (error) {
      console.error('Помилка оновлення місця на складі:', error);
      setMessage({ text: `Помилка оновлення місця на складі: ${error.message}`, type: 'error' });
    } finally {
      setLoading(false);
    }
  };
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
                                  onClick={() => editProduct(product)}
                                >
                                  Редагувати
                                </button>
                                <button
                                  className="btn btn-sm btn-danger"
                                  onClick={() => deleteItem('products', product.id)}
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
                                  onClick={() => editSupplier(supplier)}
                                >
                                  Редагувати
                                </button>
                                <button
                                  className="btn btn-sm btn-danger"
                                  onClick={() => deleteItem('suppliers', supplier.id)}
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
                                  onClick={() => editCategory(category)}
                                >
                                  Редагувати
                                </button>
                                <button
                                  className="btn btn-sm btn-danger"
                                  onClick={() => deleteItem('categories', category.id)}
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
                                  onClick={() => editStorage(storage)}
                                >
                                  Редагувати
                                </button>
                                <button
                                  className="btn btn-sm btn-danger"
                                  onClick={() => deleteItem('storages', storage.id)}
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
                                  onClick={() => editStorageArea(area)}
                                >
                                  Редагувати
                                </button>
                                <button
                                  className="btn btn-sm btn-danger"
                                  onClick={() => deleteItem('storageAreas', area.id)}
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

      {/* Модальне вікно для додавання продукту */}
      <div className="modal fade" id="addProductModal" tabIndex="-1" aria-labelledby="addProductModalLabel" aria-hidden="true">
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="addProductModalLabel">Додати новий товар</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div className="modal-body">
              <form onSubmit={addProduct}>
                <div className="mb-3">
                  <label htmlFor="productName" className="form-label">Назва товару</label>
                  <input
                    type="text"
                    className="form-control"
                    id="productName"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="productBarcode" className="form-label">Штрих-код</label>
                  <input
                    type="text"
                    className="form-control"
                    id="productBarcode"
                    value={newProduct.barcode}
                    onChange={(e) => setNewProduct({ ...newProduct, barcode: e.target.value })}
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="productPrice" className="form-label">Ціна</label>
                  <input
                    type="number"
                    className="form-control"
                    id="productPrice"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({ ...newProduct, price: parseFloat(e.target.value) })}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="productQuantity" className="form-label">Кількість</label>
                  <input
                    type="number"
                    className="form-control"
                    id="productQuantity"
                    value={newProduct.quantity}
                    onChange={(e) => setNewProduct({ ...newProduct, quantity: parseInt(e.target.value) })}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="productWeightOrVolume" className="form-label">Вага/Об'єм</label>
                  <input
                    type="text"
                    className="form-control"
                    id="productWeightOrVolume"
                    value={newProduct.weightOrVolume}
                    onChange={(e) => setNewProduct({ ...newProduct, weightOrVolume: e.target.value })}
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="productExpiryDate" className="form-label">Термін придатності</label>
                  <input
                    type="date"
                    className="form-control"
                    id="productExpiryDate"
                    value={newProduct.expiryDate}
                    onChange={(e) => setNewProduct({ ...newProduct, expiryDate: e.target.value })}
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="productCategory" className="form-label">Категорія</label>
                  <select
                    className="form-select"
                    id="productCategory"
                    value={newProduct.idCategory}
                    onChange={(e) => setNewProduct({ ...newProduct, idCategory: e.target.value })}
                  >
                    <option value="">Виберіть категорію</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </select>
                </div>
                <div className="mb-3">
                  <label htmlFor="productSupplier" className="form-label">Постачальник</label>
                  <select
                    className="form-select"
                    id="productSupplier"
                    value={newProduct.idSupplier}
                    onChange={(e) => setNewProduct({ ...newProduct, idSupplier: e.target.value })}
                  >
                    <option value="">Виберіть постачальника</option>
                    {suppliers.map(supplier => (
                      <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                    ))}
                  </select>
                </div>
                <div className="mb-3">
                  <label htmlFor="productStorage" className="form-label">Склад</label>
                  <select
                    className="form-select"
                    id="productStorage"
                    value={newProduct.idStorage}
                    onChange={(e) => setNewProduct({ ...newProduct, idStorage: e.target.value })}
                  >
                    <option value="">Виберіть склад</option>
                    {storages.map(storage => (
                      <option key={storage.id} value={storage.id}>{storage.name}</option>
                    ))}
                  </select>
                </div>
                <div className="mb-3">
                  <label htmlFor="productStorageArea" className="form-label">Місце на складі</label>
                  <select
                    className="form-select"
                    id="productStorageArea"
                    value={newProduct.idStorageArea}
                    onChange={(e) => setNewProduct({ ...newProduct, idStorageArea: e.target.value })}
                    disabled={!newProduct.idStorage}
                  >
                    <option value="">Виберіть місце на складі</option>
                    {storageAreas
                      .filter(area => area.storageId === newProduct.idStorage)
                      .map(area => (
                        <option key={area.id} value={area.id}>{area.name}</option>
                      ))
                    }
                  </select>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Скасувати</button>
                  <button type="submit" className="btn btn-primary">Зберегти</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Модальне вікно для додавання постачальника */}
      <div className="modal fade" id="addSupplierModal" tabIndex="-1" aria-labelledby="addSupplierModalLabel" aria-hidden="true">
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="addSupplierModalLabel">Додати нового постачальника</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div className="modal-body">
              <form onSubmit={addSupplier}>
                <div className="mb-3">
                  <label htmlFor="supplierName" className="form-label">Назва постачальника</label>
                  <input
                    type="text"
                    className="form-control"
                    id="supplierName"
                    value={newSupplier.name}
                    onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="supplierPhone" className="form-label">Телефон</label>
                  <input
                    type="tel"
                    className="form-control"
                    id="supplierPhone"
                    value={newSupplier.phone}
                    onChange={(e) => setNewSupplier({ ...newSupplier, phone: e.target.value })}
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="supplierEmail" className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-control"
                    id="supplierEmail"
                    value={newSupplier.email}
                    onChange={(e) => setNewSupplier({ ...newSupplier, email: e.target.value })}
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="supplierAddress" className="form-label">Адреса</label>
                  <textarea
                    className="form-control"
                    id="supplierAddress"
                    value={newSupplier.address}
                    onChange={(e) => setNewSupplier({ ...newSupplier, address: e.target.value })}
                  ></textarea>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Скасувати</button>
                  <button type="submit" className="btn btn-primary">Зберегти</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Модальне вікно для додавання категорії */}
      <div className="modal fade" id="addCategoryModal" tabIndex="-1" aria-labelledby="addCategoryModalLabel" aria-hidden="true">
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="addCategoryModalLabel">Додати нову категорію</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div className="modal-body">
              <form onSubmit={addCategory}>
                <div className="mb-3">
                  <label htmlFor="categoryName" className="form-label">Назва категорії</label>
                  <input
                    type="text"
                    className="form-control"
                    id="categoryName"
                    value={newCategory.name}
                    onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="categoryDescription" className="form-label">Опис</label>
                  <textarea
                    className="form-control"
                    id="categoryDescription"
                    value={newCategory.description}
                    onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                  ></textarea>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Скасувати</button>
                  <button type="submit" className="btn btn-primary">Зберегти</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Модальне вікно для додавання складу */}
      <div className="modal fade" id="addStorageModal" tabIndex="-1" aria-labelledby="addStorageModalLabel" aria-hidden="true">
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="addStorageModalLabel">Додати новий склад</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div className="modal-body">
              <form onSubmit={addStorage}>
                <div className="mb-3">
                  <label htmlFor="storageName" className="form-label">Назва складу</label>
                  <input
                    type="text"
                    className="form-control"
                    id="storageName"
                    value={newStorage.name}
                    onChange={(e) => setNewStorage({ ...newStorage, name: e.target.value })}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="storageAddress" className="form-label">Адреса</label>
                  <textarea
                    className="form-control"
                    id="storageAddress"
                    value={newStorage.address}
                    onChange={(e) => setNewStorage({ ...newStorage, address: e.target.value })}
                  ></textarea>
                </div>
                <div className="mb-3">
                  <label htmlFor="storageCapacity" className="form-label">Місткість</label>
                  <input
                    type="number"
                    className="form-control"
                    id="storageCapacity"
                    value={newStorage.capacity}
                    onChange={(e) => setNewStorage({ ...newStorage, capacity: parseFloat(e.target.value) })}
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="storageDescription" className="form-label">Опис</label>
                  <textarea
                    className="form-control"
                    id="storageDescription"
                    value={newStorage.description}
                    onChange={(e) => setNewStorage({ ...newStorage, description: e.target.value })}
                  ></textarea>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Скасувати</button>
                  <button type="submit" className="btn btn-primary">Зберегти</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Модальне вікно для додавання місця на складі */}
      <div className="modal fade" id="addStorageAreaModal" tabIndex="-1" aria-labelledby="addStorageAreaModalLabel" aria-hidden="true">
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="addStorageAreaModalLabel">Додати нове місце на складі</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div className="modal-body">
              <form onSubmit={addStorageArea}>
                <div className="mb-3">
                  <label htmlFor="areaName" className="form-label">Назва місця</label>
                  <input
                    type="text"
                    className="form-control"
                    id="areaName"
                    value={newStorageArea.name}
                    onChange={(e) => setNewStorageArea({ ...newStorageArea, name: e.target.value })}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="areaDescription" className="form-label">Опис</label>
                  <textarea
                    className="form-control"
                    id="areaDescription"
                    value={newStorageArea.description}
                    onChange={(e) => setNewStorageArea({ ...newStorageArea, description: e.target.value })}
                  ></textarea>
                </div>
                <div className="mb-3">
                  <label htmlFor="areaStorage" className="form-label">Склад</label>
                  <select
                    className="form-select"
                    id="areaStorage"
                    value={newStorageArea.storageId}
                    onChange={(e) => setNewStorageArea({ ...newStorageArea, storageId: e.target.value })}
                    required
                  >
                    <option value="">Виберіть склад</option>
                    {storages.map(storage => (
                      <option key={storage.id} value={storage.id}>{storage.name}</option>
                    ))}
                  </select>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Скасувати</button>
                  <button type="submit" className="btn btn-primary">Зберегти</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Модальні вікна для редагування */}
      {/* Модальне вікно для редагування товару */}
      <div className="modal fade" id="editProductModal" tabIndex="-1" aria-labelledby="editProductModalLabel" aria-hidden="true">
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="editProductModalLabel">Редагувати товар</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div className="modal-body">
              <form onSubmit={updateProduct}>
                <input type="hidden" id="productId" />
                <div className="mb-3">
                  <label htmlFor="editProductName" className="form-label">Назва товару</label>
                  <input
                    type="text"
                    className="form-control"
                    id="editProductName"
                    required
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="editProductBarcode" className="form-label">Штрих-код</label>
                  <input
                    type="text"
                    className="form-control"
                    id="editProductBarcode"
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="editProductPrice" className="form-label">Ціна</label>
                  <input
                    type="number"
                    className="form-control"
                    id="editProductPrice"
                    required
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="editProductQuantity" className="form-label">Кількість</label>
                  <input
                    type="number"
                    className="form-control"
                    id="editProductQuantity"
                    required
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="editProductWeightOrVolume" className="form-label">Вага/Об'єм</label>
                  <input
                    type="text"
                    className="form-control"
                    id="editProductWeightOrVolume"
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="editProductExpiryDate" className="form-label">Термін придатності</label>
                  <input
                    type="date"
                    className="form-control"
                    id="editProductExpiryDate"
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="editProductCategory" className="form-label">Категорія</label>
                  <select
                    className="form-select"
                    id="editProductCategory"
                  >
                    <option value="">Виберіть категорію</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </select>
                </div>
                <div className="mb-3">
                  <label htmlFor="editProductSupplier" className="form-label">Постачальник</label>
                  <select
                    className="form-select"
                    id="editProductSupplier"
                  >
                    <option value="">Виберіть постачальника</option>
                    {suppliers.map(supplier => (
                      <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                    ))}
                  </select>
                </div>
                <div className="mb-3">
                  <label htmlFor="editProductStorage" className="form-label">Склад</label>
                  <select
                    className="form-select"
                    id="editProductStorage"
                    onChange={(e) => updateProductStorageSelection(e.target.value)}
                  >
                    <option value="">Виберіть склад</option>
                    {storages.map(storage => (
                      <option key={storage.id} value={storage.id}>{storage.name}</option>
                    ))}
                  </select>
                </div>
                <div className="mb-3">
                  <label htmlFor="editProductStorageArea" className="form-label">Місце на складі</label>
                  <select
                    className="form-select"
                    id="editProductStorageArea"
                  >
                    <option value="">Виберіть місце на складі</option>
                    {storageAreas
                      .filter(area => area.storageId === document.getElementById('editProductStorage')?.value)
                      .map(area => (
                        <option key={area.id} value={area.id}>{area.name}</option>
                      ))
                    }
                  </select>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Скасувати</button>
                  <button type="submit" className="btn btn-primary">Зберегти зміни</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Модальне вікно для редагування постачальника */}
      <div className="modal fade" id="editSupplierModal" tabIndex="-1" aria-labelledby="editSupplierModalLabel" aria-hidden="true">
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="editSupplierModalLabel">Редагувати постачальника</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div className="modal-body">
              <form onSubmit={updateSupplier}>
                <input type="hidden" id="supplierId" />
                <div className="mb-3">
                  <label htmlFor="editSupplierName" className="form-label">Назва постачальника</label>
                  <input
                    type="text"
                    className="form-control"
                    id="editSupplierName"
                    required
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="editSupplierPhone" className="form-label">Телефон</label>
                  <input
                    type="tel"
                    className="form-control"
                    id="editSupplierPhone"
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="editSupplierEmail" className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-control"
                    id="editSupplierEmail"
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="editSupplierAddress" className="form-label">Адреса</label>
                  <textarea
                    className="form-control"
                    id="editSupplierAddress"
                  ></textarea>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Скасувати</button>
                  <button type="submit" className="btn btn-primary">Зберегти зміни</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Модальне вікно для редагування категорії */}
      <div className="modal fade" id="editCategoryModal" tabIndex="-1" aria-labelledby="editCategoryModalLabel" aria-hidden="true">
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="editCategoryModalLabel">Редагувати категорію</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div className="modal-body">
              <form onSubmit={updateCategory}>
                <input type="hidden" id="categoryId" />
                <div className="mb-3">
                  <label htmlFor="editCategoryName" className="form-label">Назва категорії</label>
                  <input
                    type="text"
                    className="form-control"
                    id="editCategoryName"
                    required
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="editCategoryDescription" className="form-label">Опис</label>
                  <textarea
                    className="form-control"
                    id="editCategoryDescription"
                  ></textarea>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Скасувати</button>
                  <button type="submit" className="btn btn-primary">Зберегти зміни</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Модальне вікно для редагування складу */}
      <div className="modal fade" id="editStorageModal" tabIndex="-1" aria-labelledby="editStorageModalLabel" aria-hidden="true">
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="editStorageModalLabel">Редагувати склад</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div className="modal-body">
              <form onSubmit={updateStorage}>
                <input type="hidden" id="storageId" />
                <div className="mb-3">
                  <label htmlFor="editStorageName" className="form-label">Назва складу</label>
                  <input
                    type="text"
                    className="form-control"
                    id="editStorageName"
                    required
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="editStorageAddress" className="form-label">Адреса</label>
                  <textarea
                    className="form-control"
                    id="editStorageAddress"
                  ></textarea>
                </div>
                <div className="mb-3">
                  <label htmlFor="editStorageCapacity" className="form-label">Місткість</label>
                  <input
                    type="number"
                    className="form-control"
                    id="editStorageCapacity"
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="editStorageDescription" className="form-label">Опис</label>
                  <textarea
                    className="form-control"
                    id="editStorageDescription"
                  ></textarea>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Скасувати</button>
                  <button type="submit" className="btn btn-primary">Зберегти зміни</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Модальне вікно для редагування місця на складі */}
      <div className="modal fade" id="editStorageAreaModal" tabIndex="-1" aria-labelledby="editStorageAreaModalLabel" aria-hidden="true">
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="editStorageAreaModalLabel">Редагувати місце на складі</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div className="modal-body">
              <form onSubmit={updateStorageArea}>
                <input type="hidden" id="storageAreaId" />
                <div className="mb-3">
                  <label htmlFor="editAreaName" className="form-label">Назва місця</label>
                  <input
                    type="text"
                    className="form-control"
                    id="editAreaName"
                    required
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="editAreaDescription" className="form-label">Опис</label>
                  <textarea
                    className="form-control"
                    id="editAreaDescription"
                  ></textarea>
                </div>
                <div className="mb-3">
                  <label htmlFor="editAreaStorage" className="form-label">Склад</label>
                  <select
                    className="form-select"
                    id="editAreaStorage"
                    required
                  >
                    <option value="">Виберіть склад</option>
                    {storages.map(storage => (
                      <option key={storage.id} value={storage.id}>{storage.name}</option>
                    ))}
                  </select>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Скасувати</button>
                  <button type="submit" className="btn btn-primary">Зберегти зміни</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}