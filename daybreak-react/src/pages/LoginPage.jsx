import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { PasswordField, TextField } from '../components/FormField';
import { AppleIcon, GoogleIcon } from '../components/Icons';
import { useAuth } from '../auth/AuthContext';
import { useForm } from '../hooks/useForm';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

const VALIDATORS = { email: { rule: 'email' }, password: { rule: 'password' } };

export default function LoginPage() {
  useDocumentTitle('Log in');
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [remember, setRemember] = useState(false);

  const form = useForm({
    initial: { email: '', password: '' },
    validators: VALIDATORS,
    onSubmit: async (values) => {
      // Throws an Error with the server's message (e.g. "Incorrect email or password.") that useForm shows.
      await login({ email: values.email, password: values.password, remember });
      navigate(location.state?.from?.pathname || '/dashboard', { replace: true });
    },
  });

  return (
    <>
      {/* Extra small screens only: brand flash, then the form */}
      <div className="splash" aria-hidden="true"><span className="splash__logo">Daybreak</span></div>

      <main className="auth-page">
        {/* Brand panel: hidden on extra small screens */}
        <section className="auth-brand">
          <div className="auth-brand__logo">Daybreak</div>
          <div className="auth-brand__body">
            <h1 className="auth-brand__headline">Catch up on the day in five minutes.</h1>
            <p className="auth-brand__text">Log in to follow your topics, save stories for later, and read offline on the commute.</p>
          </div>
          <p className="auth-brand__footnote">Independent reporting from 400+ publishers.</p>
        </section>

        {/* Login form */}
        <section className="auth-panel">
          <div className="auth-card">
            <h2 className="auth-card__title">Welcome back</h2>
            <p className="auth-card__subtitle">Log in to pick up where you left off.</p>

            <form className="form" noValidate ref={form.formRef} onSubmit={form.handleSubmit}>
              <TextField label="Email" id="login-email" type="email" placeholder="you@example.com"
                         autoComplete="email" inputMode="email" autoCapitalize="none" required
                         {...form.bind('email')} error={form.errors.email} />

              <PasswordField label="Password" id="login-password" placeholder="At least 8 characters"
                             autoComplete="current-password" required
                             labelAside={<a className="text-link" href="#" onClick={(e) => e.preventDefault()}>Forgot password?</a>}
                             {...form.bind('password')} error={form.errors.password} />

              <label className="form-check">
                <input className="form-check__box" type="checkbox" name="remember"
                       checked={remember} onChange={(e) => setRemember(e.target.checked)} /> Keep me logged in on this device
              </label>

              <p className="form__error" role="alert">{form.formError}</p>
              <button className="btn btn--primary" type="submit" disabled={form.loading}>
                {form.loading ? 'Logging in…' : 'Log in'}
              </button>
            </form>

            <div className="divider">or</div>

            <div className="auth-social">
              <button className="btn btn--outline" type="button"><GoogleIcon /> Continue with Google</button>
              <button className="btn btn--outline" type="button"><AppleIcon /> Continue with Apple</button>
            </div>

            <p className="auth-switch">New to Daybreak? <Link className="text-link" to="/signup">Create an account</Link></p>
          </div>
        </section>
      </main>
    </>
  );
}
