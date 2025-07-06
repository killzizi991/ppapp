// Инициализация приложения
document.addEventListener('DOMContentLoaded', () => {
  // Регистрация сервис-воркера
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js')
      .then(reg => console.log('Service Worker зарегистрирован'))
      .catch(err => console.error('Ошибка регистрации SW:', err));
  }

  // Обработка установки PWA
  let deferredPrompt;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    const installBtn = document.getElementById('installBtn');
    if (installBtn) {
      installBtn.style.display = 'block';
      installBtn.addEventListener('click', async () => {
        if (deferredPrompt) {
          deferredPrompt.prompt();
          const { outcome } = await deferredPrompt.userChoice;
          if (outcome === 'accepted') {
            console.log('PWA установлено');
          }
          deferredPrompt = null;
          installBtn.style.display = 'none';
        }
      });
    }
  });
});
