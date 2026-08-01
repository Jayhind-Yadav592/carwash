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
    title: 'Exterior Foam & Water Wash',
    category: 'Doorstep Package 1',
    price: 400,
    duration: '1.5 Hours',
    description: 'High-pressure foam wash, pressure water rinse, wheel rim cleaning & microfiber hand dry at your doorstep.',
    icon: 'fa-soap',
    badge: 'Standard Wash',
    image: '../images/car 2.jpeg'
  },
  {
    id: 'srv-foam-vacuum',
    title: 'Foam Wash + Vacuum Cleaning',
    category: 'Doorstep Package 2',
    price: 500,
    duration: '1.5 Hours',
    description: 'Foam & pressure water exterior wash plus complete cabin & trunk vacuum cleaning.',
    icon: 'fa-sparkles',
    badge: 'Best Value',
    image: '../images/car 3.jpeg'
  },
  {
    id: 'srv-complete-spa',
    title: 'Full Spa & Interior Sanitization',
    category: 'Doorstep Package 3',
    price: 600,
    duration: '1.5 Hours',
    description: 'Complete foam & water wash, full interior sanitization, dashboard dressing, seat steam cleaning & deep black tyre polish.',
    icon: 'fa-crown',
    badge: 'Full Spa',
    image: '../images/car 4.jpeg'
  },
  {
    id: 'srv-exterior-wash',
    title: 'High-Pressure Exterior Jet Wash',
    category: 'Exterior Care',
    price: 350,
    duration: '1.0 Hour',
    description: 'Targeted exterior mud removal, high-pressure water jet rinse, and streak-free glass wiping.',
    icon: 'fa-shower',
    badge: 'Exterior Only',
    image: '../images/car 1.jpg'
  },
  {
    id: 'srv-ceramic-coating',
    title: 'Ceramic Coating & Paint Polish',
    category: 'Paint Protection',
    price: 1200,
    duration: '2.5 Hours',
    description: 'Premium hydrophobic ceramic wax coating for mirror shine and long-lasting UV paint protection.',
    icon: 'fa-gem',
    badge: 'Premium Detailing',
    image: '../images/car 5.jpeg'
  },
  {
    id: 'srv-engine-cleaning',
    title: 'Engine Bay & Underbody Jet Cleaning',
    category: 'Deep Care',
    price: 450,
    duration: '1.2 Hours',
    description: 'High-pressure engine compartment degreasing and underbody mud flush.',
    icon: 'fa-gears',
    badge: 'Engine Care',
    image: '../images/car 6.jpeg'
  },
  {
    id: 'srv-waterless-wash',
    title: 'Waterless Eco Express Wash',
    category: 'Eco Wash',
    price: 300,
    duration: '45 Mins',
    description: 'Eco-friendly waterless polymer spray wash and microfiber buffing for quick shine.',
    icon: 'fa-leaf',
    badge: 'Eco Friendly',
    image: '../images/car 7.jpeg'
  },
  {
    id: 'srv-tyre-rim-care',
    title: 'Wheel Rim & Deep Black Tyre Polish',
    category: 'Wheel Care',
    price: 250,
    duration: '30 Mins',
    description: 'Brake dust removal, alloy rim polishing, and silicone-based deep black tyre gloss dressing.',
    icon: 'fa-circle-dot',
    badge: 'Tyre Care',
    image: '../images/car 8.jpeg'
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
            '../images/car 2.jpeg',
            '../images/car 3.jpeg',
            '../images/car 4.jpeg',
            '../images/car 1.jpg',
            '../images/car 5.jpeg',
            '../images/car 6.jpeg',
            '../images/car 7.jpeg',
            '../images/car 8.jpeg'
          ];
          return results.map((s, idx) => {
            let img = s.image;
            if (!img || img.trim() === '') {
              const priceNum = Math.round(parseFloat(s.price || 0));
              if (priceNum === 400) img = '../images/car 2.jpeg';
              else if (priceNum === 500) img = '../images/car 3.jpeg';
              else if (priceNum === 600) img = '../images/car 4.jpeg';
              else img = defaultImgs[idx % defaultImgs.length];
            } else if (!img.startsWith('http') && !img.startsWith('../') && !img.startsWith('/')) {
              img = '../' + img;
            }
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
