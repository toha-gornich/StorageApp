import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import logo from "../../images/logo.svg";

export default function Header() {
  const { currentUser } = useAuth();

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
              <li className="nav-item">
                <Link className="nav-link" to="/dashboard">Панель керування</Link>
              </li>
            ) : (
              <>
                <li className="nav-item">
                  <Link className="nav-link" to="/login">Вхід</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/register">Реєстрація</Link>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}
