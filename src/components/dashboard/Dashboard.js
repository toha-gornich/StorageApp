import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
// Змінюємо шлях імпорту відповідно до структури проекту
import { useAuth } from '../../contexts/AuthContext';
// або можливо:
// import { useAuth } from "../../contexts/AuthContext";

export default function Dashboard() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser === null) {
      navigate("/login"); // Або інша сторінка
    }
  }, [currentUser, navigate]);

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
              <h5>Вітаємо, {currentUser.displayName || "Користувач"}!</h5>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}