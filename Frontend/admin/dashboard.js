/* ==========================================================================
   RUDRA CAR WASH - ADMIN DASHBOARD ENGINE (FULL DYNAMIC PRODUCTION JS)
   100% Connected Real Live PostgreSQL APIs & Interactive Button Controls
   ========================================================================== */

const STORAGE_KEYS_LOCAL = {
  SESSION: 'rudra_session_v4',
  SESSION_ALT: 'rudra_carwash_session',
  BOOKINGS: 'rudra_bookings_v4'
};

// Instant Client-side Admin Authentication Guard
(function guardAdminDashboard() {
  const token = localStorage.getItem('access_token');
  const userStr = localStorage.getItem(STORAGE_KEYS_LOCAL.SESSION) || localStorage.getItem(STORAGE_KEYS_LOCAL.SESSION_ALT);
  let user = null;
  try {
    user = userStr ? JSON.parse(userStr) : null;
  } catch (e) {
    user = null;
  }

  const isAdmin = token && user && (user.role === 'admin' || user.is_superuser === true || user.is_staff === true);

  if (!isAdmin) {
    console.warn("Direct URL access denied. Admin authentication required.");
    window.location.href = '/pages/admin-login.html';
  }
})();

const API_BASE = window.location.origin.includes('http') && !window.location.origin.includes('file')
  ? '/api/v1'
  : 'http://127.0.0.1:8000/api/v1';

// Dashboard State Store (Zero Hardcoded Data)
const DashboardState = {
  activeTab: 'overview',
  searchQuery: '',
  theme: localStorage.getItem('rudra_theme') || 'light',
  metrics: {
    totalUsers: 0,
    totalServices: 0,
    totalBookings: 0,
    pendingBookings: 0,
    confirmedBookings: 0,
    completedBookings: 0,
    cancelledBookings: 0,
    totalReviews: 0,
    todayRevenue: 0,
    totalRevenue: 0,
    todayBookings: 0,
    upcomingBookings: 0
  },
  bookings: [],
  services: [],
  customers: [],
  employees: [],
  reviews: [],
  unreadNotifCount: 0,
  notificationsList: [],
  knownNotifIds: new Set()
};

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initSearchAndFilter();
  initModals();
  initLogout();
  fetchLiveApiData();
  initLiveNotificationPolling();
});

// Logout Handler
function initLogout() {
  const logoutBtn = document.getElementById('btn-admin-logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      if (window.Auth && window.Auth.logout) {
        await window.Auth.logout();
      } else {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem(STORAGE_KEYS_LOCAL.SESSION);
        localStorage.removeItem(STORAGE_KEYS_LOCAL.SESSION_ALT);
        window.location.href = '/pages/admin-login.html';
      }
    });
  }
}

// Sidebar Navigation Controller
function initNavigation() {
  const links = document.querySelectorAll('.sidebar-link[data-section]');
  links.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetSection = link.getAttribute('data-section');
      switchTab(targetSection);
    });
  });

  const mobileToggle = document.getElementById('mobile-sidebar-toggle');
  const sidebar = document.querySelector('.app-sidebar');
  const backdrop = document.getElementById('sidebar-backdrop');

  function openSidebar() {
    if (sidebar) sidebar.classList.add('mobile-open');
    if (backdrop) backdrop.classList.add('active');
  }

  function closeSidebar() {
    if (sidebar) sidebar.classList.remove('mobile-open');
    if (backdrop) backdrop.classList.remove('active');
  }

  if (mobileToggle && sidebar) {
    mobileToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      if (sidebar.classList.contains('mobile-open')) {
        closeSidebar();
      } else {
        openSidebar();
      }
    });
  }

  if (backdrop) {
    backdrop.addEventListener('click', closeSidebar);
  }

  links.forEach(link => {
    link.addEventListener('click', () => {
      if (window.innerWidth <= 992) {
        closeSidebar();
      }
    });
  });
}

function switchTab(sectionId) {
  DashboardState.activeTab = sectionId;

  document.querySelectorAll('.sidebar-link').forEach(link => {
    link.classList.toggle('active', link.getAttribute('data-section') === sectionId);
  });

  document.querySelectorAll('.tab-section').forEach(sec => {
    sec.style.display = 'none';
  });

  const activeSection = document.getElementById(`section-${sectionId}`);
  if (activeSection) {
    activeSection.style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  if (sectionId === 'notifications') {
    DashboardState.unreadNotifCount = 0;
    updateNotificationBadge();
  }

  renderAllSections();
}

// Live Real-Time Search Input
function initSearchAndFilter() {
  const searchInput = document.querySelector('.search-box input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      DashboardState.searchQuery = e.target.value.trim().toLowerCase();
      renderBookingsTable();
      renderServicesGrid();
      renderCustomersList();
    });
  }
}

// Live DRF API Synchronization
async function fetchLiveApiData() {
  const token = localStorage.getItem('access_token');
  const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

  try {
    // 1. Fetch Dashboard Overview Metrics
    const overviewRes = await fetch(`${API_BASE}/dashboard/`, { headers });
    if (overviewRes.ok) {
      const metricsData = await overviewRes.json();
      DashboardState.metrics = { ...DashboardState.metrics, ...metricsData };
    }

    // 2. Fetch Bookings
    const bookingsRes = await fetch(`${API_BASE}/bookings/`, { headers });
    if (bookingsRes.ok) {
      const bookingsData = await bookingsRes.json();
      const list = Array.isArray(bookingsData) ? bookingsData : (bookingsData.results || []);
      DashboardState.bookings = list.map(b => ({
        raw_id: b.id,
        id: `RCW-${b.id}`,
        customer: b.full_name || (b.user ? (b.user.full_name || b.user.email) : "Customer"),
        phone: b.phone || "N/A",
        vehicle: `${b.vehicle_model || b.vehicle_type || 'Car'} (${b.vehicle_number || ''})`,
        service: b.service ? b.service.name : "Doorstep Wash",
        slot: `${b.booking_date || 'Today'} ${b.booking_time || ''}`,
        amount: b.total_price || (b.service ? b.service.price : 500),
        status: b.status || 'Pending',
        payment_status: b.payment_status || 'PENDING',
        transaction_id: b.transaction_id || `TXN-UPI-${b.id}`
      }));
    } else {
      DashboardState.bookings = [];
    }

    // 3. Fetch Services
    const servicesRes = await fetch(`${API_BASE}/services/`);
    if (servicesRes.ok) {
      const servicesData = await servicesRes.json();
      DashboardState.services = Array.isArray(servicesData) ? servicesData : (servicesData.results || []);
    } else {
      DashboardState.services = [];
    }

    // 4. Fetch Customers & Employees
    const customersRes = await fetch(`${API_BASE}/accounts/users/`, { headers });
    if (customersRes.ok) {
      const customersData = await customersRes.json();
      const cList = Array.isArray(customersData) ? customersData : (customersData.results || []);
      DashboardState.customers = cList.filter(u => u.role !== 'admin').map(u => ({
        id: u.id,
        name: u.full_name || u.email || 'Customer',
        email: u.email || '',
        phone: u.phone || 'N/A',
        vehicle: u.vehicle_model || 'Registered Vehicle',
        bookingsCount: u.bookings_count || 1,
        loyaltyPoints: u.loyalty_points || 50,
        role: u.role || 'customer'
      }));
      DashboardState.employees = cList.filter(u => u.role === 'employee' || u.is_staff).map(u => ({
        id: u.id,
        name: u.full_name || u.email || 'Technician',
        email: u.email || '',
        phone: u.phone || 'N/A',
        role: 'Van Crew Lead'
      }));
    } else {
      DashboardState.customers = [];
      DashboardState.employees = [];
    }

    // 5. Fetch Reviews
    const reviewsRes = await fetch(`${API_BASE}/reviews/`);
    if (reviewsRes.ok) {
      const reviewsData = await reviewsRes.json();
      DashboardState.reviews = Array.isArray(reviewsData) ? reviewsData : (reviewsData.results || []);
    } else {
      DashboardState.reviews = [];
    }

    // 6. Fetch Notifications
    const notifRes = await fetch(`${API_BASE}/bookings/notifications/`, { headers });
    if (notifRes.ok) {
      const notifData = await notifRes.json();
      const nList = Array.isArray(notifData) ? notifData : (notifData.results || []);
      DashboardState.notificationsList = nList.map(n => ({
        id: n.id,
        title: n.title || 'System Alert',
        time: n.created_at ? new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently',
        details: n.message || n.title
      }));
    } else {
      DashboardState.notificationsList = [];
    }

  } catch (err) {
    console.warn("API Sync Warning: Check backend connection.", err);
  }

  renderAllSections();
  hideGlobalLoader();
}

function hideGlobalLoader() {
  const loader = document.getElementById('dashboard-global-loader');
  if (loader) {
    loader.classList.add('hidden');
  }
}

// Live Real-Time Admin Notification Polling
function initLiveNotificationPolling() {
  setInterval(async () => {
    try {
      const token = localStorage.getItem('access_token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      const res = await fetch(`${API_BASE}/bookings/notifications/`, { headers });
      if (res.ok) {
        const notifs = await res.json();
        const list = Array.isArray(notifs) ? notifs : (notifs.results || []);
        list.forEach(n => {
          if (!DashboardState.knownNotifIds.has(n.id)) {
            DashboardState.knownNotifIds.add(n.id);
            DashboardState.unreadNotifCount = (DashboardState.unreadNotifCount || 0) + 1;
            DashboardState.notificationsList.unshift({
              id: n.id,
              title: n.title || 'New System Alert',
              time: 'Just now',
              details: n.message || n.title
            });
            updateNotificationBadge();
            if (n.notification_type === 'BOOKING_PAID' || n.notification_type === 'BOOKING_CREATED') {
              showToast(`🔔 NEW ALERT: ${n.title}`, 'info');
              fetchLiveApiData();
            }
          }
        });
      }
    } catch (e) {
      // Silent catch
    }
  }, 8000);
}

// Master Render Function
function renderAllSections() {
  renderOverviewKPIs();
  renderActivityStream();
  renderVanFleetStatus();
  renderBookingsTable();
  renderServicesGrid();
  renderCustomersList();
  renderEmployeesList();
  renderReviewsList();
  renderNotificationsList();
  updateNotificationBadge();
}

// Notification Badge & List Helper Functions
function updateNotificationBadge() {
  const badge = document.getElementById('topbar-notif-badge');
  if (!badge) return;

  const count = DashboardState.unreadNotifCount || 0;
  if (count > 0) {
    badge.innerText = count > 99 ? '99+' : count;
    badge.style.display = 'inline-block';
  } else {
    badge.style.display = 'none';
  }
}

window.markAllNotificationsRead = function() {
  DashboardState.unreadNotifCount = 0;
  updateNotificationBadge();
  renderNotificationsList();
  showToast('All notifications marked as read', 'info');
};

function renderNotificationsList() {
  const container = document.getElementById('notifications-list-container');
  if (!container) return;

  const notifs = DashboardState.notificationsList || [];
  if (notifs.length === 0) {
    container.innerHTML = `<div style="text-align: center; padding: 2.5rem; color: var(--text-muted); font-size: 0.95rem;"><i class="fa-solid fa-bell-slash" style="font-size: 1.8rem; margin-bottom: 0.5rem; display: block; opacity: 0.5;"></i>No Notifications</div>`;
    return;
  }

  container.innerHTML = notifs.map(n => `
    <div class="card" style="padding: 1rem; margin-bottom: 0.75rem; border-left: 4px solid var(--brand-orange);">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem;">
        <strong style="font-family: var(--font-heading); font-size: 0.95rem; color: var(--text-main);">${n.title}</strong>
        <span style="font-size: 0.75rem; color: var(--text-muted);">${n.time}</span>
      </div>
      <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0;">${n.details}</p>
    </div>
  `).join('');
}

// Render Overview KPI Cards
function renderOverviewKPIs() {
  const m = DashboardState.metrics;
  animateCounter('kpi-revenue', `₹${(m.todayRevenue || m.today_revenue || 0).toLocaleString()}`);
  animateCounter('kpi-today-bookings', m.todayBookings || m.today_bookings || m.totalBookings || 0);
  animateCounter('kpi-pending-bookings', m.pendingBookings || m.pending_bookings || 0);
  animateCounter('kpi-completed-washes', m.completedBookings || m.completed_bookings || 0);
  animateCounter('kpi-active-staff', m.totalUsers || m.total_users || 0);
  animateCounter('kpi-queue-count', m.upcomingBookings || m.upcoming_bookings || 0);

  const totalRevEl = document.getElementById('section-total-revenue');
  if (totalRevEl) {
    totalRevEl.innerText = `₹${(m.totalRevenue || m.total_revenue || 0).toLocaleString()}`;
  }
}

function animateCounter(elementId, finalVal) {
  const el = document.getElementById(elementId);
  if (el) el.innerText = finalVal;
}

// Render Real-Time Activity Stream Widget / Recent Payments
function renderActivityStream() {
  const container = document.getElementById('activity-stream-container');
  if (!container) return;

  const bookings = DashboardState.bookings;
  if (bookings.length === 0) {
    container.innerHTML = `<div style="text-align: center; padding: 1.8rem; color: var(--text-muted); font-size: 0.88rem;"><i class="fa-solid fa-receipt" style="font-size: 1.5rem; margin-bottom: 0.4rem; display: block; opacity: 0.5;"></i>No Activity Available</div>`;
    return;
  }

  container.innerHTML = bookings.slice(0, 4).map(b => {
    const isPaid = (b.payment_status || '').toUpperCase() === 'PAID';
    const borderCol = isPaid ? 'var(--accent-green)' : 'var(--brand-orange)';
    const iconClass = isPaid ? 'fa-circle-check' : 'fa-calendar-check';
    const bgCol = isPaid ? 'var(--accent-green-light)' : 'var(--brand-orange-light)';
    const textCol = isPaid ? 'var(--accent-green)' : 'var(--brand-orange)';

    return `
      <div style="display: flex; align-items: flex-start; gap: 0.75rem; padding: 0.65rem; background: #F8FAFC; border-radius: var(--radius-md); border-left: 3px solid ${borderCol};">
        <div style="width: 32px; height: 32px; border-radius: 50%; background: ${bgCol}; color: ${textCol}; display: flex; align-items: center; justify-content: center; font-size: 0.85rem; flex-shrink: 0;">
          <i class="fa-solid ${iconClass}"></i>
        </div>
        <div>
          <strong style="font-size: 0.82rem; color: var(--text-main);">${b.id} - ${b.customer}</strong>
          <p style="font-size: 0.76rem; color: var(--text-muted); margin-top: 1px;">Booked ${b.service} (${b.vehicle}) - ₹${b.amount}</p>
          <span style="font-size: 0.68rem; color: var(--text-subtle); font-weight: 700;">${b.slot}</span>
        </div>
      </div>
    `;
  }).join('');
}

// Render Mobile Van Fleet Status Widget
function renderVanFleetStatus() {
  const container = document.getElementById('van-fleet-container');
  if (!container) return;

  const services = DashboardState.services;
  if (services.length === 0) {
    container.innerHTML = `<div style="text-align: center; padding: 1.8rem; color: var(--text-muted); font-size: 0.88rem;"><i class="fa-solid fa-van-shuttle" style="font-size: 1.5rem; margin-bottom: 0.4rem; display: block; opacity: 0.5;"></i>No Vehicles Available</div>`;
    return;
  }

  container.innerHTML = services.map((s, idx) => `
    <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.75rem; background: #FFFFFF; border: 1.5px solid var(--border-color); border-radius: var(--radius-md);">
      <div style="display: flex; align-items: center; gap: 0.65rem;">
        <div style="width: 36px; height: 36px; border-radius: 50%; background: var(--accent-green-light); color: var(--accent-green); display: flex; align-items: center; justify-content: center; font-size: 1rem;">
          <i class="fa-solid fa-van-shuttle"></i>
        </div>
        <div>
          <strong style="font-size: 0.85rem; color: var(--text-main); display: block;">Doorstep Express Unit #${idx + 1}</strong>
          <span style="font-size: 0.74rem; color: var(--text-muted);">${s.name || 'Wash Package'} (₹${s.price})</span>
        </div>
      </div>
      <span class="badge badge-completed"><i class="fa-solid fa-location-dot"></i> Active</span>
    </div>
  `).join('');
}

// Manual Payment Action Handlers for Admin
window.approveBookingPayment = async function(rawId) {
  try {
    const token = localStorage.getItem('access_token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}/bookings/${rawId}/approve_payment/`, {
      method: 'POST',
      headers: headers
    });

    if (res.ok) {
      const data = await res.json();
      showToast(data.message || `Payment Approved! Booking #${rawId} is now CONFIRMED.`, 'success');
      await fetchLiveApiData();
    } else {
      const err = await res.json();
      showToast(err.message || 'Failed to approve payment.', 'error');
    }
  } catch (e) {
    showToast('Network error while approving payment.', 'error');
  }
};

window.rejectBookingPayment = async function(rawId) {
  try {
    const token = localStorage.getItem('access_token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}/bookings/${rawId}/reject_payment/`, {
      method: 'POST',
      headers: headers
    });

    if (res.ok) {
      const data = await res.json();
      showToast(data.message || `Payment Rejected for Booking #${rawId}.`, 'warning');
      await fetchLiveApiData();
    } else {
      const err = await res.json();
      showToast(err.message || 'Failed to reject payment.', 'error');
    }
  } catch (e) {
    showToast('Network error while rejecting payment.', 'error');
  }
};

// Delete Booking Action
window.deleteBooking = async function(rawId) {
  if (!confirm(`Are you sure you want to delete Booking #${rawId}?`)) return;

  try {
    const token = localStorage.getItem('access_token');
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}/bookings/${rawId}/`, {
      method: 'DELETE',
      headers: headers
    });

    if (res.status === 204 || res.ok) {
      showToast(`Booking #${rawId} deleted successfully!`, 'success');
      await fetchLiveApiData();
    } else {
      showToast(`Failed to delete booking #${rawId}.`, 'error');
    }
  } catch (e) {
    showToast('Network error deleting booking.', 'error');
  }
};

function renderBookingsTable() {
  const fullTbody = document.getElementById('full-bookings-tbody');
  if (!fullTbody) return;

  const query = DashboardState.searchQuery;
  let filteredBookings = DashboardState.bookings;

  if (query) {
    filteredBookings = filteredBookings.filter(b => 
      b.id.toLowerCase().includes(query) ||
      b.customer.toLowerCase().includes(query) ||
      b.vehicle.toLowerCase().includes(query) ||
      b.phone.toLowerCase().includes(query)
    );
  }

  if (filteredBookings.length === 0) {
    fullTbody.innerHTML = '<tr><td colspan="8" class="text-center p-4 text-muted" style="text-align: center; padding: 2rem;"><i class="fa-solid fa-folder-open mb-2 opacity-50" style="font-size: 1.5rem; display: block;"></i>No Bookings Available</td></tr>';
    return;
  }

  fullTbody.innerHTML = filteredBookings.map(b => {
    const rawId = b.raw_id || b.id.replace('RCW-', '');
    const isPaid = (b.payment_status || '').toUpperCase() === 'PAID';
    const isFailed = (b.payment_status || '').toUpperCase() === 'FAILED';
    
    let payBadge = `<span class="badge badge-pending" style="font-size: 0.7rem;"><i class="fa-solid fa-clock-rotate-left"></i> Pending</span>`;
    if (isPaid) {
      payBadge = `<span class="badge badge-completed" style="font-size: 0.7rem;"><i class="fa-solid fa-circle-check"></i> Paid</span>`;
    } else if (isFailed) {
      payBadge = `<span class="badge badge-cancelled" style="font-size: 0.7rem;"><i class="fa-solid fa-circle-xmark"></i> Rejected</span>`;
    }

    return `
      <tr>
        <td>
          <strong style="color: var(--brand-orange);">${b.id}</strong><br>
          <small style="font-size: 0.68rem; color: var(--text-muted);">${b.transaction_id || 'TXN-UPI'}</small>
        </td>
        <td>
          <div style="font-weight: 700;">${b.customer}</div>
          <small style="color: var(--text-muted);">${b.phone}</small>
        </td>
        <td>${b.service}</td>
        <td><span class="badge" style="background: rgba(0,0,0,0.05); color: var(--text-main);">${b.slot}</span></td>
        <td><strong>${b.vehicle}</strong></td>
        <td>
          <strong style="color: var(--accent-green);">₹${b.amount}</strong><br>
          ${payBadge}
        </td>
        <td>
          <select class="form-control" style="padding: 0.25rem 0.5rem; font-size: 0.78rem; width: 110px;" onchange="updateBookingStatus('${rawId}', this.value)">
            <option value="Pending" ${b.status.toLowerCase() === 'pending' ? 'selected' : ''}>Pending</option>
            <option value="Confirmed" ${b.status.toLowerCase() === 'confirmed' ? 'selected' : ''}>Confirmed</option>
            <option value="Completed" ${b.status.toLowerCase() === 'completed' ? 'selected' : ''}>Completed</option>
            <option value="Cancelled" ${b.status.toLowerCase() === 'cancelled' ? 'selected' : ''}>Cancelled</option>
          </select>
        </td>
        <td>
          <div style="display: flex; gap: 0.35rem; align-items: center;">
            <button class="btn btn-sm" style="background: #22c55e; color: #ffffff; border: none; padding: 3px 8px; font-size: 0.72rem; font-weight: 700;" onclick="approveBookingPayment('${rawId}')" title="Approve Payment"><i class="fa-solid fa-check"></i> Approve</button>
            <button class="btn btn-sm" style="background: #ef4444; color: #ffffff; border: none; padding: 3px 8px; font-size: 0.72rem; font-weight: 700;" onclick="rejectBookingPayment('${rawId}')" title="Reject Payment"><i class="fa-solid fa-xmark"></i> Reject</button>
            <button class="btn btn-secondary btn-sm" style="padding: 3px 8px;" onclick="showInvoicePrintModal('${b.id}')" title="Print Invoice"><i class="fa-solid fa-print"></i></button>
            <button class="btn btn-secondary btn-sm" style="padding: 3px 8px; color: #dc2626;" onclick="deleteBooking('${rawId}')" title="Delete Booking"><i class="fa-solid fa-trash"></i></button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// Print Invoice Receipt from Admin
function showInvoicePrintModal(bookingId) {
  const b = DashboardState.bookings.find(x => x.id === bookingId) || DashboardState.bookings[0];
  if (!b) return;
  showToast(`Generating Invoice for ${b.id}...`, 'info');
  setTimeout(() => window.print(), 300);
}

// Render Services Grid
function renderServicesGrid() {
  const grid = document.getElementById('services-cards-grid');
  if (!grid) return;

  const query = DashboardState.searchQuery;
  let servicesList = DashboardState.services;
  if (query) {
    servicesList = servicesList.filter(s => (s.name || s.title || '').toLowerCase().includes(query));
  }

  if (servicesList.length === 0) {
    grid.innerHTML = `<div class="card p-4 text-center text-muted" style="grid-column: 1/-1; text-align: center; padding: 2rem;"><i class="fa-solid fa-folder-open mb-2 opacity-50" style="font-size: 1.8rem; display: block;"></i>No Wash Packages Available</div>`;
    return;
  }

  grid.innerHTML = servicesList.map(s => `
    <div class="service-card">
      <div class="service-img-wrapper">
        <img src="${s.image || '../images/car 10.jpeg'}" alt="${s.name || s.title}">
        <div class="service-price-tag">₹${s.price || 500}</div>
      </div>
      <div class="service-card-body">
        <h4 style="margin-bottom: 0.4rem; color: var(--text-main); font-family: var(--font-heading);">${s.name || s.title}</h4>
        <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1rem;">${s.description || 'Premium doorstep express car wash.'}</p>
        <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-color); padding-top: 0.75rem;">
          <span style="font-size: 0.8rem; color: var(--brand-orange); font-weight: 700;"><i class="fa-solid fa-clock me-1"></i> ${s.duration ? `${s.duration} mins` : '45 mins'}</span>
          <div style="display: flex; gap: 0.5rem;">
            <button class="btn btn-secondary btn-sm" onclick="editService('${s.id}')" title="Edit Package"><i class="fa-solid fa-pen"></i> Edit</button>
            <button class="btn btn-secondary btn-sm" style="color: var(--accent-red);" onclick="deleteService('${s.id}')" title="Delete Package"><i class="fa-solid fa-trash"></i></button>
          </div>
        </div>
      </div>
    </div>
  `).join('');
}

// Edit Service Action
window.editService = function(serviceId) {
  const s = DashboardState.services.find(x => String(x.id) === String(serviceId));
  if (!s) return;

  document.getElementById('service-edit-id').value = s.id;
  document.getElementById('service-name').value = s.name || s.title || '';
  document.getElementById('service-price').value = s.price || 400;
  document.getElementById('service-duration').value = s.duration || 45;
  document.getElementById('service-desc').value = s.description || '';
  document.getElementById('modal-service-title').innerText = 'Edit Wash Package';

  const modal = document.getElementById('modal-add-service');
  if (modal) modal.classList.add('active');
};

// Delete Service Action
window.deleteService = async function(serviceId) {
  if (!confirm(`Are you sure you want to delete this Wash Package?`)) return;

  try {
    const token = localStorage.getItem('access_token');
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}/services/${serviceId}/`, {
      method: 'DELETE',
      headers: headers
    });

    if (res.status === 204 || res.ok) {
      showToast('Wash package deleted successfully!', 'success');
      await fetchLiveApiData();
    } else {
      showToast('Failed to delete wash package.', 'error');
    }
  } catch (e) {
    showToast('Network error deleting service.', 'error');
  }
};

// Render Customers List
function renderCustomersList() {
  const container = document.getElementById('customers-cards-grid');
  if (!container) return;

  const query = DashboardState.searchQuery;
  let custList = DashboardState.customers;
  if (query) {
    custList = custList.filter(c => (c.name || '').toLowerCase().includes(query) || (c.phone || '').includes(query));
  }

  if (custList.length === 0) {
    container.innerHTML = `<div class="card p-4 text-center text-muted" style="grid-column: 1/-1; text-align: center; padding: 2rem;"><i class="fa-solid fa-folder-open mb-2 opacity-50" style="font-size: 1.8rem; display: block;"></i>No Customer Data Available</div>`;
    return;
  }

  container.innerHTML = custList.map(c => `
    <div class="card" style="padding: 1.1rem; margin-bottom: 0;">
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.85rem;">
        <div style="display: flex; align-items: center; gap: 0.85rem;">
          <div style="width: 44px; height: 44px; border-radius: 50%; background: var(--brand-orange-light); color: var(--brand-orange); display: flex; align-items: center; justify-content: center; font-weight: 800; font-family: var(--font-heading); font-size: 1.1rem;">
            ${(c.name || 'C').charAt(0).toUpperCase()}
          </div>
          <div>
            <h4 style="font-size: 0.95rem; margin-bottom: 2px; font-family: var(--font-heading);">${c.name}</h4>
            <span style="font-size: 0.78rem; color: var(--text-muted);">${c.phone || c.email}</span>
          </div>
        </div>
        <button class="btn btn-secondary btn-sm" style="color: var(--accent-red); padding: 4px 8px;" onclick="deleteCustomer('${c.id}')" title="Delete Account"><i class="fa-solid fa-trash"></i></button>
      </div>
      <div style="font-size: 0.82rem; color: var(--text-muted); border-top: 1px solid var(--border-color); padding-top: 0.65rem; display: flex; justify-content: space-between;">
        <span>Bookings: <strong>${c.bookingsCount || 1}</strong></span>
        <span style="color: var(--accent-green); font-weight: 700;">Pts: ${c.loyaltyPoints || 50}</span>
      </div>
    </div>
  `).join('');
}

// Delete Customer Action
window.deleteCustomer = async function(userId) {
  if (!confirm(`Are you sure you want to delete this customer account?`)) return;

  try {
    const token = localStorage.getItem('access_token');
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}/accounts/users/${userId}/`, {
      method: 'DELETE',
      headers: headers
    });

    if (res.status === 204 || res.ok) {
      showToast('Customer account deleted successfully!', 'success');
      await fetchLiveApiData();
    } else {
      showToast('Failed to delete customer account.', 'error');
    }
  } catch (e) {
    showToast('Network error deleting user.', 'error');
  }
};

// Render Employees List
function renderEmployeesList() {
  const container = document.getElementById('employees-cards-grid');
  if (!container) return;

  const empList = DashboardState.employees;
  if (empList.length === 0) {
    container.innerHTML = `<div class="card p-4 text-center text-muted" style="grid-column: 1/-1; text-align: center; padding: 2rem;"><i class="fa-solid fa-folder-open mb-2 opacity-50" style="font-size: 1.8rem; display: block;"></i>No Employee Data Available</div>`;
    return;
  }

  container.innerHTML = empList.map((e, idx) => `
    <div class="card" style="padding: 1.1rem; margin-bottom: 0;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.65rem;">
        <h4 style="font-size: 1rem; color: var(--text-main); font-family: var(--font-heading);">${e.name}</h4>
        <span class="badge badge-completed">On Duty</span>
      </div>
      <p style="font-size: 0.82rem; color: var(--text-muted); margin-bottom: 0.65rem;">${e.email} | ${e.phone}</p>
      <div style="font-size: 0.8rem; border-top: 1px solid var(--border-color); padding-top: 0.65rem; display: flex; justify-content: space-between; align-items: center;">
        <span>Role: <strong>${e.role}</strong></span>
        <button class="btn btn-secondary btn-sm" style="color: var(--accent-red); padding: 3px 6px;" onclick="deleteCustomer('${e.id}')" title="Delete Technician"><i class="fa-solid fa-trash"></i></button>
      </div>
    </div>
  `).join('');
}

// Render Reviews List
function renderReviewsList() {
  const container = document.getElementById('reviews-list-container');
  if (!container) return;

  if (DashboardState.reviews.length === 0) {
    container.innerHTML = `<div class="card p-4 text-center text-muted" style="text-align: center; padding: 2rem;"><i class="fa-solid fa-folder-open mb-2 opacity-50" style="font-size: 1.8rem; display: block;"></i>No Reviews Available</div>`;
    return;
  }

  container.innerHTML = DashboardState.reviews.map(r => `
    <div class="card" style="padding: 1rem; margin-bottom: 0.75rem;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.4rem;">
        <strong style="font-family: var(--font-heading);">${r.customer_name || r.name || 'Customer'}</strong>
        <div style="display: flex; gap: 0.5rem; align-items: center;">
          <span style="color: var(--brand-orange);">${'★'.repeat(r.rating || 5)}</span>
          <button class="btn btn-secondary btn-sm" style="color: var(--accent-red); padding: 2px 6px;" onclick="deleteReview('${r.id}')" title="Delete Review"><i class="fa-solid fa-trash"></i></button>
        </div>
      </div>
      <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0;">${r.comment || r.message || ''}</p>
    </div>
  `).join('');
}

// Delete Review Action
window.deleteReview = async function(reviewId) {
  if (!confirm(`Are you sure you want to delete this review?`)) return;

  try {
    const token = localStorage.getItem('access_token');
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}/reviews/${reviewId}/`, {
      method: 'DELETE',
      headers: headers
    });

    if (res.status === 204 || res.ok) {
      showToast('Review deleted successfully!', 'success');
      await fetchLiveApiData();
    } else {
      showToast('Failed to delete review.', 'error');
    }
  } catch (e) {
    showToast('Network error deleting review.', 'error');
  }
};

// Helper: Booking Status Handler
async function updateBookingStatus(id, newStatus) {
  try {
    const token = localStorage.getItem('access_token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}/bookings/${id}/update_status/`, {
      method: 'PATCH',
      headers: headers,
      body: JSON.stringify({ status: newStatus })
    });

    if (res.ok) {
      showToast(`Booking #${id} status updated to ${newStatus.toUpperCase()}`, 'success');
      await fetchLiveApiData();
    } else {
      showToast(`Failed to update booking status.`, 'error');
    }
  } catch (e) {
    showToast(`Network error updating status.`, 'error');
  }
}

// Toast System
function showToast(msg, type = 'info') {
  let toastContainer = document.getElementById('dashboard-toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'dashboard-toast-container';
    toastContainer.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 9999; display: flex; flex-direction: column; gap: 10px; max-width: 360px; width: calc(100% - 40px); pointer-events: none;';
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement('div');
  const bg = type === 'success' ? '#064E3B' : type === 'error' ? '#7F1D1D' : '#78350F';
  const borderColor = type === 'success' ? '#16A34A' : type === 'error' ? '#DC2626' : '#D97706';
  
  toast.style.cssText = `pointer-events: auto; background: ${bg}; color: #FFFFFF; padding: 12px 18px; border-radius: 10px; font-size: 0.85rem; font-weight: 700; font-family: var(--font-heading); text-transform: uppercase; border-left: 4px solid ${borderColor}; box-shadow: 0 8px 24px rgba(10,17,31,0.25); transition: all 0.35s ease; animation: toastSlideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;`;
  toast.innerText = msg;

  toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(120%)';
    setTimeout(() => toast.remove(), 350);
  }, 3500);
}

// Modals Controller & All CRUD Form Handlers
function initModals() {
  const btnAddBooking = document.getElementById('btn-add-booking');
  const modalAddBooking = document.getElementById('modal-add-booking');

  if (btnAddBooking && modalAddBooking) {
    btnAddBooking.addEventListener('click', () => modalAddBooking.classList.add('active'));
  }

  const btnAddService = document.getElementById('btn-add-service');
  const modalAddService = document.getElementById('modal-add-service');
  if (btnAddService && modalAddService) {
    btnAddService.addEventListener('click', () => {
      document.getElementById('service-edit-id').value = '';
      document.getElementById('modal-service-title').innerText = 'Add New Wash Package';
      document.getElementById('form-create-service').reset();
      modalAddService.classList.add('active');
    });
  }

  const btnAddCustomer = document.getElementById('btn-add-customer');
  const modalAddCustomer = document.getElementById('modal-add-customer');
  if (btnAddCustomer && modalAddCustomer) {
    btnAddCustomer.addEventListener('click', () => {
      document.getElementById('form-create-customer').reset();
      modalAddCustomer.classList.add('active');
    });
  }

  const btnAddEmployee = document.getElementById('btn-add-employee');
  const modalAddEmployee = document.getElementById('modal-add-employee');
  if (btnAddEmployee && modalAddEmployee) {
    btnAddEmployee.addEventListener('click', () => {
      document.getElementById('form-create-employee').reset();
      modalAddEmployee.classList.add('active');
    });
  }

  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay || e.target.closest('.modal-close')) {
        overlay.classList.remove('active');
      }
    });
  });

  // 1. Submit Create Booking Form
  const formBooking = document.getElementById('form-create-booking');
  if (formBooking) {
    formBooking.addEventListener('submit', async (e) => {
      e.preventDefault();
      const payload = {
        full_name: document.getElementById('input-booking-name').value,
        phone: document.getElementById('input-booking-phone').value,
        vehicle_model: document.getElementById('input-booking-vehicle').value,
        service: document.getElementById('select-booking-service').value || 1,
        vehicle_number: "AP 07 EV 100",
        address: "Narasaraopet",
        booking_date: new Date().toISOString().split('T')[0],
        booking_time: "10:00:00"
      };

      try {
        const res = await fetch(`${API_BASE}/bookings/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          showToast('Doorstep Booking Created Successfully!', 'success');
          if (modalAddBooking) modalAddBooking.classList.remove('active');
          formBooking.reset();
          await fetchLiveApiData();
        } else {
          showToast('Failed to create booking.', 'error');
        }
      } catch (err) {
        showToast('Network error creating booking.', 'error');
      }
    });
  }

  // 2. Submit Create / Edit Service Form
  const formService = document.getElementById('form-create-service');
  if (formService) {
    formService.addEventListener('submit', async (e) => {
      e.preventDefault();
      const editId = document.getElementById('service-edit-id').value;
      const payload = {
        name: document.getElementById('service-name').value,
        price: document.getElementById('service-price').value,
        duration: document.getElementById('service-duration').value,
        description: document.getElementById('service-desc').value
      };

      const url = editId ? `${API_BASE}/services/${editId}/` : `${API_BASE}/services/`;
      const method = editId ? 'PATCH' : 'POST';

      try {
        const token = localStorage.getItem('access_token');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch(url, { method, headers, body: JSON.stringify(payload) });
        if (res.ok) {
          showToast(editId ? 'Wash Package Updated!' : 'New Wash Package Saved!', 'success');
          if (modalAddService) modalAddService.classList.remove('active');
          formService.reset();
          await fetchLiveApiData();
        } else {
          showToast('Failed to save wash package.', 'error');
        }
      } catch (err) {
        showToast('Network error saving service.', 'error');
      }
    });
  }

  // 3. Submit Create Customer Form
  const formCustomer = document.getElementById('form-create-customer');
  if (formCustomer) {
    formCustomer.addEventListener('submit', async (e) => {
      e.preventDefault();
      const payload = {
        full_name: document.getElementById('cust-name').value,
        email: document.getElementById('cust-email').value,
        phone: document.getElementById('cust-phone').value,
        role: 'customer'
      };

      try {
        const token = localStorage.getItem('access_token');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch(`${API_BASE}/accounts/users/`, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          showToast('Customer Account Created Successfully!', 'success');
          if (modalAddCustomer) modalAddCustomer.classList.remove('active');
          formCustomer.reset();
          await fetchLiveApiData();
        } else {
          showToast('Failed to create customer account.', 'error');
        }
      } catch (err) {
        showToast('Network error creating customer.', 'error');
      }
    });
  }

  // 4. Submit Create Employee Form
  const formEmployee = document.getElementById('form-create-employee');
  if (formEmployee) {
    formEmployee.addEventListener('submit', async (e) => {
      e.preventDefault();
      const payload = {
        full_name: document.getElementById('emp-name').value,
        email: document.getElementById('emp-email').value,
        phone: document.getElementById('emp-phone').value,
        role: 'employee'
      };

      try {
        const token = localStorage.getItem('access_token');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch(`${API_BASE}/accounts/users/`, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          showToast('Technician Account Created Successfully!', 'success');
          if (modalAddEmployee) modalAddEmployee.classList.remove('active');
          formEmployee.reset();
          await fetchLiveApiData();
        } else {
          showToast('Failed to create technician account.', 'error');
        }
      } catch (err) {
        showToast('Network error creating employee.', 'error');
      }
    });
  }
}
