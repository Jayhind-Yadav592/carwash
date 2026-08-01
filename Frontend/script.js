/* ==========================================================================
   GLOBAL SCRIPT & STRICT INPUT VALIDATIONS ENGINE
   1. Name Fields: Letters & Spaces ONLY (No Numbers Allowed)
   2. Mobile Fields: Exactly 10 Digits (or +91 e.g. +91 XXXXX XXXXX)
   3. Vehicle Reg: Standard Format e.g. AP 07 BZ 2712 (Starts with State Letters)
   ========================================================================== */

// Global function to guarantee intro overlay dismisses on click
window.dismissIntroOverlay = function() {
  const overlay = document.getElementById('intro-overlay');
  if (overlay) {
    overlay.classList.add('hide');
    overlay.style.opacity = '0';
    overlay.style.visibility = 'hidden';
    overlay.style.pointerEvents = 'none';
    setTimeout(() => {
      overlay.style.display = 'none';
    }, 400);
  }
  document.body.style.overflow = '';
};

document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initMobileMenu();
  initCinematicLogoIntro();
  initFixedWhatsApp();
  setupInputValidations();
});

/* Navbar Scroll Effect */
function initNavbar() {
  const navbar = document.querySelector('.navbar');
  if (!navbar) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });

  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link, .mobile-nav-link').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPath || (currentPath === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });
}

/* Mobile Menu */
function initMobileMenu() {
  const toggleBtn = document.querySelector('.mobile-toggle');
  const mobileMenu = document.querySelector('.mobile-menu');
  const closeBtn = document.querySelector('.mobile-menu-close');
  const backdrop = document.querySelector('.backdrop');

  if (!mobileMenu) return;

  function openMenu() {
    mobileMenu.classList.add('open');
    if (backdrop) backdrop.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeMenu() {
    mobileMenu.classList.remove('open');
    if (backdrop) backdrop.classList.remove('active');
    document.body.style.overflow = '';
  }

  if (toggleBtn) toggleBtn.addEventListener('click', openMenu);
  if (closeBtn) closeBtn.addEventListener('click', closeMenu);
  if (backdrop) backdrop.addEventListener('click', closeMenu);
}

/* FIXED RIGHT-BOTTOM FLOATING WHATSAPP BUTTON WITH PULSE ANIMATION */
function initFixedWhatsApp() {
  let whatsappBtn = document.querySelector('.floating-whatsapp-btn');
  if (!whatsappBtn) {
    whatsappBtn = document.createElement('a');
    whatsappBtn.href = 'https://wa.me/916300619133?text=Hi%20Rudra%20Doorstep%20Car%20Wash,%20I%20want%20to%20book%20a%20doorstep%20wash%20in%20Narasaraopet!';
    whatsappBtn.target = '_blank';
    whatsappBtn.className = 'floating-whatsapp-btn';
    whatsappBtn.setAttribute('aria-label', 'Chat on WhatsApp with Rudra Doorstep Express Car Wash');
    whatsappBtn.innerHTML = `<i class="fa-brands fa-whatsapp"></i>`;
    document.body.appendChild(whatsappBtn);
  }
}

/* INTRO LOGO SCREEN ANIMATION ENGINE */
function initCinematicLogoIntro() {
  const overlay = document.getElementById('intro-overlay');
  const enterBtn = document.getElementById('btn-enter-site');

  if (!overlay) return;

  if (enterBtn) {
    enterBtn.addEventListener('click', window.dismissIntroOverlay);
  }

  // Auto-dismiss after 6s safety backup
  setTimeout(() => {
    if (!overlay.classList.contains('hide')) {
      window.dismissIntroOverlay();
    }
  }, 6000);
}

/* Toast Utility - TOP-RIGHT Positioned with Modern Slide Animation */
function showToast(message, type = 'info') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;

  let iconClass = 'fa-circle-info';
  if (type === 'success') iconClass = 'fa-circle-check';
  if (type === 'error') iconClass = 'fa-circle-xmark';
  if (type === 'warning') iconClass = 'fa-triangle-exclamation';

  toast.innerHTML = `
    <i class="fa-solid ${iconClass}"></i>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(120%)';
    toast.style.transition = 'all 0.35s ease';
    setTimeout(() => toast.remove(), 350);
  }, 3500);
}

/* ==========================================================================
   REAL-TIME STRICT FORM INPUT VALIDATIONS & FORMATTING ENGINE
   1. Name Fields: Letters & Spaces ONLY (No Numbers Allowed)
   2. Mobile Fields: Exactly 10 Digits (Placeholder: +91 XXXXX XXXXX)
   3. Vehicle Reg: Standard Format e.g. AP 07 BZ 2712 (Starts with State Letters)
   ========================================================================== */

function setupInputValidations() {
  // 1. NAME FIELDS VALIDATION (Letters & Spaces ONLY, No Numbers)
  const nameSelectors = '#cust-name, #reg-name, #contact-name, #review-name, #customer-name';
  document.querySelectorAll(nameSelectors).forEach(input => {
    input.setAttribute('pattern', '[A-Za-z\\s]+');
    input.setAttribute('title', 'Name must contain letters and spaces only');

    input.addEventListener('input', (e) => {
      const cleaned = e.target.value.replace(/[^A-Za-z\s]/g, '');
      if (e.target.value !== cleaned) {
        e.target.value = cleaned;
        showToast('Name can only contain letters (no numbers)', 'warning');
      }
    });
  });

  // 2. MOBILE / PHONE NUMBER VALIDATION (Placeholder +91 XXXXX XXXXX, Strict Max 10 Digits)
  const phoneSelectors = '#cust-phone, #reg-phone, #contact-phone, #customer-phone';
  document.querySelectorAll(phoneSelectors).forEach(input => {
    input.setAttribute('maxlength', '15');
    input.setAttribute('placeholder', '+91 XXXXX XXXXX');

    input.addEventListener('input', (e) => {
      let raw = e.target.value;

      if (raw.startsWith('+')) {
        let formatted = '+' + raw.slice(1).replace(/[^0-9\s]/g, '');
        let digitsOnly = formatted.replace(/\D/g, '');
        if (digitsOnly.length > 12) { // 91 + 10 digits
          digitsOnly = digitsOnly.slice(0, 12);
          formatted = `+${digitsOnly.slice(0, 2)} ${digitsOnly.slice(2)}`;
          showToast('Mobile number cannot exceed 10 digits', 'warning');
        }
        e.target.value = formatted;
      } else {
        let digitsOnly = raw.replace(/\D/g, '');
        if (digitsOnly.length > 10) {
          digitsOnly = digitsOnly.slice(0, 10);
          showToast('Mobile number must be exactly 10 digits', 'warning');
        }
        e.target.value = digitsOnly;
      }
    });
  });

  // 3. VEHICLE REGISTRATION NUMBER VALIDATION (e.g. AP 07 BZ 2712)
  const vehicleSelectors = '#veh-no, #vehicle-no, #review-vehicle';
  document.querySelectorAll(vehicleSelectors).forEach(input => {
    input.setAttribute('placeholder', 'e.g. AP 07 BZ 2712');
    input.setAttribute('maxlength', '13');

    input.addEventListener('input', (e) => {
      let val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');

      // Rejects starting with digits (must start with state letters e.g. AP, TS)
      if (val.length > 0 && /^[0-9]/.test(val)) {
        val = val.replace(/^[0-9]+/, '');
        showToast('Vehicle registration must start with State letters (e.g. AP)', 'warning');
      }

      // Auto-formats space separation e.g. AP 07 BZ 2712
      let formatted = '';
      if (val.length > 0) {
        const stateLetters = val.slice(0, 2).replace(/[^A-Z]/g, '');
        formatted += stateLetters;

        if (val.length > 2) {
          const districtDigits = val.slice(2, 4).replace(/[^0-9]/g, '');
          if (districtDigits) formatted += ' ' + districtDigits;

          if (val.length > 4) {
            let remaining = val.slice(4);
            let seriesLetters = '';
            let i = 0;
            while (i < remaining.length && /[A-Z]/.test(remaining[i]) && seriesLetters.length < 2) {
              seriesLetters += remaining[i];
              i++;
            }
            let endDigits = remaining.slice(i).replace(/[^0-9]/g, '').slice(0, 4);

            if (seriesLetters) formatted += ' ' + seriesLetters;
            if (endDigits) formatted += ' ' + endDigits;
          }
        }
      }

      e.target.value = formatted;
    });
  });
}

// Global Validation Utilities for Form Submissions
window.validateName = function(nameStr) {
  if (!nameStr || nameStr.trim().length < 2) {
    showToast('Please enter your full name (minimum 2 letters)', 'warning');
    return false;
  }
  if (/[0-9]/.test(nameStr)) {
    showToast('Name cannot contain numbers', 'warning');
    return false;
  }
  return true;
};

window.validatePhone = function(phoneStr) {
  if (!phoneStr) {
    showToast('Please enter your 10-digit mobile number', 'warning');
    return false;
  }
  const digitsOnly = phoneStr.replace(/\D/g, '');
  const is91Prefix = digitsOnly.startsWith('91') && digitsOnly.length === 12;
  const targetDigits = is91Prefix ? digitsOnly.slice(2) : digitsOnly;

  if (targetDigits.length !== 10) {
    showToast(`Mobile number must be exactly 10 digits (you entered ${targetDigits.length} digits)`, 'warning');
    return false;
  }

  if (!/^[6-9]/.test(targetDigits)) {
    showToast('Mobile number must start with 6, 7, 8, or 9', 'warning');
    return false;
  }

  return true;
};

window.validateVehicleNo = function(vehStr) {
  if (!vehStr || vehStr.trim().length < 6) {
    showToast('Please enter a valid vehicle registration number e.g. AP 07 BZ 2712', 'warning');
    return false;
  }
  const clean = vehStr.toUpperCase().replace(/\s+/g, '');
  // Format: 2 Letters + 2 Digits + 1-2 Letters + 4 Digits e.g. AP07BZ2712
  const pattern = /^[A-Z]{2}\d{2}[A-Z]{1,2}\d{4}$/;
  if (!pattern.test(clean)) {
    showToast('Vehicle registration format invalid. Example format: AP 07 BZ 2712', 'warning');
    return false;
  }
  return true;
};
