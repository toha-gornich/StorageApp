import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import logo from "../../images/logo.svg";
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import { app } from '../../FirebaseConfig';

export default function Header() {
  const { currentUser, logout } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const db = getFirestore(app);

  useEffect(() => {
    // Перевірка чи користувач є адміністратором
    const checkAdminStatus = async () => {
      if (currentUser) {
        try {
          const q = query(
            collection(db, 'users'),
            where('uid', '==', currentUser.uid)
          );
          
          const querySnapshot = await getDocs(q);
          if (!querySnapshot.empty) {
            const userData = querySnapshot.docs[0].data();
            setIsAdmin(userData.isAdmin === true);
          } else {
            setIsAdmin(false);
          }
        } catch (error) {
          console.error("Помилка при перевірці статусу адміністратора:", error);
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
    };

    checkAdminStatus();
  }, [currentUser, db]);

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
      <div className="container">
        <Link className="navbar-brand" to="/">
          <img src={logo} alt="Логотип" style={{ height: "40px" }} />
        </Link>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto">
            <li className="nav-item">
              <Link className="nav-link" to="/home">Головна</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/inventory">Склад</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/loading">Завантаження</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/unloading">Вивантаження</Link>
            </li>
          </ul>
          <ul className="navbar-nav ms-auto">
            {currentUser ? (
              <>
                {isAdmin && (
                  <li className="nav-item">
                    <Link className="nav-link" to="/dashboard">Панель керування</Link>
                  </li>
                )}
                <li className="nav-item">
                  <button
                    className="nav-link btn btn-link"
                    onClick={logout}
                  >
                    Вийти
                  </button>
                </li>
              </>
            ) : (
              <>
                <li className="nav-item">
                  <Link className="nav-link" to="/login">Вхід</Link>
                </li>
                {/* <li className="nav-item">
                  <Link className="nav-link" to="/register">Реєстрація</Link>
                </li> */}
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}