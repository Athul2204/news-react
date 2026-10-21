import { useId, useRef } from 'react';
import { CloseIcon } from './Icons';

/* Select box that collects choices as removable chips.
   options: [{ value, label, native? }]   values: string[]   onChange(nextValues)
   Chosen options are hidden from the dropdown until their chip is removed. */
export default function MultiSelect({ legend, hint, placeholder, options, values, onChange }) {
  const selectRef = useRef(null);
  const id = useId();

  const add = (value) => {
    if (!value || values.includes(value)) return;
    onChange([...values, value]);
  };
  const remove = (value) => {
    onChange(values.filter((v) => v !== value));
    selectRef.current?.focus();
  };

  return (
    <fieldset className="form-field">
      <legend className="form-field__label">{legend} {hint && <span className="form-field__hint">{hint}</span>}</legend>
      <select ref={selectRef} id={id} className="form-field__input form-field__input--select"
              aria-label={placeholder} value=""
              onChange={(e) => add(e.target.value)}>
        <option value="">{placeholder}</option>
        {options.map((o) => {
          const chosen = values.includes(o.value);
          return (
            <option key={o.value} value={o.value} disabled={chosen} hidden={chosen}>
              {o.native ? `${o.label} · ${o.native}` : o.label}
            </option>
          );
        })}
      </select>
      <div className="chip-list" aria-live="polite">
        {values.map((value) => {
          const o = options.find((x) => x.value === value);
          if (!o) return null;
          return (
            <span className="chip" key={value}>
              <span className="chip__text">
                {o.native || o.label}
                {o.native && <small>{o.label}</small>}
              </span>
              <button type="button" className="chip__remove" aria-label={`Remove ${o.label}`} onClick={() => remove(value)}>
                <CloseIcon size={14} />
              </button>
            </span>
          );
        })}
      </div>
    </fieldset>
  );
}
