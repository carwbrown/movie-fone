/**
 * Movie Card Web Component
 * Displays a movie poster with title and basic info
 */

class MovieCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._movie = null;
    this._userMovie = null;
  }

  set movie(data) {
    this._movie = data;
    this.render();
  }

  set userMovie(data) {
    this._userMovie = data;
    this.render();
  }

  connectedCallback() {
    if (this._movie) this.render();
  }

  render() {
    const m = this._movie || {};
    const um = this._userMovie || {};

    const posterUrl = m.poster_path
      ? `https://image.tmdb.org/t/p/w500${m.poster_path}`
      : 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 450"><rect fill="%23112240" width="300" height="450"/><text fill="%238892b0" x="50%" y="50%" text-anchor="middle" dy=".3em" font-size="20">No Poster</text></svg>';

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
        }

        .card {
          background: var(--bg-secondary, #112240);
          border-radius: 8px;
          overflow: hidden;
          transition: transform 0.2s, box-shadow 0.2s;
          cursor: pointer;
        }

        .card:hover {
          transform: translateY(-4px);
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
        }

        .poster {
          width: 100%;
          aspect-ratio: 2/3;
          object-fit: cover;
          display: block;
        }

        .info {
          padding: 1rem;
        }

        .title {
          color: var(--text-primary, #ccd6f6);
          font-size: 1rem;
          font-weight: 600;
          margin: 0 0 0.5rem 0;
          line-height: 1.3;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .meta {
          color: var(--text-secondary, #8892b0);
          font-size: 0.875rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .year {
          color: var(--text-secondary, #8892b0);
        }

        .rating {
          color: var(--accent, #64ffda);
          font-weight: 500;
        }

        .watched-badge {
          position: absolute;
          top: 0.5rem;
          right: 0.5rem;
          background: var(--accent, #64ffda);
          color: var(--bg-primary, #0a192f);
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .card-wrapper {
          position: relative;
        }

        .category {
          color: var(--accent, #64ffda);
          font-size: 0.75rem;
          margin-top: 0.5rem;
        }
      </style>

      <div class="card-wrapper">
        <div class="card">
          ${um.watched ? '<div class="watched-badge">Watched</div>' : ''}
          <img class="poster" src="${posterUrl}" alt="${m.title || 'Movie poster'}" loading="lazy">
          <div class="info">
            <h3 class="title">${m.title || 'Unknown Title'}</h3>
            <div class="meta">
              <span class="year">${m.year || m.release_date?.split('-')[0] || ''}</span>
              ${m.rating ? `<span class="rating">★ ${m.rating.toFixed(1)}</span>` : ''}
            </div>
            ${um.category ? `<div class="category">${um.category}</div>` : ''}
          </div>
        </div>
      </div>
    `;
  }
}

customElements.define('movie-card', MovieCard);

export { MovieCard };
