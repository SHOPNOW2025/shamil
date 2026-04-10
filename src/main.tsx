import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  const root = document.getElementById('root');
  if (root) {
    root.innerHTML = `<div style="padding: 40px; color: #1e293b; text-align: center; font-family: sans-serif; direction: rtl; background: white; min-height: 100vh;">
      <h1 style="color: #e11d48;">حدث خطأ في تحميل التطبيق</h1>
      <div style="background: #f1f5f9; padding: 20px; border-radius: 12px; margin: 20px 0; text-align: left; direction: ltr; overflow: auto;">
        <code>${event.error?.stack || event.error?.message || 'خطأ غير معروف في النظام'}</code>
      </div>
      <p style="color: #64748b;">تأكد من إضافة الرابط الحالي إلى Authorized Domains في Firebase.</p>
      <button onclick="window.location.reload()" style="padding: 12px 24px; background: #0f172a; color: white; border: none; border-radius: 12px; cursor: pointer; font-weight: bold; margin-top: 20px;">إعادة تحميل الصفحة</button>
    </div>`;
  }
});

console.log("App starting...");

const rootElement = document.getElementById('root');
if (rootElement) {
  try {
    createRoot(rootElement).render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
  } catch (err) {
    console.error("Render error:", err);
  }
} else {
  console.error("Root element not found!");
}
