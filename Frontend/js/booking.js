/* ==========================================================================
   RUDRA DOORSTEP EXPRESS - SLOT BOOKING & PAYMENT WORKFLOW ENGINE
   Supports Guest Booking (No Login Required) & Exact Error Handling
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initBookingEngine();
});

async function initBookingEngine() {
  const form = document.getElementById('booking-workflow-form') || document.getElementById('booking-form');
  const dateInput = document.getElementById('booking-date');
  const slotsContainer = document.getElementById('slots-container');
  const pkgContainer = document.getElementById('booking-package-selector');
  const summaryPriceEl = document.getElementById('summary-price') || document.getElementById('booking-price-display');

  if (!form || !dateInput) return;

  // Auto pre-fill logged in user details if available
  const currentUser = Auth.getCurrentUser();
  if (currentUser) {
    const nameEl = document.getElementById('cust-name') || document.getElementById('customer-name');
    const phoneEl = document.getElementById('cust-phone') || document.getElementById('customer-phone');
    const emailEl = document.getElementById('cust-email');

    if (nameEl && !nameEl.value) nameEl.value = currentUser.name || currentUser.full_name || currentUser.username || '';
    if (phoneEl && !phoneEl.value) phoneEl.value = currentUser.phone || '';
    if (emailEl && !emailEl.value) emailEl.value = currentUser.email || '';
  }

  // Default date to today
  const todayStr = new Date().toISOString().split('T')[0];
  dateInput.value = todayStr;
  dateInput.min = todayStr;

  const services = await Store.getServices();
  let selectedPackage = services[0] || { id: 1, title: 'Standard Wash', price: 400 };

  const urlParams = new URLSearchParams(window.location.search);
  const paramService = urlParams.get('service');
  if (paramService) {
    const match = services.find(s => s.id.toString() === paramService.toString());
    if (match) selectedPackage = match;
  }

  function renderPackageSelector() {
    if (!pkgContainer) return;

    const fallbackImgs = [
      '../images/car 2.jpeg',
      '../images/car 3.jpeg',
      '../images/car 4.jpeg',
      '../images/car 1.jpg',
      '../images/car 5.jpeg',
      '../images/car 6.jpeg',
      '../images/car 7.jpeg',
      '../images/car 8.jpeg'
    ];

    pkgContainer.innerHTML = services.map((s, idx) => {
      const isSelected = s.id.toString() === selectedPackage.id.toString();
      
      let imgSrc = s.image;
      if (!imgSrc || imgSrc.trim() === '') {
        const priceNum = Math.round(parseFloat(s.price || 0));
        if (priceNum === 400) imgSrc = '../images/car 2.jpeg';
        else if (priceNum === 500) imgSrc = '../images/car 3.jpeg';
        else if (priceNum === 600) imgSrc = '../images/car 4.jpeg';
        else imgSrc = fallbackImgs[idx % fallbackImgs.length];
      } else if (!imgSrc.startsWith('http') && !imgSrc.startsWith('../') && !imgSrc.startsWith('/')) {
        imgSrc = '../' + imgSrc;
      }

      const defaultFallback = fallbackImgs[idx % fallbackImgs.length];

      return `
        <div class="booking-pkg-card ${isSelected ? 'active-pkg' : ''}" data-pkg-id="${s.id}" data-price="${s.price}">
          <div style="display: flex; flex-direction: column; height: 100%;">
            <div style="height: 100px; border-radius: var(--radius-sm); overflow: hidden; margin-bottom: 0.5rem;">
              <img src="${imgSrc}" alt="${s.title}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.onerror=null; this.src='${defaultFallback}';">
            </div>
            <span class="section-tag" style="padding: 0.1rem 0.4rem; font-size: 0.65rem; margin-bottom: 0.25rem;">${s.badge || s.category}</span>
            <h4 style="font-size: 0.95rem; margin-bottom: 0.25rem; color: var(--text-main);">${s.title}</h4>
            <p style="font-size: 0.76rem; color: var(--text-muted); line-height: 1.3; margin-bottom: 0.5rem; flex-grow: 1;">
              ${s.description}
            </p>
            <div style="font-family: var(--font-heading); font-size: 1.4rem; font-weight: 800; color: ${s.price === 600 ? 'var(--accent-red)' : 'var(--accent-yellow)'}; margin-top: auto;">
              ₹${s.price}
            </div>
          </div>
        </div>
      `;
    }).join('');

    pkgContainer.querySelectorAll('.booking-pkg-card').forEach(card => {
      card.addEventListener('click', () => {
        const pkgId = card.getAttribute('data-pkg-id');
        const match = services.find(s => s.id.toString() === pkgId.toString());
        if (match) {
          selectedPackage = match;
          updateSelectedPackageUI();
        }
      });
    });
  }

  function updateSelectedPackageUI() {
    if (summaryPriceEl) {
      summaryPriceEl.textContent = `₹${selectedPackage.price}`;
    }

    if (pkgContainer) {
      pkgContainer.querySelectorAll('.booking-pkg-card').forEach(card => {
        if (card.getAttribute('data-pkg-id').toString() === selectedPackage.id.toString()) {
          card.classList.add('active-pkg');
        } else {
          card.classList.remove('active-pkg');
        }
      });
    }
  }

  renderPackageSelector();
  updateSelectedPackageUI();

  const TIME_SLOTS = [
    '07:30:00',
    '09:00:00',
    '10:30:00',
    '12:00:00',
    '13:30:00',
    '15:00:00',
    '16:30:00',
    '18:00:00'
  ];

  const TIME_SLOT_LABELS = {
    '07:30:00': '07:30 AM - 09:00 AM',
    '09:00:00': '09:00 AM - 10:30 AM',
    '10:30:00': '10:30 AM - 12:00 PM',
    '12:00:00': '12:00 PM - 01:30 PM',
    '13:30:00': '01:30 PM - 03:00 PM',
    '15:00:00': '03:00 PM - 04:30 PM',
    '16:30:00': '04:30 PM - 06:00 PM',
    '18:00:00': '06:00 PM - 07:30 PM'
  };

  let selectedSlotTime = null;

  async function renderSlots() {
    if (!slotsContainer) return;
    const selectedDate = dateInput.value;
    const allBookings = await Store.getBookings();

    const slotCounts = {};
    TIME_SLOTS.forEach(s => slotCounts[s] = 0);

    allBookings.forEach(b => {
      if (b.date === selectedDate && b.status !== 'Cancelled') {
        const slotKey = b.slotTime ? b.slotTime.slice(0, 8) : null;
        if (slotKey && slotCounts[slotKey] !== undefined) {
          slotCounts[slotKey]++;
        }
      }
    });

    slotsContainer.innerHTML = '';
    selectedSlotTime = null;

    TIME_SLOTS.forEach(timeStr => {
      const bookedCount = slotCounts[timeStr] || 0;
      const isFull = bookedCount >= 2;
      const freeCount = Math.max(0, 2 - bookedCount);
      const label = TIME_SLOT_LABELS[timeStr] || timeStr;

      const slotCard = document.createElement('div');
      slotCard.className = `slot-card ${isFull ? 'full' : 'available'}`;
      slotCard.setAttribute('data-slot-time', timeStr);

      if (isFull) {
        slotCard.innerHTML = `
          <span class="slot-time"><i class="fa-regular fa-clock"></i> ${label}</span>
          <span class="slot-status-badge badge-red"><i class="fa-solid fa-circle-xmark"></i> FULL (0/2 Free)</span>
        `;
      } else {
        slotCard.innerHTML = `
          <span class="slot-time"><i class="fa-regular fa-clock"></i> ${label}</span>
          <span class="slot-status-badge badge-green"><i class="fa-solid fa-circle-check"></i> ${freeCount}/2 Free</span>
        `;

        slotCard.addEventListener('click', () => {
          document.querySelectorAll('.slot-card.available').forEach(c => {
            c.classList.remove('selected');
            const cTime = c.getAttribute('data-slot-time');
            const cBooked = slotCounts[cTime] || 0;
            const cFree = Math.max(0, 2 - cBooked);
            c.querySelector('.slot-status-badge').innerHTML = `<i class="fa-solid fa-circle-check"></i> ${cFree}/2 Free`;
          });

          slotCard.classList.add('selected');
          selectedSlotTime = timeStr;

          const previewFree = Math.max(0, freeCount - 1);
          const badgeEl = slotCard.querySelector('.slot-status-badge');
          if (badgeEl) {
            badgeEl.innerHTML = `<i class="fa-solid fa-circle-check"></i> ${previewFree}/2 Free (Selected)`;
          }
        });
      }

      slotsContainer.appendChild(slotCard);
    });
  }

  await renderSlots();
  dateInput.addEventListener('change', renderSlots);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!selectedSlotTime) {
      showToast('Please select an available (GREEN) time slot for your doorstep wash!', 'warning');
      return;
    }

    const custName = document.getElementById('cust-name')?.value || 'Customer';
    const custPhone = document.getElementById('cust-phone')?.value || '';
    const custEmail = document.getElementById('cust-email')?.value || `${custPhone}@rudracarwash.com`;
    const custAddress = document.getElementById('cust-address')?.value || 'Narasaraopet';
    const vehType = document.getElementById('veh-type')?.value || 'Sedan';
    const vehNo = document.getElementById('veh-no')?.value || '';

    if (window.validateName && !window.validateName(custName)) return;
    if (window.validatePhone && !window.validatePhone(custPhone)) return;
    if (window.validateVehicleNo && !window.validateVehicleNo(vehNo)) return;

    const bookingPayload = {
      service_id: selectedPackage.id,
      full_name: custName,
      phone: custPhone,
      email: custEmail,
      vehicle_type: vehType,
      vehicle_brand: 'Standard',
      vehicle_model: vehType,
      vehicle_number: vehNo.toUpperCase(),
      address: custAddress,
      booking_date: dateInput.value,
      booking_time: selectedSlotTime,
      total_price: selectedPackage.price
    };

    try {
      const token = localStorage.getItem('access_token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(`${API_BASE_URL}/bookings/`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(bookingPayload)
      });

      const data = await response.json();

      if (response.ok && data.booking) {
        const bId = data.booking.id;
        showToast('Booking Successful! Redirecting to Payment...', 'success');
        setTimeout(() => {
          window.location.href = `payment.html?booking_id=${bId}`;
        }, 800);
      } else {
        // Detailed error extraction instead of generic message
        let errorDetail = data.message || data.detail;
        if (!errorDetail && typeof data === 'object') {
          errorDetail = Object.entries(data)
            .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
            .join(' | ');
        }
        showToast(errorDetail || 'Booking failed. Please check form entries.', 'error');
      }
    } catch (err) {
      console.warn("Booking API submission fallback:", err);
      const result = await Store.addBooking({
        serviceId: selectedPackage.id,
        vehicleType: vehType,
        vehicleBrand: 'Standard',
        vehicleModel: vehType,
        vehicleNo: vehNo.toUpperCase(),
        address: custAddress,
        date: dateInput.value,
        slotTime: selectedSlotTime
      });
      if (result.success) {
        showToast('Booking Successful! Redirecting to Payment...', 'success');
        setTimeout(() => {
          window.location.href = `payment.html?booking_id=${result.booking.id}`;
        }, 800);
      } else {
        showToast(result.message || 'Booking submission failed.', 'error');
      }
    }
  });
}
