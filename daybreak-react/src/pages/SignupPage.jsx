import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { COUNTRIES, LANGUAGES, REGIONS, TOPICS } from '../data/options';
import { PasswordField, SelectField, TextField } from '../components/FormField';
import MultiSelect from '../components/MultiSelect';
import { ChevronLeftIcon } from '../components/Icons';
import { useForm } from '../hooks/useForm';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

const VALIDATORS = {
  username: { rule: 'username' },
  email: { rule: 'email' },
  password: { rule: 'newPassword' },
  confirmPassword: { rule: 'confirmPassword', match: 'password' },
};
const STEP_ONE_FIELDS = Object.keys(VALIDATORS);
const STEPS = 2;

/* Preselect the reader's browser language when we offer it (otherwise English) */
function defaultLanguage() {
  const code = (navigator.language || 'en').slice(0, 2);
  return LANGUAGES.some((l) => l.value === code) ? code : 'en';
}

/* Two-step signup: 1 account, 2 personalization (optional). */
export default function SignupPage() {
  useDocumentTitle('Create account');
  const [step, setStep] = useState(1);
  const [languages, setLanguages] = useState(() => [defaultLanguage()]);
  const [topics, setTopics] = useState([]);
  const titleRefs = [useRef(null), useRef(null)];

  const form = useForm({
    initial: { username: '', email: '', password: '', confirmPassword: '', country: '', region: '' },
    validators: VALIDATORS,
  });
  const { values, run, validate, bind, errors } = form;
  const regionList = REGIONS[values.country] || [];

  /* Move focus to the new step's title (not on first render) */
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return; }
    window.scrollTo(0, 0);
    titleRefs[step - 1].current?.focus({ preventScroll: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const submitToApi = (skipOptional) => async (v) => {
    const payload = { username: v.username, email: v.email, password: v.password };   // the server only needs the password once
    if (!skipOptional) Object.assign(payload, { country: v.country, region: v.region, languages, topics });
    // Example: return fetch('/api/signup', { method: 'POST', body: JSON.stringify(payload) })
    await new Promise((resolve, reject) => {
      setTimeout(() => reject(new Error('Demo only: connect this form to your signup API.')), 1200);
    });
    return payload;
  };

  /* Step 1: Enter or "Continue" moves to step 2 instead of submitting */
  const handleSubmit = (event) => {
    event.preventDefault();
    if (step === 1) {
      if (validate(STEP_ONE_FIELDS)) setStep(2);
      return;
    }
    if (validate()) run(submitToApi(false));
  };

  return (
    <main className="auth-page auth-page--single">
      <section className="auth-panel auth-panel--solo">
        <div className="auth-card">

          <div className="signup-progress">
            <p className="signup-progress__label" aria-live="polite">Step {step} of {STEPS}</p>
            <div className="signup-progress__bar" aria-hidden="true">
              {[1, 2].map((n) => <span key={n} className={`signup-progress__segment${n <= step ? ' is-done' : ''}`} />)}
            </div>
          </div>

          <form className="form" noValidate ref={form.formRef} onSubmit={handleSubmit}>

            {/* Step 1: account */}
            <div className="signup-step" hidden={step !== 1}>
              <div className="signup-step__header">
                <h1 className="auth-card__title" ref={titleRefs[0]} tabIndex={-1}>Create your account</h1>
                <p className="auth-card__subtitle">It takes a minute. You can change these details later.</p>
              </div>

              <TextField label="Username" id="signup-username" type="text" placeholder="e.g. alex_reads"
                         autoComplete="username" autoCapitalize="none" spellCheck={false} required
                         {...bind('username')} error={errors.username} />
              <TextField label="Email" id="signup-email" type="email" placeholder="you@example.com"
                         autoComplete="email" inputMode="email" autoCapitalize="none" required
                         {...bind('email')} error={errors.email} />
              <PasswordField label="Password" id="signup-password" placeholder="At least 8 characters, with a number"
                             autoComplete="new-password" required {...bind('password')} error={errors.password} />
              <PasswordField label="Verify password" id="signup-confirm-password" placeholder="Enter the password again"
                             autoComplete="new-password" required {...bind('confirmPassword')} error={errors.confirmPassword} />

              <button className="btn btn--primary" type="submit">Continue</button>
            </div>

            {/* Step 2: personalization (optional) */}
            <div className="signup-step" hidden={step !== 2}>
              <button className="signup-step__back" type="button" onClick={() => setStep(1)}>
                <ChevronLeftIcon size={16} /> Back
              </button>

              <div className="signup-step__header">
                <h1 className="auth-card__title" ref={titleRefs[1]} tabIndex={-1}>Make Daybreak yours</h1>
                <p className="auth-card__subtitle">Tell us a little so your feed starts with stories you care about. You can change this anytime.</p>
              </div>

              <SelectField label="Country" id="signup-country" placeholder="Select your country" autoComplete="country"
                           options={COUNTRIES} name="country" value={values.country}
                           onChange={(e) => { form.setValue('country', e.target.value); form.setValue('region', ''); }} />
              <SelectField label="State or region" id="signup-region" autoComplete="address-level1" name="region"
                           placeholder={regionList.length ? 'Choose a state or region' : 'Select a country first'}
                           options={regionList.map((r) => ({ value: r, label: r }))}
                           disabled={!regionList.length} value={values.region}
                           onChange={(e) => form.setValue('region', e.target.value)} />

              <MultiSelect legend="Reading languages" hint="(choose one or more)" placeholder="Add a language…"
                           options={LANGUAGES} values={languages} onChange={setLanguages} />

              <hr className="form-divider" />

              <MultiSelect legend="Topics you like" hint="(pick a few)" placeholder="Add a topic…"
                           options={TOPICS} values={topics} onChange={setTopics} />

              <p className="form__error" role="alert">{form.formError}</p>
              <button className="btn btn--primary" type="submit" disabled={form.loading}>
                {form.loading ? 'Creating account…' : 'Create account'}
              </button>
              <button className="btn btn--text" type="button" disabled={form.loading}
                      onClick={() => { if (validate()) run(submitToApi(true)); }}>
                Skip for now
              </button>
            </div>
          </form>

          <p className="auth-switch">Already have an account? <Link className="text-link" to="/login">Log in</Link></p>
        </div>
      </section>
    </main>
  );
}
