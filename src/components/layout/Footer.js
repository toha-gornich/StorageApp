import React from 'react';
export default function Footer() {
    return (
      <footer className="bg-dark text-white py-3 mt-auto">
        <div className="container text-center">
          <p className="mb-0">
            © {new Date().getFullYear()} Система обліку складу. Всі права захищено.
          </p>
        </div>
      </footer>
    );
  }