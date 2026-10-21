import { useState } from 'react';
import { COUNTRIES, LANGUAGES, REGIONS, TOPICS } from '../data/options';
import { PasswordField, SelectField } from '../components/FormField';
import MultiSelect from '../components/MultiSelect';
import { useForm } from '../hooks/useForm';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

const PASSWORD_VALIDATORS = {
  currentPassword: { rule: 'password' },
  newPassword: { rule: 'newPassword' },
  confirmPassword: { rule: 'confirmPassword', match: 'newPassword' },
};

/* Preferences (stored in localStorage "daybreak:prefs", pre-filled on load) + password.
   Replace the onSubmit bodies with your API calls. */
export default function SettingsPage() {
  useDocumentTitle('Settings');
  const [prefs, setPrefs] = useLocalStorage('daybreak:prefs', {});
  const saved = prefs && typeof prefs === 'object' ? prefs : {};

  /* ---------- Preferences ---------- */
  const [languages, setLanguages] = useState(saved.languages || []);
  const [topics, setTopics] = useState(saved.topics || []);
  const [prefsSuccess, setPrefsSuccess] = useState('');

  const prefsForm = useForm({
    initial: {
      country: saved.country || '',
      region: saved.country && (REGIONS[saved.country] || []).includes(saved.region) ? saved.region : '',
    },
    onSubmit: async (values) => {
      setPrefs({ country: values.country || '', region: values.region || '', languages, topics });
      // Example: return fetch('/api/preferences', { method: 'PUT', body: JSON.stringify(prefs) })
      setPrefsSuccess('Preferences saved.');
    },
  });
  const regionList = REGIONS[prefsForm.values.country] || [];

  /* ---------- Password ---------- */
  const [passSuccess, setPassSuccess] = useState('');
  const passForm = useForm({
    initial: { currentPassword: '', newPassword: '', confirmPassword: '' },
    validators: PASSWORD_VALIDATORS,
    onSubmit: () => new Promise((resolve, reject) => {
      // Example: return fetch('/api/password', { method: 'POST', body: JSON.stringify({ currentPassword, newPassword }) })
      setTimeout(() => reject(new Error('Demo only: connect this form to your change-password API.')), 800);
    }),
  });

  /* Clear the "saved" message as soon as something changes again */
  const clearOn = (setter) => ({
    onChange: () => setter(''),
    onInput: () => setter(''),
    onClick: (e) => { if (e.target.closest('.chip__remove')) setter(''); },
  });

  return (
    <section className="news-feed settings" aria-labelledby="settings-title">
      <header className="news-feed__header">
        <h1 className="news-feed__title" id="settings-title" tabIndex={-1}>Settings</h1>
        <p className="news-feed__status">Manage your preferences and password.</p>
      </header>

      {/* Preferences */}
      <form className="settings-card form" data-settings-form="preferences" noValidate
            ref={prefsForm.formRef} onSubmit={prefsForm.handleSubmit} {...clearOn(setPrefsSuccess)}>
        <h2 className="settings-card__title">Preferences</h2>
        <p className="settings-card__text">These shape the stories in your feed.</p>

        <SelectField label="Country" id="settings-country" placeholder="Select your country" autoComplete="country"
                     options={COUNTRIES} name="country" value={prefsForm.values.country}
                     onChange={(e) => { prefsForm.setValue('country', e.target.value); prefsForm.setValue('region', ''); }} />
        <SelectField label="State or region" id="settings-region" autoComplete="address-level1" name="region"
                     placeholder={regionList.length ? 'Choose a state or region' : 'Select a country first'}
                     options={regionList.map((r) => ({ value: r, label: r }))}
                     disabled={!regionList.length} value={prefsForm.values.region}
                     onChange={(e) => prefsForm.setValue('region', e.target.value)} />

        <MultiSelect legend="Reading languages" hint="(choose one or more)" placeholder="Add a language…"
                     options={LANGUAGES} values={languages} onChange={setLanguages} />
        <MultiSelect legend="Categories" hint="(pick a few)" placeholder="Add a category…"
                     options={TOPICS} values={topics} onChange={setTopics} />

        <p className="form__error" role="alert">{prefsForm.formError}</p>
        <p className="form__success" role="status">{prefsSuccess}</p>
        <button className="btn btn--primary settings-card__submit" type="submit" disabled={prefsForm.loading}>
          {prefsForm.loading ? 'Saving…' : 'Save preferences'}
        </button>
      </form>

      {/* Password */}
      <form className="settings-card form" data-settings-form="password" noValidate
            ref={passForm.formRef} onSubmit={passForm.handleSubmit} {...clearOn(setPassSuccess)}>
        <h2 className="settings-card__title">Password</h2>
        <p className="settings-card__text">Use at least 8 characters, with a letter and a number.</p>

        <PasswordField label="Current password" id="settings-current-password" placeholder="Enter your current password"
                       autoComplete="current-password" required {...passForm.bind('currentPassword')} error={passForm.errors.currentPassword} />
        <PasswordField label="New password" id="settings-new-password" placeholder="At least 8 characters, with a number"
                       autoComplete="new-password" required {...passForm.bind('newPassword')} error={passForm.errors.newPassword} />
        <PasswordField label="Verify new password" id="settings-confirm-password" placeholder="Enter the new password again"
                       autoComplete="new-password" required {...passForm.bind('confirmPassword')} error={passForm.errors.confirmPassword} />

        <p className="form__error" role="alert">{passForm.formError}</p>
        <p className="form__success" role="status">{passSuccess}</p>
        <button className="btn btn--primary settings-card__submit" type="submit" disabled={passForm.loading}>
          {passForm.loading ? 'Updating…' : 'Update password'}
        </button>
      </form>
    </section>
  );
}
