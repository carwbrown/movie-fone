/**
 * Login Form Web Component
 * Handles both login and registration
 */

import { login, register } from '../scripts/auth.js';

class LoginForm extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._mode = 'login'; // 'login' or 'register'
  }

  connectedCallback() {
    this.render();
    this.attachEventListeners();
  }

  toggleMode() {
    this._mode = this._mode === 'login' ? 'register' : 'login';
    this.render();
    this.attachEventListeners();
  }

  attachEventListeners() {
    const form = this.shadowRoot.querySelector('form');
    const toggle = this.shadowRoot.querySelector('.toggle-mode');

    form?.addEventListener('submit', (e) => this.handleSubmit(e));
    toggle?.addEventListener('click', () => this.toggleMode());
  }

  async handleSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const errorDiv = this.shadowRoot.querySelector('.error');

    const email = form.email.value;
    const password = form.password.value;

    submitBtn.disabled = true;
    submitBtn.textContent = this._mode === 'login' ? 'Signing in...' : 'Creating account...';
    errorDiv.textContent = '';

    let result;
    if (this._mode === 'login') {
      result = await login(email, password);
    } else {
      const passwordConfirm = form.passwordConfirm.value;
      if (password !== passwordConfirm) {
        errorDiv.textContent = 'Passwords do not match';
        submitBtn.disabled = false;
        submitBtn.textContent = 'Create Account';
        return;
      }
      result = await register(email, password, passwordConfirm);
    }

    if (result.success) {
      window.location.href = '/app.html';
    } else {
      errorDiv.textContent = result.error;
      submitBtn.disabled = false;
      submitBtn.textContent = this._mode === 'login' ? 'Sign In' : 'Create Account';
    }
  }

  render() {
    const isLogin = this._mode === 'login';

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          max-width: 400px;
          margin: 0 auto;
        }

        .form-container {
          background: var(--bg-secondary, #112240);
          padding: 2rem;
          border-radius: 8px;
          box-shadow: 0 10px 30px -15px rgba(2, 12, 27, 0.7);
        }

        h2 {
          color: var(--text-primary, #ccd6f6);
          margin: 0 0 1.5rem 0;
          text-align: center;
          font-size: 1.5rem;
        }

        .form-group {
          margin-bottom: 1rem;
        }

        label {
          display: block;
          color: var(--text-secondary, #8892b0);
          margin-bottom: 0.5rem;
          font-size: 0.875rem;
        }

        input {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid rgba(100, 255, 218, 0.2);
          border-radius: 4px;
          background: var(--bg-primary, #0a192f);
          color: var(--text-primary, #ccd6f6);
          font-size: 1rem;
          box-sizing: border-box;
        }

        input:focus {
          outline: none;
          border-color: var(--accent, #64ffda);
        }

        button[type="submit"] {
          width: 100%;
          padding: 0.75rem;
          background: transparent;
          border: 1px solid var(--accent, #64ffda);
          color: var(--accent, #64ffda);
          font-size: 1rem;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.25s ease;
          margin-top: 1rem;
        }

        button[type="submit"]:hover:not(:disabled) {
          background: rgba(100, 255, 218, 0.1);
        }

        button[type="submit"]:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .error {
          color: #ff6b6b;
          font-size: 0.875rem;
          margin-top: 1rem;
          text-align: center;
          min-height: 1.25rem;
        }

        .toggle-mode {
          text-align: center;
          margin-top: 1.5rem;
          color: var(--text-secondary, #8892b0);
          font-size: 0.875rem;
        }

        .toggle-mode a {
          color: var(--accent, #64ffda);
          cursor: pointer;
          text-decoration: none;
        }

        .toggle-mode a:hover {
          text-decoration: underline;
        }
      </style>

      <div class="form-container">
        <h2>${isLogin ? 'Sign In' : 'Create Account'}</h2>
        <form>
          <div class="form-group">
            <label for="email">Email</label>
            <input type="email" id="email" name="email" required>
          </div>
          <div class="form-group">
            <label for="password">Password</label>
            <input type="password" id="password" name="password" required minlength="8">
          </div>
          ${!isLogin ? `
          <div class="form-group">
            <label for="passwordConfirm">Confirm Password</label>
            <input type="password" id="passwordConfirm" name="passwordConfirm" required minlength="8">
          </div>
          ` : ''}
          <button type="submit">${isLogin ? 'Sign In' : 'Create Account'}</button>
        </form>
        <div class="error"></div>
        <div class="toggle-mode">
          ${isLogin
            ? "Don't have an account? <a class=\"toggle-mode\">Sign up</a>"
            : 'Already have an account? <a class="toggle-mode">Sign in</a>'}
        </div>
      </div>
    `;
  }
}

customElements.define('login-form', LoginForm);

export { LoginForm };
