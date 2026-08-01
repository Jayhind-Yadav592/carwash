/* ==========================================================================
   RUDRA DOORSTEP EXPRESS - REST API STATE STORE & DATA ENGINE
   Connects to Django REST Framework backend using Fetch API.
   ========================================================================== */

const STORAGE_KEYS = {
  SERVICES: 'rudra_services_v4',
  BOOKINGS: 'rudra_bookings_v4',
  USERS: 'rudra_users_v4',
  REVIEWS: 'rudra_reviews_v4',
  SESSION: 'rudra_session_v4',
  NOTIFICATIONS: 'rudra_notifications_v4'
};

const DEFAULT_SERVICES = [
  {
    id: 'srv-foam-water',
    title: 'Foam & Water Wash',
    category: 'Doorstep Package 1',
    price: 400,
    duration: '45 mins',
    description: 'High-pressure foam wash, pressure water rinse, wheel rim cleaning & microfiber hand dry at your doorstep.',
    icon: 'fa-soap',
    badge: 'Standard Wash',
    image: '../images/car 10.jpeg'
  },
  {
    id: 'srv-foam-vacuum',
    title: 'Water & Foam Wash + Vacuum',
    category: 'Doorstep Package 2',
    price: 500,
    duration: '60 mins',
    description: 'Foam & pressure water exterior wash plus complete cabin & trunk vacuum cleaning.',
    icon: 'fa-sparkles',
    badge: 'Best Value',
    image: '../images/car 12.png'
  },
  {
    id: 'srv-complete-spa',
    title: 'Complete Wash + Vacuum + Interior + Tyre Polish',
    category: 'Doorstep Package 3',
    price: 600,
    duration: '75 mins',
    description: 'Complete foam & water wash, full interior sanitization, dashboard dressing, seat steam cleaning & deep black tyre polish.',
    icon: 'fa-crown',
    badge: 'Full Spa',
    image: '../images/car 16.png'
  }
];

const Store = {
  init() {
    // Session state check
  },

  async getServices() {
    try {
      const response = await fetch(`${API_BASE_URL}/services/`);
      if (response.ok) {
        const data = await response.json();
        const results = Array.isArray(data) ? data : (data.results || []);
        if (results.length > 0) {
          const defaultImgs = [
            '../images/car 10.jpeg?v=2',
            '../images/car 12.png?v=2',
            '../images/car 16.png?v=2'
          ];
          return results.map((s, idx) => {
            const priceNum = Math.round(parseFloat(s.price || 0));
            let img = '../images/car 10.jpeg?v=2';
            if (priceNum === 400 || s.id === 'srv-foam-water') img = '../images/car 10.jpeg?v=2';
            else if (priceNum === 500 || s.id === 'srv-foam-vacuum') img = '../images/car 12.png?v=2';
            else if (priceNum === 600 || s.id === 'srv-complete-spa') img = '../images/car 16.png?v=2';
            else img = defaultImgs[idx % defaultImgs.length];

            return {
              id: s.id,
              title: s.name,
              category: 'Doorstep Package',
              price: parseFloat(s.price),
              duration: `${s.duration || 90} mins`,
              description: s.description,
              image: img,
              badge: 'Package'
            };
          });
        }
      }
    } catch (err) {
      console.warn('API getServices failed, using default services:', err);
    }
    return DEFAULT_SERVICES;
  },

  async getBookings() {
    try {
      const headers = Auth.getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/bookings/`, { headers });
      if (response.ok) {
        const data = await response.json();
        const results = Array.isArray(data) ? data : (data.results || []);
        return results.map(b => ({
          id: b.id.toString(),
          customerName: b.user_email ? b.user_email.split('@')[0] : 'Customer',
          email: b.user_email || '',
          phone: b.phone || '',
          address: b.address || '',
          vehicleType: b.vehicle_type,
          vehicleModel: b.vehicle_model,
          vehicleNo: b.vehicle_number,
          serviceId: b.service,
          serviceName: b.service_name || 'Car Wash Service',
          totalPrice: parseFloat(b.service_price || 0),
          date: b.booking_date,
          slotTime: b.booking_time,
          status: b.status,
          createdAt: b.created_at
        }));
      }
    } catch (err) {
      console.warn('API getBookings failed:', err);
    }
    return [];
  },

  async addBooking(bookingData) {
    try {
      const headers = Auth.getAuthHeaders();
      const payload = {
        service: bookingData.serviceId,
        vehicle_type: bookingData.vehicleType || 'Sedan',
        vehicle_brand: bookingData.vehicleBrand || 'Brand',
        vehicle_model: bookingData.vehicleModel || 'Model',
        vehicle_number: bookingData.vehicleNo,
        address: bookingData.address,
        booking_date: bookingData.date,
        booking_time: bookingData.slotTime,
        notes: bookingData.notes || ''
      };

      const response = await fetch(`${API_BASE_URL}/bookings/`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      const resData = await response.json();

      if (response.ok) {
        return { success: true, booking: resData.booking || resData };
      } else {
        const msg = Object.values(resData).flat().join(' ') || 'Booking creation failed.';
        return { success: false, message: msg };
      }
    } catch (err) {
      console.error('API addBooking error:', err);
      return { success: false, message: 'Server error while submitting booking.' };
    }
  },

  async updateBookingStatus(id, newStatus) {
    try {
      const headers = Auth.getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/bookings/${id}/update_status/`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ status: newStatus })
      });
      return response.ok;
    } catch (err) {
      console.error('API updateBookingStatus error:', err);
      return false;
    }
  },

  async deleteBooking(id) {
    try {
      const headers = Auth.getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/bookings/${id}/`, {
        method: 'DELETE',
        headers
      });
      return response.ok;
    } catch (err) {
      console.error('API deleteBooking error:', err);
      return false;
    }
  },

  async getReviews() {
    try {
      const response = await fetch(`${API_BASE_URL}/reviews/`);
      if (response.ok) {
        const data = await response.json();
        const results = Array.isArray(data) ? data : (data.results || []);
        return results.map(r => ({
          id: r.id,
          name: r.user_name || r.user_email || 'Customer',
          rating: r.rating,
          date: r.created_at ? r.created_at.split('T')[0] : '',
          comment: r.review,
          approved: r.approved
        }));
      }
    } catch (err) {
      console.warn('API getReviews failed:', err);
    }
    return [];
  },

  async addReview(reviewData) {
    try {
      const headers = Auth.getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/reviews/`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          rating: reviewData.rating,
          review: reviewData.comment
        })
      });

      const resData = await response.json();
      if (response.ok) {
        return { success: true, review: resData };
      } else {
        const msg = Object.values(resData).flat().join(' ') || 'Review submission failed.';
        return { success: false, message: msg };
      }
    } catch (err) {
      console.error('API addReview error:', err);
      return { success: false, message: 'Server error while submitting review.' };
    }
  },

  async getGallery() {
    try {
      const response = await fetch(`${API_BASE_URL}/gallery/`);
      if (response.ok) {
        const data = await response.json();
        return Array.isArray(data) ? data : (data.results || []);
      }
    } catch (err) {
      console.warn('API getGallery failed:', err);
    }
    return [];
  },

  async getDashboardMetrics() {
    try {
      const headers = Auth.getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/dashboard/`, { headers });
      if (response.ok) {
        return await response.json();
      }
    } catch (err) {
      console.warn('API getDashboardMetrics failed:', err);
    }
    return null;
  },

  async submitContact(contactData) {
    try {
      const response = await fetch(`${API_BASE_URL}/contact/submit/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: contactData.name,
          email: contactData.email || `${contactData.name.toLowerCase().replace(/\s+/g, '')}@example.com`,
          phone: contactData.phone,
          subject: `Contact Inquiry from ${contactData.address || 'Narasaraopet'}`,
          message: contactData.message
        })
      });

      const resData = await response.json();
      if (response.ok) {
        return { success: true, data: resData };
      } else {
        const msg = Object.values(resData).flat().join(' ') || 'Contact submission failed.';
        return { success: false, message: msg };
      }
    } catch (err) {
      console.error('API submitContact error:', err);
      return { success: false, message: 'Server error submitting contact form.' };
    }
  }
};

Store.init();
