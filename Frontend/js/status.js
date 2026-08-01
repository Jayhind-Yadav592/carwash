/* ==========================================================================
   RUDRA DOORSTEP EXPRESS - LIVE BOOKING STATUS TRACKER SCRIPT (API CONNECTED)
   ========================================================================== */

const STATUS_STEPS = [
  'Pending',
  'Confirmed',
  'In Progress',
  'Completed',
  'Cancelled'
];

document.addEventListener('DOMContentLoaded', () => {
  const searchForm = document.getElementById('status-search-form');
  const searchInput = document.getElementById('status-search-input');
  
  if (searchForm) {
    searchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const query = searchInput.value.trim();
      if (query) {
        lookupBooking(query);
      }
    });
  }

  const urlParams = new URLSearchParams(window.location.search);
  const codeParam = urlParams.get('id') || urlParams.get('code');
  if (codeParam) {
    if (searchInput) searchInput.value = codeParam;
    lookupBooking(codeParam);
  }
});

async function lookupBooking(query) {
  const bookings = await Store.getBookings();
  const found = bookings.find(b => 
    b.id.toString().toLowerCase() === query.toLowerCase() || 
    b.phone.includes(query)
  );

  const displayContainer = document.getElementById('status-display');
  if (!displayContainer) return;

  if (!found) {
    displayContainer.innerHTML = `
      <div class="card-glass text-center" style="padding: 2.5rem 1.25rem;">
        <i class="fa-solid fa-circle-exclamation" style="font-size: 2.5rem; color: var(--accent-red); margin-bottom: 0.85rem;"></i>
        <h3>Doorstep Booking Not Found</h3>
        <p style="color: var(--text-muted); font-size: 0.88rem; margin-top: 0.4rem;">
          No appointment matching <strong>"${query}"</strong> was found. Please check your booking ID or mobile number.
        </p>
      </div>
    `;
    return;
  }

  renderStatusTracker(found, displayContainer);
}

function renderStatusTracker(booking, container) {
  let currentStepIndex = STATUS_STEPS.indexOf(booking.status);
  if (currentStepIndex === -1) currentStepIndex = 0;
  
  let stepsHtml = STATUS_STEPS.map((step, idx) => {
    let stateClass = '';
    if (idx < currentStepIndex || booking.status === 'Completed') {
      stateClass = 'completed';
    } else if (idx === currentStepIndex) {
      stateClass = 'active';
    }

    let icon = '<i class="fa-solid fa-check"></i>';
    if (idx === 0) icon = '<i class="fa-solid fa-hourglass-start"></i>';
    if (idx === 1) icon = '<i class="fa-solid fa-calendar-check"></i>';
    if (idx === 2) icon = '<i class="fa-solid fa-soap"></i>';
    if (idx === 3) icon = '<i class="fa-solid fa-flag-checkered"></i>';
    if (idx === 4) icon = '<i class="fa-solid fa-ban"></i>';

    return `
      <div class="status-step ${stateClass}">
        <div class="step-icon">${icon}</div>
        <div class="step-title">${step}</div>
      </div>
    `;
  }).join('');

  container.innerHTML = `
    <div class="card-glass" style="margin-top: 1.5rem;">
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-color); padding-bottom: 1rem; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 0.85rem;">
        <div>
          <span style="color: var(--accent-yellow); font-weight: 700; font-size: 0.82rem; text-transform: uppercase; letter-spacing: 0.04em;">Live Doorstep Van Tracking</span>
          <h2 style="font-size: 1.5rem; margin-top: 0.15rem; color: var(--primary-dark-slate);">Booking #${booking.id}</h2>
        </div>
        <div style="padding: 0.4rem 1.1rem; border-radius: var(--radius-full); background: var(--accent-yellow-light); color: var(--accent-yellow); font-weight: 700; border: 1px solid rgba(217,119,6,0.3); font-size: 0.82rem;">
          Current Status: ${booking.status}
        </div>
      </div>

      <div class="status-steps">
        ${stepsHtml}
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; background: var(--primary-white); padding: 1.1rem; border-radius: var(--radius-md); border: 1px solid var(--border-color); margin-top: 1.5rem;">
        <div>
          <span style="color: var(--text-muted); font-size: 0.78rem; display: block;">Customer</span>
          <strong style="color: var(--primary-dark-slate); font-size: 0.88rem;">${booking.customerName}</strong>
        </div>
        <div>
          <span style="color: var(--text-muted); font-size: 0.78rem; display: block;">Wash Service</span>
          <strong style="color: var(--primary-dark-slate); font-size: 0.88rem;">${booking.serviceName}</strong>
        </div>
        <div>
          <span style="color: var(--text-muted); font-size: 0.78rem; display: block;">Doorstep Address</span>
          <strong style="color: var(--primary-dark-slate); font-size: 0.88rem;">${booking.address}</strong>
        </div>
        <div>
          <span style="color: var(--text-muted); font-size: 0.78rem; display: block;">Date & Slot</span>
          <strong style="color: var(--accent-yellow); font-size: 0.88rem;">${booking.date} (${booking.slotTime})</strong>
        </div>
        <div>
          <span style="color: var(--text-muted); font-size: 0.78rem; display: block;">Vehicle</span>
          <strong style="color: var(--primary-dark-slate); font-size: 0.88rem;">${booking.vehicleType} - ${booking.vehicleNo}</strong>
        </div>
        <div>
          <span style="color: var(--text-muted); font-size: 0.78rem; display: block;">Price</span>
          <strong style="color: var(--accent-red); font-size: 0.88rem;">₹${booking.totalPrice}</strong>
        </div>
      </div>
    </div>
  `;
}
