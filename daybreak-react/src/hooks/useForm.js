import { useCallback, useEffect, useRef, useState } from 'react';
import { rules } from '../lib/validation';

/* Controlled-form helper for login / signup / settings.

   useForm({
     initial:    { email: '', password: '' },
     validators: { email: { rule: 'email' }, confirm: { rule: 'confirmPassword', match: 'password' } },
     onSubmit:   async (values) => { ... }      // throw Error(message) to show a form-level message
   })

   Returns: values, errors, formError, loading, formRef, setValue, bind(name), validate(names?),
            run(fn), handleSubmit.
   Fields validate on blur (when not empty) and on submit; fields that must match another
   (validators[x].match) are re-checked when the other field blurs. */
export function useForm({ initial, validators = {}, onSubmit }) {
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);
  const formRef = useRef(null);
  const mounted = useRef(true);
  useEffect(() => () => { mounted.current = false; }, []);

  const check = useCallback((name, vals) => {
    const v = validators[name];
    if (!v) return '';
    return rules[v.rule](vals[name] ?? '', vals, v.match);
  }, [validators]);

  const setValue = useCallback((name, value) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  }, []);

  /* Validate the named fields (default: all with a validator). Focuses the first invalid one. */
  const validate = useCallback((names = Object.keys(validators)) => {
    const next = {};
    let first = null;
    names.forEach((name) => {
      const message = check(name, values);
      next[name] = message;
      if (message && !first) first = name;
    });
    setErrors((prev) => ({ ...prev, ...next }));
    if (first) formRef.current?.querySelector(`[name="${first}"]`)?.focus();
    return !first;
  }, [check, validators, values]);

  const onBlur = (name) => () => {
    if (values[name]) setErrors((prev) => ({ ...prev, [name]: check(name, values) }));
    Object.keys(validators).forEach((other) => {
      if (validators[other].match === name && values[other]) {
        setErrors((prev) => ({ ...prev, [other]: check(other, values) }));
      }
    });
  };

  /* Props for an <input>/<select>: spread onto the element */
  const bind = (name) => ({
    name,
    value: values[name],
    onChange: (e) => setValue(name, e.target.value),
    onBlur: onBlur(name),
    'aria-invalid': errors[name] ? 'true' : 'false',
  });

  /* Runs an async submit with the loading state and form-level error handling */
  const run = useCallback(async (fn) => {
    setFormError('');
    setLoading(true);
    try {
      await fn(values);
    } catch (error) {
      if (mounted.current) setFormError(error.message || 'Something went wrong. Try again.');
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [values]);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!validate()) return;
    run(onSubmit);
  };

  return { values, errors, formError, loading, formRef, setValue, setErrors, setFormError, bind, validate, run, handleSubmit };
}
