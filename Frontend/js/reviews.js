/* ==========================================================================
   CUSTOMER REVIEWS & RATING HANDLER (API CONNECTED)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  renderReviewsList();
  initReviewForm();
});

async function renderReviewsList() {
  const container = document.getElementById('reviews-wall-container');
  if (!container) return;

  const reviews = await Store.getReviews();

  if (!reviews.length) {
    container.innerHTML = `<div class="text-center" style="grid-column: 1/-1; padding: 2rem; color: var(--text-muted);">No customer reviews published yet. Be the first to add a review!</div>`;
    return;
  }

  container.innerHTML = reviews.map(r => {
    const stars = Array(5).fill(0).map((_, i) => 
      `<i class="fa-${i < r.rating ? 'solid' : 'regular'} fa-star" style="color: var(--accent-yellow);"></i>`
    ).join('');

    const authorName = r.name || 'Customer';

    return `
      <div class="review-card">
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
          <div class="review-stars">${stars}</div>
          <span style="font-size: 0.78rem; color: var(--text-muted);">${r.date}</span>
        </div>
        <p class="review-text">"${r.comment}"</p>
        <div style="display: flex; align-items: center; gap: 0.6rem; margin-top: 0.65rem;">
          <div style="width: 28px; height: 28px; border-radius: 50%; background: var(--accent-yellow-light); color: var(--accent-yellow); font-weight: 800; font-size: 0.8rem; display: flex; align-items: center; justify-content: center;">
            ${authorName.charAt(0).toUpperCase()}
          </div>
          <div>
            <strong class="review-author" style="font-size: 0.85rem; color: var(--primary-dark-slate);">${authorName}</strong>
            <span style="font-size: 0.75rem; color: var(--accent-yellow); display: block;">Narasaraopet Customer</span>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

let selectedRating = 5;

function initReviewForm() {
  const form = document.getElementById('review-form');
  const starsContainer = document.getElementById('star-rating-input');

  if (starsContainer) {
    starsContainer.innerHTML = [1,2,3,4,5].map(star => 
      `<i class="fa-solid fa-star star-opt" data-rating="${star}" style="font-size: 1.35rem; color: var(--accent-yellow); cursor: pointer; margin-right: 0.25rem;"></i>`
    ).join('');

    starsContainer.querySelectorAll('.star-opt').forEach(starEl => {
      starEl.addEventListener('click', () => {
        selectedRating = parseInt(starEl.getAttribute('data-rating'));
        starsContainer.querySelectorAll('.star-opt').forEach((s, idx) => {
          if (idx < selectedRating) {
            s.classList.replace('fa-regular', 'fa-solid');
          } else {
            s.classList.replace('fa-solid', 'fa-regular');
          }
        });
      });
    });
  }

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      if (!Auth.getCurrentUser()) {
        showToast('Please Login before submitting a review!', 'warning');
        setTimeout(() => window.location.href = 'login.html', 1200);
        return;
      }

      const comment = document.getElementById('review-comment').value;

      const result = await Store.addReview({
        rating: selectedRating,
        comment: comment
      });

      if (result.success) {
        showToast('Thank you! Your doorstep wash review has been submitted for approval.', 'success');
        form.reset();
        await renderReviewsList();
      } else {
        showToast(result.message || 'Failed to submit review.', 'error');
      }
    });
  }
}
