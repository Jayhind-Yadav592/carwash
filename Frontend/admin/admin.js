/* ==========================================================================
   ADMIN DASHBOARD OPERATIONS & CRUD HANDLER (API CONNECTED)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  Auth.requireAdmin();

  initAdminNavigation();
  renderAdminMetrics();
  renderBookingsTable();
  renderSlotOccupancyGrid();

  const logoutBtn = document.getElementById('admin-logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      await Auth.logout();
      showToast('Logged out of Admin Portal.', 'info');
      setTimeout(() => window.location.href = '../pages/admin-login.html', 500);
    });
  }
});

function initAdminNavigation() {
  const navItems = document.querySelectorAll('.admin-nav-item');
  const sections = document.querySelectorAll('.admin-section');

  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const targetSec = item.getAttribute('data-section');
      if (!targetSec) return;

      navItems.forEach(i => i.classList.remove('active'));
      item.classList.add('active');

      sections.forEach(sec => {
        if (sec.id === `section-${targetSec}`) {
          sec.style.display = 'block';
        } else {
          sec.style.display = 'none';
        }
      });
    });
  });
}

async function renderAdminMetrics() {
  const metrics = await Store.getDashboardMetrics();

  const elToday = document.getElementById('metric-today');
  const elPending = document.getElementById('metric-pending');
  const elCompleted = document.getElementById('metric-completed');
  const elRevenue = document.getElementById('metric-revenue');

  if (metrics) {
    if (elToday) elToday.textContent = metrics.total_bookings || 0;
    if (elPending) elPending.textContent = metrics.pending_bookings || 0;
    if (elCompleted) elCompleted.textContent = metrics.completed_bookings || 0;
    if (elRevenue) elRevenue.textContent = `₹${(metrics.completed_bookings || 0) * 500}`;
  } else {
    const bookings = await Store.getBookings();
    if (elToday) elToday.textContent = bookings.length;
    if (elPending) elPending.textContent = bookings.filter(b => b.status === 'Pending').length;
    if (elCompleted) elCompleted.textContent = bookings.filter(b => b.status === 'Completed').length;
    if (elRevenue) elRevenue.textContent = `₹${bookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0)}`;
  }
}

async function renderBookingsTable() {
  const tbody = document.getElementById('admin-bookings-tbody');
  if (!tbody) return;

  const bookings = await Store.getBookings();

  if (!bookings.length) {
    tbody.innerHTML = `<tr><td colspan="8" class="text-center" style="padding: 2rem;">No doorstep bookings found.</td></tr>`;
    return;
  }

  const STATUS_OPTIONS = [
    'Pending',
    'Confirmed',
    'In Progress',
    'Completed',
    'Cancelled'
  ];

  tbody.innerHTML = bookings.map(b => {
    const opts = STATUS_OPTIONS.map(st => 
      `<option value="${st}" ${b.status === st ? 'selected' : ''}>${st}</option>`
    ).join('');

    return `
      <tr>
        <td><strong>#${b.id}</strong></td>
        <td>
          <strong style="display: block;">${b.customerName}</strong>
          <span style="font-size: 0.8rem; color: var(--text-muted);">${b.email || b.phone}</span>
        </td>
        <td>${b.serviceName}</td>
        <td>${b.date}<br><span style="font-size: 0.8rem; color: var(--accent-yellow);">${b.slotTime}</span></td>
        <td>${b.vehicleType} (${b.vehicleNo})</td>
        <td>
          <strong style="color: var(--status-green);">₹${b.totalPrice}</strong>
        </td>
        <td>
          <select class="status-select" onchange="handleStatusChange('${b.id}', this.value)" style="padding: 0.3rem; border-radius: 4px; border: 1px solid var(--border-color);">
            ${opts}
          </select>
        </td>
        <td>
          <button class="btn btn-secondary btn-sm" onclick="handleDeleteBooking('${b.id}')" title="Delete Booking" style="color: var(--accent-red);">
            <i class="fa-solid fa-trash"></i>
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

window.handleStatusChange = async function(id, newStatus) {
  const success = await Store.updateBookingStatus(id, newStatus);
  if (success) {
    showToast(`Booking #${id} status updated to ${newStatus}`, 'success');
    await renderAdminMetrics();
    await renderSlotOccupancyGrid();
  } else {
    showToast(`Failed to update booking status. Ensure you are logged in as admin.`, 'error');
  }
};

window.handleDeleteBooking = async function(id) {
  if (confirm(`Are you sure you want to delete booking #${id}?`)) {
    const success = await Store.deleteBooking(id);
    if (success) {
      showToast(`Booking #${id} deleted`, 'info');
      await renderAdminMetrics();
      await renderBookingsTable();
      await renderSlotOccupancyGrid();
    } else {
      showToast(`Failed to delete booking.`, 'error');
    }
  }
};

async function renderSlotOccupancyGrid() {
  const container = document.getElementById('occupancy-grid-container');
  if (!container) return;

  const SLOTS_LIST = [
    '07:30 AM - 09:00 AM',
    '09:00 AM - 10:30 AM',
    '10:30 AM - 12:00 PM',
    '12:00 PM - 01:30 PM',
    '01:30 PM - 03:00 PM',
    '03:00 PM - 04:30 PM',
    '04:30 PM - 06:00 PM',
    '06:00 PM - 07:30 PM'
  ];

  const todayStr = new Date().toISOString().split('T')[0];
  const bookings = (await Store.getBookings()).filter(b => b.date === todayStr && b.status !== 'Cancelled');

  container.innerHTML = SLOTS_LIST.map(slotTime => {
    const slotBookings = bookings.filter(b => b.slotTime === slotTime);
    const count = slotBookings.length;
    const isFull = count >= 2;

    const bay1 = slotBookings[0] ? `<i class="fa-solid fa-car"></i> <span>${slotBookings[0].vehicleNo}</span>` : '<span>Available Van Slot</span>';
    const bay2 = slotBookings[1] ? `<i class="fa-solid fa-car"></i> <span>${slotBookings[1].vehicleNo}</span>` : '<span>Available Van Slot</span>';

    return `
      <div class="occupancy-card" style="background: #FFFFFF; border: 1px solid var(--border-color); padding: 0.85rem; border-radius: var(--radius-md);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
          <h4 style="font-size: 0.9rem; color: var(--primary-dark-slate);">${slotTime}</h4>
          <span class="occupancy-badge ${isFull ? 'badge-red' : 'badge-green'}" style="padding: 0.2rem 0.5rem; border-radius: 99px; font-size: 0.7rem; font-weight: 800;">
            ${count}/2 ${isFull ? 'FULL' : 'OPEN'}
          </span>
        </div>
        <div class="occupancy-cars" style="display: flex; gap: 0.5rem;">
          <div class="car-bay ${slotBookings[0] ? 'occupied' : ''}" style="flex: 1; padding: 0.4rem; background: #F1F5F9; border-radius: 4px; font-size: 0.78rem;">${bay1}</div>
          <div class="car-bay ${slotBookings[1] ? 'occupied' : ''}" style="flex: 1; padding: 0.4rem; background: #F1F5F9; border-radius: 4px; font-size: 0.78rem;">${bay2}</div>
        </div>
      </div>
    `;
  }).join('');
}
