import React from 'react';

function Home() {
  return (
    <div className="card">
      <div className="card-header">
        <h2>Головна сторінка</h2>
      </div>
      <div className="card-body">
        <h5 className="card-title">Ласкаво просимо до системи управління складом</h5>
        <p className="card-text">
          Ця система дозволяє ефективно керувати складськими операціями:
        </p>
        <ul>
          <li>Перегляд інвентаризації складу</li>
          <li>Управління процесами завантаження</li>
          <li>Управління процесами вивантаження</li>
          <li>Аналітика та звіти</li>
        </ul>
        <p>Виберіть потрібний розділ у навігаційному меню вгорі.</p>
      </div>
    </div>
  );
}

export default Home;