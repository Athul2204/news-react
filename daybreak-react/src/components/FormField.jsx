import { useId, useState } from 'react';
import { EyeIcon } from './Icons';

/* Label + input + error slot. `labelAside` puts extra content (e.g. "Forgot password?")
   on the label row. Spread useForm().bind(name) onto it. */
export function TextField({ label, error, labelAside, id, ...inputProps }) {
  const auto = useId();
  const inputId = id || auto;
  const labelEl = <label className="form-field__label" htmlFor={inputId}>{label}</label>;
  return (
    <div className="form-field">
      {labelAside ? <div className="form-field__label-row">{labelEl}{labelAside}</div> : labelEl}
      <input className="form-field__input" id={inputId} {...inputProps} />
      <p className="form-field__error" aria-live="polite">{error}</p>
    </div>
  );
}

/* Password input with a show / hide button */
export function PasswordField({ label, error, labelAside, id, ...inputProps }) {
  const auto = useId();
  const inputId = id || auto;
  const [shown, setShown] = useState(false);
  const labelEl = <label className="form-field__label" htmlFor={inputId}>{label}</label>;
  return (
    <div className="form-field">
      {labelAside ? <div className="form-field__label-row">{labelEl}{labelAside}</div> : labelEl}
      <div className="form-field__control">
        <input className="form-field__input form-field__input--password" id={inputId}
               type={shown ? 'text' : 'password'} {...inputProps} />
        <button className="password-toggle" type="button" onClick={() => setShown((s) => !s)}
                aria-label={shown ? 'Hide password' : 'Show password'} aria-pressed={shown}>
          <EyeIcon />
        </button>
      </div>
      <p className="form-field__error" aria-live="polite">{error}</p>
    </div>
  );
}

/* Plain <select> in a form-field. Options: [{ value, label }] */
export function SelectField({ label, options, placeholder, id, ...selectProps }) {
  const auto = useId();
  const selectId = id || auto;
  return (
    <div className="form-field">
      <label className="form-field__label" htmlFor={selectId}>{label}</label>
      <select className="form-field__input form-field__input--select" id={selectId} {...selectProps}>
        <option value="">{placeholder}</option>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}
