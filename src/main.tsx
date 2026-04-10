import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  const root = document.getElementById('root');
  if (root && root.innerHTML === '') {
    root.innerHTML = `<div style="padding: 20px; color: red; text-align: center;">
      <h1>حدث خطأ في التطبيق</h1>
      <p>${event.error?.message || 'خطأ غير معروف'}</p>
      <button onclick="window.location.reload()" style="padding: 10px 20px; cursor: pointer;">إعادة تحميل الصفحة</button>
    </div>`;
  }
});

console.log("App starting...");

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
