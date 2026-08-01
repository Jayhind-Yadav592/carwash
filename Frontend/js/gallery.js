/* ==========================================================================
   GALLERY SHOWCASE & BEFORE/AFTER INTERACTIVE SLIDER (API CONNECTED)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initGalleryFilters();
  initBeforeAfterSlider();
  renderDynamicGallery();
});

async function renderDynamicGallery() {
  const grid = document.querySelector('.gallery-grid');
  if (!grid) return;

  const images = await Store.getGallery();
  if (!images.length) return;

  grid.innerHTML = images.map(img => `
    <div class="gallery-item" data-category="exterior">
      <div class="gallery-card">
        <img src="${img.image}" alt="${img.title || 'Gallery Image'}">
        <div class="gallery-overlay">
          <h4>${img.title || 'Doorstep Car Wash'}</h4>
          <p>${img.description || 'Narasaraopet Service'}</p>
        </div>
      </div>
    </div>
  `).join('');
}

function initGalleryFilters() {
  const filterBtns = document.querySelectorAll('.gallery-filters .filter-btn');
  const items = document.querySelectorAll('.gallery-grid .gallery-item');

  if (!filterBtns.length) return;

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const cat = btn.getAttribute('data-filter');

      document.querySelectorAll('.gallery-grid .gallery-item').forEach(item => {
        if (cat === 'all' || item.getAttribute('data-category') === cat) {
          item.style.display = 'block';
        } else {
          item.style.display = 'none';
        }
      });
    });
  });
}

function initBeforeAfterSlider() {
  const container = document.querySelector('.ba-container');
  if (!container) return;

  const afterImg = container.querySelector('.ba-after');
  const handle = container.querySelector('.ba-handle');
  let isDragging = false;

  function move(e) {
    if (!isDragging) return;
    const rect = container.getBoundingClientRect();
    let x = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
    if (x < 0) x = 0;
    if (x > rect.width) x = rect.width;
    const pct = (x / rect.width) * 100;

    afterImg.style.width = `${pct}%`;
    handle.style.left = `${pct}%`;
  }

  handle.addEventListener('mousedown', () => isDragging = true);
  window.addEventListener('mouseup', () => isDragging = false);
  window.addEventListener('mousemove', move);

  handle.addEventListener('touchstart', () => isDragging = true);
  window.addEventListener('touchend', () => isDragging = false);
  window.addEventListener('touchmove', move);
}
