import { useState } from 'react';

import type { ApiError } from '../lib/api';

export const LoginView = ({
  onLogin,
  loading,
}: {
  onLogin: (payload: { pin: string; trusted: boolean }) => Promise<void>;
  loading: boolean;
}) => {
  const [pin, setPin] = useState('');
  const [trusted, setTrusted] = useState(true);
  const [error, setError] = useState('');

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!/^\d{4}$/.test(pin)) {
      setError('PIN must be exactly 4 digits.');
      return;
    }

    try {
      await onLogin({ pin, trusted });
      setError('');
    } catch (requestError) {
      const typedError = requestError as ApiError;
      setError(typedError.message || 'Unable to login.');
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-base-200 via-base-100 to-base-300 p-4">
      <div className="mx-auto mt-16 w-full max-w-md">
        <div className="card border border-base-300 bg-base-100 shadow-xl">
          <div className="card-body gap-4">
            <div>
              <h1 className="text-2xl font-extrabold">HungryList</h1>
              <p className="text-sm text-base-content/70">Enter your 4-digit PIN to unlock your household grocery planner.</p>
            </div>

            <form className="space-y-4" onSubmit={submit}>
              {error ? <div className="alert alert-error text-sm">{error}</div> : null}

              <label className="form-control">
                <span className="label-text">4-digit PIN</span>
                <input
                  className="input input-bordered text-center text-xl tracking-[0.3em]"
                  inputMode="numeric"
                  pattern="\\d{4}"
                  maxLength={4}
                  value={pin}
                  onChange={(event) => {
                    const value = event.target.value.replace(/\D/g, '').slice(0, 4);
                    setPin(value);
                    if (error) {
                      setError('');
                    }
                  }}
                  autoFocus
                  required
                />
              </label>

              <label className="label cursor-pointer justify-start gap-2">
                <input
                  type="checkbox"
                  className="checkbox checkbox-primary checkbox-sm"
                  checked={trusted}
                  onChange={(event) => setTrusted(event.target.checked)}
                />
                <span className="label-text">Trust this device for 1 year</span>
              </label>

              <button type="submit" className={`btn btn-primary w-full ${loading ? 'loading' : ''}`} disabled={loading}>
                Unlock HungryList
              </button>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
};
