/* ==========================================================================
   RUDRA CAR WASH - ADMIN DASHBOARD ENGINE (SaaS PLATFORM JAVASCRIPT)
   Handles API Integration, Data Rendering, Modals, Payments & Live Alerts
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

  const isAdmin = token && user && (user.role === 'admin' || user.is_superuser === true);

  if (!isAdmin) {
    console.warn("Direct URL access denied. Admin authentication required.");
    window.location.href = '/pages/admin-login.html';
  }
})();

const API_BASE = window.location.origin.includes('http') && !window.location.origin.includes('file')
  ? '/api/v1'
  : 'http://127.0.0.1:8000/api/v1';

// Dashboard State Store
const DashboardState = {
  activeTab: 'overview',
  theme: localStorage.getItem('rudra_theme') || 'light',
  metrics: {
    totalUsers: 28,
    totalServices: 3,
    totalBookings: 42,
    pendingBookings: 8,
    confirmedBookings: 14,
    completedBookings: 18,
    cancelledBookings: 2,
    totalReviews: 19,
    todayRevenue: 8400,
    totalRevenue: 25200
  },
  bookings: [
    { id: "RCW-9026", customer: "Rajesh Kumar", phone: "+91 98765 43210", vehicle: "Swift (AP 07 BK 1234)", service: "Foam Wash + Vacuum", slot: "Tomorrow, 10:00 AM", amount: 500, status: "confirmed", payment_status: "PAID", transaction_id: "TXN-UPI-984210" },
    { id: "RCW-9021", customer: "Rajesh Kumar", phone: "9876543210", vehicle: "Creta (AP 07 BK 4590)", service: "Full Interior & Polish", slot: "Today, 10:00 AM", amount: 600, status: "confirmed", payment_status: "PAID", transaction_id: "TXN-UPI-449120" },
    { id: "RCW-9022", customer: "Srinivas Rao", phone: "9845123789", vehicle: "Swift (AP 07 CX 1122)", service: "Foam & Water Wash", slot: "Today, 11:30 AM", amount: 400, status: "pending", payment_status: "PENDING", transaction_id: "TXN-UPI-119283" },
    { id: "RCW-9023", customer: "Venkatesh M.", phone: "9123456789", vehicle: "Innova (AP 07 DE 3344)", service: "Foam Wash + Vacuum", slot: "Today, 01:00 PM", amount: 500, status: "completed", payment_status: "PAID", transaction_id: "TXN-UPI-884102" }
  ],
  services: [
    { id: 1, title: "Foam & Water Wash", price: 400, duration: "45 mins", image: "../images/car 10.jpeg", description: "Exterior pressure foam wash with tyre shine & window cleaning." },
    { id: 2, title: "Foam Wash + Interior Vacuum", price: 500, duration: "60 mins", image: "../images/car 12.png", description: "Complete foam wash plus cabin vacuuming and dashboard wipe." },
    { id: 3, title: "Full Interior & Tyre Polish", price: 600, duration: "75 mins", image: "../images/car 16.png", description: "Deep interior shampooing, seat steam sanitize & premium tyre polish." }
  ],
  customers: [
    { id: 1, name: "Rajesh Kumar", email: "rajesh@example.com", phone: "+91 9876543210", vehicle: "Creta", bookingsCount: 5, loyaltyPoints: 250 },
    { id: 2, name: "Srinivas Rao", email: "srinivas@example.com", phone: "+91 9845123789", vehicle: "Swift", bookingsCount: 3, loyaltyPoints: 150 },
    { id: 3, name: "Venkatesh M.", email: "venkatesh@example.com", phone: "+91 9123456789", vehicle: "Innova", bookingsCount: 7, loyaltyPoints: 350 }
  ],
  employees: [
    { id: 1, name: "Ramesh Babu", role: "Van Driver / Lead Technician", phone: "6300619133", status: "On Duty", washesCompleted: 84 },
    { id: 2, name: "Suresh V.", role: "Foam Wash Technician", phone: "9440123456", status: "On Duty", washesCompleted: 62 },
    { id: 3, name: "Nagaraju P.", role: "Interior Detailer", phone: "9848011223", status: "Off Duty", washesCompleted: 45 }
  ],
  reviews: [
    { id: 1, customer: "Rajesh Kumar", rating: 5, comment: "Punctual doorstep van! Sparkling clean interior.", date: "Today", isApproved: true },
    { id: 2, customer: "Anitha R.", rating: 5, comment: "Best car wash service in Narasaraopet!", date: "Yesterday", isApproved: true }
  ],
  unreadNotifCount: 3,
  notificationsList: [
    { id: 1, title: "New Doorstep Booking #RCW-9026", time: "10 mins ago", details: "Rajesh Kumar booked Foam Wash + Vacuum for tomorrow 10:00 AM." },
    { id: 2, title: "UPI Payment Received: ₹600", time: "35 mins ago", details: "Transaction TXN-UPI-449120 confirmed for Swift (AP 07 BK 4590)." },
    { id: 3, title: "Mobile Van Crew Dispatched", time: "1 hour ago", details: "Technician Ramesh Babu assigned to Narasaraopet Zone 1." }
  ],
  knownNotifIds: new Set()
};

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initModals();
  initLogout();
  fetchLiveApiData();
  renderAllSections();
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

  // Mobile Menu Toggle & Drawer Backdrop
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

  // Auto-retract mobile sidebar when navigating between tabs on mobile
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

  // Update active state in sidebar
  document.querySelectorAll('.sidebar-link').forEach(link => {
    link.classList.toggle('active', link.getAttribute('data-section') === sectionId);
  });

  // Hide all sections, show active section
  document.querySelectorAll('.tab-section').forEach(sec => {
    sec.style.display = 'none';
  });

  const activeSection = document.getElementById(`section-${sectionId}`);
  if (activeSection) {
    activeSection.style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Clear unread badge when viewing notifications tab
  if (sectionId === 'notifications') {
    DashboardState.unreadNotifCount = 0;
    updateNotificationBadge();
  }

  renderAllSections();
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
      if (list.length > 0) {
        DashboardState.bookings = list.map(b => ({
          raw_id: b.id,
          id: `RCW-${b.id || Math.floor(1000 + Math.random()*9000)}`,
          customer: b.full_name || (b.user ? b.user.email : "Customer"),
          phone: b.phone || "N/A",
          vehicle: `${b.vehicle_model || 'Car'} (${b.vehicle_number || 'AP 07'})`,
          service: b.service ? b.service.name : "Foam Wash",
          slot: `${b.booking_date || 'Today'} ${b.booking_time || ''}`,
          amount: b.total_price || 500,
          status: b.status || 'Pending',
          payment_status: b.payment_status || 'PENDING',
          transaction_id: b.transaction_id || 'TXN-UPI-984210'
        }));
      }
    }

    // 3. Fetch Services
    const servicesRes = await fetch(`${API_BASE}/services/`);
    if (servicesRes.ok) {
      const servicesData = await servicesRes.json();
      const sList = Array.isArray(servicesData) ? servicesData : (servicesData.results || []);
      if (sList.length > 0) {
        DashboardState.services = sList;
      }
    }

  } catch (err) {
    console.warn("API Sync Warning: Running in offline fallback mode.", err);
  }

  renderAllSections();
}

// Live Real-Time Admin Notification Polling
function initLiveNotificationPolling() {
  setInterval(async () => {
    try {
      const res = await fetch(`${API_BASE}/bookings/notifications/`);
      if (res.ok) {
        const notifs = await res.json();
        notifs.forEach(n => {
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
      // Quiet catch
    }
  }, 8000);
}

// Master Render Function
function renderAllSections() {
  renderOverviewKPIs();
  renderSlotOccupancyGrid();
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
    container.innerHTML = `<div style="text-align: center; padding: 2rem; color: var(--text-muted);">No activity notifications found.</div>`;
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
  animateCounter('kpi-revenue', `₹${(DashboardState.metrics.todayRevenue || 8400).toLocaleString()}`);
  animateCounter('kpi-today-bookings', DashboardState.metrics.totalBookings || 42);
  animateCounter('kpi-pending-bookings', DashboardState.metrics.pendingBookings || 8);
  animateCounter('kpi-completed-washes', DashboardState.metrics.completedBookings || 18);
  animateCounter('kpi-active-staff', 3);
  animateCounter('kpi-queue-count', 4);
}

function animateCounter(elementId, finalVal) {
  const el = document.getElementById(elementId);
  if (el) el.innerText = finalVal;
}

// Render Slot Occupancy Grid
function renderSlotOccupancyGrid() {
  const container = document.getElementById('slot-occupancy-container');
  if (!container) return;

  const slots = [
    { time: "08:00 AM - 09:30 AM", cars: ["Creta (AP 07 BK 4590)", "Swift (AP 07 CX 1122)"], max: 2 },
    { time: "09:30 AM - 11:00 AM", cars: ["Innova (AP 07 DE 3344)"], max: 2 },
    { time: "11:00 AM - 12:30 PM", cars: ["i20 (AP 07 EV 8899)", "Fortuner (AP 07 FZ 9900)"], max: 2 },
    { time: "02:00 PM - 03:30 PM", cars: [], max: 2 },
    { time: "03:30 PM - 05:00 PM", cars: ["Baleno (AP 07 GH 1234)"], max: 2 },
    { time: "05:00 PM - 06:30 PM", cars: [], max: 2 }
  ];

  let html = '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.1rem;">';
  slots.forEach(s => {
    const isFull = s.cars.length >= s.max;
    const countBadge = isFull 
      ? '<span class="badge badge-cancelled">FULL (2/2)</span>' 
      : `<span class="badge badge-confirmed">${s.cars.length}/2 Booked</span>`;

    html += `
      <div class="card" style="padding: 1.1rem; margin-bottom: 0;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
          <strong style="font-size: 0.85rem; color: var(--text-main); font-family: var(--font-heading);"><i class="fa-solid fa-clock" style="color: var(--brand-orange); margin-right: 6px;"></i> ${s.time}</strong>
          ${countBadge}
        </div>
        <div style="display: flex; gap: 0.65rem;">
          <div style="flex:1; padding: 0.65rem; border-radius: 8px; border: 1.5px dashed var(--border-color); text-align: center; font-size: 0.78rem; background: #FFFFFF;">
            ${s.cars[0] ? `<i class="fa-solid fa-car text-warning"></i><br><small>${s.cars[0]}</small>` : '<span style="color: var(--text-subtle);">Available Slot</span>'}
          </div>
          <div style="flex:1; padding: 0.65rem; border-radius: 8px; border: 1.5px dashed var(--border-color); text-align: center; font-size: 0.78rem; background: #FFFFFF;">
            ${s.cars[1] ? `<i class="fa-solid fa-car text-warning"></i><br><small>${s.cars[1]}</small>` : '<span style="color: var(--text-subtle);">Available Slot</span>'}
          </div>
        </div>
      </div>
    `;
  });
  html += '</div>';
  container.innerHTML = html;
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

// Render Bookings Table with Payment & Transaction Details
function renderBookingsTable() {
  const tbody = document.getElementById('bookings-table-tbody');
  const fullTbody = document.getElementById('full-bookings-tbody');
  
  if (!tbody) return;

  if (DashboardState.bookings.length === 0) {
    const emptyHTML = '<tr><td colspan="8" class="text-center p-4 text-muted">No doorstep bookings found.</td></tr>';
    tbody.innerHTML = emptyHTML;
    if (fullTbody) fullTbody.innerHTML = emptyHTML;
    return;
  }

  const rowsHTML = DashboardState.bookings.map(b => {
    const rawId = b.raw_id || b.id.replace('RCW-', '');
    const isPaid = (b.payment_status || '').toUpperCase() === 'PAID';
    const isFailed = (b.payment_status || '').toUpperCase() === 'FAILED';
    
    let payBadge = `<span class="badge badge-pending" style="font-size: 0.7rem;"><i class="fa-solid fa-clock-rotate-left"></i> Pending Verification</span>`;
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
          </div>
        </td>
      </tr>
    `;
  }).join('');

  tbody.innerHTML = rowsHTML;
  if (fullTbody) fullTbody.innerHTML = rowsHTML;
}

// Print Invoice Receipt from Admin
function showInvoicePrintModal(bookingId) {
  const b = DashboardState.bookings.find(x => x.id === bookingId) || DashboardState.bookings[0];
  showToast(`Generating Invoice for ${b.id}...`, 'info');
  setTimeout(() => window.print(), 300);
}

// Render Services Grid
function renderServicesGrid() {
  const grid = document.getElementById('services-cards-grid');
  if (!grid) return;

  grid.innerHTML = DashboardState.services.map(s => `
    <div class="service-card">
      <div class="service-img-wrapper">
        <img src="${s.image || '../images/car 10.jpeg'}" alt="${s.title}">
        <div class="service-price-tag">₹${s.price || s.price_rs || 500}</div>
      </div>
      <div class="service-card-body">
        <h4 style="margin-bottom: 0.4rem; color: var(--text-main); font-family: var(--font-heading);">${s.name || s.title}</h4>
        <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1rem;">${s.description || 'Premium doorstep express car wash.'}</p>
        <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-color); padding-top: 0.75rem;">
          <span style="font-size: 0.8rem; color: var(--brand-orange); font-weight: 700;"><i class="fa-solid fa-clock me-1"></i> ${s.duration || '45 mins'}</span>
          <div style="display: flex; gap: 0.5rem;">
            <button class="btn btn-secondary btn-sm"><i class="fa-solid fa-pen"></i></button>
            <button class="btn btn-secondary btn-sm" style="color: var(--accent-red);"><i class="fa-solid fa-trash"></i></button>
          </div>
        </div>
      </div>
    </div>
  `).join('');
}

// Render Customers List
function renderCustomersList() {
  const container = document.getElementById('customers-cards-grid');
  if (!container) return;

  container.innerHTML = DashboardState.customers.map(c => `
    <div class="card" style="padding: 1.1rem; margin-bottom: 0;">
      <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 0.85rem;">
        <div style="width: 44px; height: 44px; border-radius: 50%; background: var(--brand-orange-light); color: var(--brand-orange); display: flex; align-items: center; justify-content: center; font-weight: 800; font-family: var(--font-heading); font-size: 1.1rem;">
          ${c.name.charAt(0)}
        </div>
        <div>
          <h4 style="font-size: 0.95rem; margin-bottom: 2px; font-family: var(--font-heading);">${c.name}</h4>
          <span style="font-size: 0.78rem; color: var(--text-muted);">${c.phone}</span>
        </div>
      </div>
      <div style="font-size: 0.82rem; color: var(--text-muted); border-top: 1px solid var(--border-color); padding-top: 0.65rem; display: flex; justify-content: space-between;">
        <span>Bookings: <strong>${c.bookingsCount}</strong></span>
        <span style="color: var(--accent-green); font-weight: 700;">Pts: ${c.loyaltyPoints}</span>
      </div>
    </div>
  `).join('');
}

// Render Employees List
function renderEmployeesList() {
  const container = document.getElementById('employees-cards-grid');
  if (!container) return;

  container.innerHTML = DashboardState.employees.map(e => `
    <div class="card" style="padding: 1.1rem; margin-bottom: 0;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.65rem;">
        <h4 style="font-size: 1rem; color: var(--text-main); font-family: var(--font-heading);">${e.name}</h4>
        <span class="badge ${e.status === 'On Duty' ? 'badge-completed' : 'badge-pending'}">${e.status}</span>
      </div>
      <p style="font-size: 0.82rem; color: var(--text-muted); margin-bottom: 0.65rem;">${e.role}</p>
      <div style="font-size: 0.8rem; border-top: 1px solid var(--border-color); padding-top: 0.65rem; display: flex; justify-content: space-between;">
        <span>Phone: <strong>${e.phone}</strong></span>
        <span style="color: var(--brand-orange); font-weight: 700;">Washes: ${e.washesCompleted}</span>
      </div>
    </div>
  `).join('');
}

// Render Reviews List
function renderReviewsList() {
  const container = document.getElementById('reviews-list-container');
  if (!container) return;

  container.innerHTML = DashboardState.reviews.map(r => `
    <div class="card" style="padding: 1rem; margin-bottom: 0.75rem;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.4rem;">
        <strong style="font-family: var(--font-heading);">${r.customer}</strong>
        <span style="color: var(--brand-orange);">${'★'.repeat(r.rating)}</span>
      </div>
      <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0;">${r.comment}</p>
    </div>
  `).join('');
}

// Helper: Booking Status Handler
function updateBookingStatus(id, newStatus) {
  const b = DashboardState.bookings.find(x => x.id === id);
  if (b) {
    b.status = newStatus;
    showToast(`Booking ${id} status updated to ${newStatus.toUpperCase()}`, 'success');
    renderBookingsTable();
  }
}

// Helper: Top-Right Positioned Toast System
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

// Modals Controller
function initModals() {
  const btnAddBooking = document.getElementById('btn-add-booking');
  const btnNewBookingTable = document.getElementById('btn-new-booking-table');
  const modalAddBooking = document.getElementById('modal-add-booking');

  if (btnAddBooking && modalAddBooking) {
    btnAddBooking.addEventListener('click', () => modalAddBooking.classList.add('active'));
  }

  if (btnNewBookingTable && modalAddBooking) {
    btnNewBookingTable.addEventListener('click', () => modalAddBooking.classList.add('active'));
  }

  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay || e.target.closest('.modal-close')) {
        overlay.classList.remove('active');
      }
    });
  });
}
