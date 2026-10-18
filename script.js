const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbw1aqZPW7gYEjBxP8YvGH7vTj86Bv6GldcS9j1XWRohgLqm7mUFGk4jFAKs4AC1UdgA/exec';

const BACKGROUNDS = [
  'https://s.fotora.ru/b5e95ad3cace21f3.png',
  'https://s.fotora.ru/d01e6c8e69c1fa8f.png',
  'https://s.fotora.ru/fe44f547ce696bcb.png',
  'https://s.fotora.ru/73ae2bc2c0f34f31.png',
  'https://s.fotora.ru/ede48500377905b2.png'
];

let allSheetsData = [];
let currentPage = 0;

// 1. Инициализация фона и меню настроек
function initSettings() {
  const settingsBtn = document.getElementById('settings-btn');
  const settingsMenu = document.getElementById('settings-menu');
  const bgBtns = document.querySelectorAll('.bg-btn');

  // По умолчанию ставим Фон 5 (индекс 4)
  let savedBg = localStorage.getItem('selectedBg');
  if (savedBg === null) {
    savedBg = 4; 
  } else {
    savedBg = parseInt(savedBg);
  }
  
  applyBackground(savedBg);

  settingsBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    settingsMenu.classList.toggle('hidden');
  });

  document.addEventListener('click', (e) => {
    if (!settingsMenu.classList.contains('hidden') && !settingsMenu.contains(e.target) && e.target !== settingsBtn) {
      settingsMenu.classList.add('hidden');
    }
  });

  bgBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const index = parseInt(btn.getAttribute('data-bg'));
      applyBackground(index);
      localStorage.setItem('selectedBg', index);
      settingsMenu.classList.add('hidden');
    });
  });
}

function applyBackground(index) {
  if (index >= 0 && index < BACKGROUNDS.length) {
    document.body.style.backgroundImage = `url('${BACKGROUNDS[index]}')`;
  }
}

// 2. Загрузка данных
async function loadData() {
  const contentArea = document.getElementById('content-area');
  
  try {
    const response = await fetch(SCRIPT_URL, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });
    
    if (!response.ok) throw new Error('Сетевая ошибка');
    allSheetsData = await response.json();
    
    if (allSheetsData.length > 0 && allSheetsData[0].name === 'Ошибка') {
      contentArea.innerHTML = '<div style="padding: 40px; text-align: center;">Ошибка в скрипте: ' + escapeHtml(allSheetsData[0].data[0][1]) + '</div>';
      document.getElementById('page-title').textContent = 'Ошибка';
      document.getElementById('table-container').classList.add('loaded');
      return;
    }

    document.getElementById('table-container').classList.add('loaded');
    renderPage();
    
  } catch (error) {
    contentArea.innerHTML = '<div style="padding: 40px; text-align: center;">Ошибка загрузки данных.</div>';
    document.getElementById('table-container').classList.add('loaded');
  }
}

// 3. Отрисовка страницы
function renderPage() {
  const contentArea = document.getElementById('content-area');
  const pageTitle = document.getElementById('page-title');
  const btnPrev = document.getElementById('btn-prev');
  const btnNext = document.getElementById('btn-next');
  const pageIndicator = document.getElementById('page-indicator');

  if (allSheetsData.length === 0) {
    contentArea.innerHTML = '<div style="padding: 40px; text-align: center;">Нет данных</div>';
    return;
  }

  const currentSheet = allSheetsData[currentPage];
  pageTitle.textContent = currentSheet.name;

  const data = currentSheet.data;
  
  if (!data || data.length === 0) {
    contentArea.innerHTML = '<div style="padding: 40px; text-align: center;">На этом листе нет данных</div>';
  } else {
    let maxCols = 0;
    for (let i = 0; i < data.length; i++) {
      if (Array.isArray(data[i]) && data[i].length > maxCols) {
        maxCols = data[i].length;
      }
    }

    let html = '<div class="table-wrapper"><table>';
    const headerRow = Array.isArray(data[0]) ? data[0] : [];
    
    html += '<thead><tr>';
    for (let i = 0; i < maxCols; i++) {
      const value = headerRow[i] !== undefined ? headerRow[i] : '';
      html += '<th>' + escapeHtml(value) + '</th>';
    }
    html += '</tr></thead>';

    html += '<tbody>';
    for (let r = 1; r < data.length; r++) {
      html += '<tr>';
      for (let c = 0; c < maxCols; c++) {
        const value = data[r] && data[r][c] !== undefined ? data[r][c] : '';
        html += '<td>' + escapeHtml(value) + '</td>';
      }
      html += '</tr>';
    }
    html += '</tbody></table></div>';

    contentArea.innerHTML = html;
  }

  btnPrev.disabled = currentPage === 0;
  btnNext.disabled = currentPage === allSheetsData.length - 1;
  pageIndicator.textContent = (currentPage + 1) + ' / ' + allSheetsData.length;
}

// 4. Обработчики кнопок
document.getElementById('btn-prev').addEventListener('click', () => {
  if (currentPage > 0) {
    currentPage--;
    renderPage();
  }
});

document.getElementById('btn-next').addEventListener('click', () => {
  if (currentPage < allSheetsData.length - 1) {
    currentPage++;
    renderPage();
  }
});

function escapeHtml(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// 5. Запуск при загрузке
document.addEventListener('DOMContentLoaded', () => {
  initSettings();
  loadData();
});
