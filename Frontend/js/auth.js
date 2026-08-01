/* ==========================================================================
   AUTHENTICATION & SESSION MANAGEMENT SYSTEM (REST API DRIVEN)
   Handles Login, Admin Superuser Authentication, Registration, Logout & Storage
   ========================================================================== */

const API_BASE_URL = window.location.origin.includes('http') && !window.location.origin.includes('file')
  ? '/api/v1'
  : 'http://127.0.0.1:8000/api/v1';

const Auth = {
  getTokens() {
    return {
      access: localStorage.getItem('access_token'),
      refresh: localStorage.getItem('refresh_token')
    };
  },

  getCurrentUser() {
    const stored = localStorage.getItem('rudra_session_v4') || localStorage.getItem('rudra_carwash_session');
    return stored ? JSON.parse(stored) : null;
  },

  getAuthHeaders() {
    const { access } = this.getTokens();
    if (access && access !== 'null' && access !== 'undefined' && access.trim() !== '') {
      return { 'Authorization': `Bearer ${access}`, 'Content-Type': 'application/json' };
    }
    return { 'Content-Type': 'application/json' };
  },

  async login(usernameInput, password) {
    try {
      const isEmail = usernameInput.includes('@');
      const email = isEmail ? usernameInput.trim().toLowerCase() : `${usernameInput.trim().toLowerCase()}@example.com`;
      const targetUrl = `${API_BASE_URL}/accounts/login/`;

      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email, password: password })
      });

      const data = await response.json();

      if (response.ok && data.tokens) {
        localStorage.setItem('access_token', data.tokens.access);
        localStorage.setItem('refresh_token', data.tokens.refresh);

        const isAdmin = data.user.is_superuser || data.user.is_staff || data.user.role === 'admin';

        const userSession = {
          id: data.user.id,
          email: data.user.email,
          username: data.user.username || usernameInput,
          name: data.user.full_name || data.user.first_name || usernameInput,
          role: isAdmin ? 'admin' : 'user',
          is_superuser: data.user.is_superuser || false
        };

        // Write to both session keys for 100% storage compatibility across scripts
        localStorage.setItem('rudra_session_v4', JSON.stringify(userSession));
        localStorage.setItem('rudra_carwash_session', JSON.stringify(userSession));
        
        return { success: true, role: userSession.role, user: userSession };
      } else {
        const errorMsg = data.message || 'Invalid email or password.';
        return { success: false, message: errorMsg, errors: data.errors };
      }
    } catch (err) {
      console.error('Login Error:', err);
      return { success: false, message: 'Server connection failed. Ensure backend is running.' };
    }
  },

  async adminLogin(emailInput, password) {
    try {
      const targetUrl = `${API_BASE_URL}/accounts/admin-login/`;

      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailInput, password: password })
      });

      const data = await response.json();

      if (response.ok && data.tokens) {
        const isSuper = data.user.is_superuser || data.user.role === 'admin' || data.user.is_staff;
        if (!isSuper) {
          return { success: false, message: 'Access Denied. Admin privileges required.' };
        }

        localStorage.setItem('access_token', data.tokens.access);
        localStorage.setItem('refresh_token', data.tokens.refresh);

        const userSession = {
          id: data.user.id,
          email: data.user.email,
          username: data.user.username,
          name: data.user.full_name || data.user.first_name || 'Admin',
          role: 'admin',
          is_superuser: data.user.is_superuser || true
        };

        // Write to both session keys for 100% storage compatibility across scripts
        localStorage.setItem('rudra_session_v4', JSON.stringify(userSession));
        localStorage.setItem('rudra_carwash_session', JSON.stringify(userSession));
        
        return { success: true, user: userSession };
      } else {
        const msg = data.message || (data.errors && data.errors.detail ? data.errors.detail[0] : 'Invalid email or password.');
        return { success: false, message: msg };
      }
    } catch (err) {
      console.error('Admin Login Error:', err);
      return { success: false, message: 'Server connection failed. Ensure Django backend is running.' };
    }
  },

  async register(name, usernameInput, phone, password) {
    try {
      const nameParts = name.trim().split(' ');
      const firstName = nameParts[0] || name;
      const lastName = nameParts.slice(1).join(' ') || '';

      const isEmail = usernameInput.includes('@');
      const email = isEmail ? usernameInput.trim().toLowerCase() : `${usernameInput.trim().toLowerCase()}@example.com`;

      const payload = {
        email: email,
        username: usernameInput.trim(),
        first_name: firstName,
        last_name: lastName,
        phone: phone.trim(),
        password: password,
        password_confirm: password,
        confirm_password: password
      };

      const targetUrl = `${API_BASE_URL}/accounts/register/`;

      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if ((response.status === 201 || response.ok) && (data.user || data.tokens)) {
        if (data.tokens) {
          localStorage.setItem('access_token', data.tokens.access);
          localStorage.setItem('refresh_token', data.tokens.refresh);
        }

        const userSession = {
          id: data.user ? data.user.id : null,
          email: data.user ? data.user.email : email,
          username: data.user ? data.user.username : usernameInput,
          name: data.user ? (data.user.full_name || name) : name,
          role: data.user ? data.user.role : 'user'
        };

        localStorage.setItem('rudra_session_v4', JSON.stringify(userSession));
        localStorage.setItem('rudra_carwash_session', JSON.stringify(userSession));

        return { success: true, user: userSession, data: data };
      } else {
        const errorObj = data.errors || data;
        const formattedErrors = [];
        if (typeof errorObj === 'object') {
          for (const [key, val] of Object.entries(errorObj)) {
            const valStr = Array.isArray(val) ? val.join(', ') : val;
            formattedErrors.push(`${key.replace('_', ' ')}: ${valStr}`);
          }
        } else {
          formattedErrors.push(String(errorObj));
        }

        const errorMsg = formattedErrors.join(' | ') || 'Registration failed.';
        return { success: false, message: errorMsg, errors: errorObj };
      }
    } catch (err) {
      console.error('Registration Fetch Error Exception:', err);
      return { success: false, message: 'Server connection failed.' };
    }
  },

  async logout() {
    const { refresh } = this.getTokens();
    try {
      await fetch(`${API_BASE_URL}/accounts/logout/`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ refresh: refresh || '' })
      });
    } catch (err) {
      console.warn('Logout API warning:', err);
    }

    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('rudra_session_v4');
    localStorage.removeItem('rudra_carwash_session');
    window.location.href = '/pages/admin-login.html';
  },

  requireAdmin() {
    const session = this.getCurrentUser();
    if (!session || (session.role !== 'admin' && !session.is_superuser)) {
      window.location.href = '/pages/admin-login.html';
    }
  }
};
