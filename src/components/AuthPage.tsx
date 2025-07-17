import React, { useState } from 'react';
import { Modal } from './UI/Modal';
import { Button } from './UI/Button';
import { Loader2, Lock, UserPlus, LogIn, Heart } from 'lucide-react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;


interface AuthPageProps {
  onAuthSuccess: (token: string, username: string) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onAuthSuccess }) => {
  const [mode, setMode] = useState<'login' | 'signup' | 'patient'>('login');
  const [form, setForm] = useState({ username: '', email: '', password: '', patientEmail: '', patientPhone: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (mode === 'login') {
        const res = await axios.post(`http://localhost:8000/api/token/`, {
          username: form.username,
          password: form.password,
        });
        if (res.data && res.data.access) {
          localStorage.setItem('access', res.data.access);
          localStorage.setItem('refresh', res.data.refresh);
          onAuthSuccess(res.data.access, form.username);
        } else {
          setError('Invalid response from server.');
        }
      } else if (mode === 'signup') {
        const res = await axios.post(`${API_BASE_URL}/register/`, {
          username: form.username,
          email: form.email,
          password: form.password,
        });
        if (res.data && res.data.access) {
          localStorage.setItem('access', res.data.access);
          localStorage.setItem('refresh', res.data.refresh);
          onAuthSuccess(res.data.access, form.username);
        } else {
          setError('Invalid response from server.');
        }
      } else if (mode === 'patient') {
        const res = await axios.post(`${API_BASE_URL}/patient-login/`, {
          email: form.patientEmail,
          phone: form.patientPhone,
        });
        if (res.data && res.data.access && res.data.patient_id) {
          localStorage.setItem('access', res.data.access);
          localStorage.setItem('refresh', res.data.refresh);
          localStorage.setItem('patient_id', res.data.patient_id);
          onAuthSuccess(res.data.access, res.data.patient_id);
          window.location.href = '/patient-dashboard'; // Redirect to patient dashboard
        } else {
          setError('Invalid response from server.');
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.non_field_errors?.[0] || err.response?.data?.error || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-teal-100">
      <div className="bg-white rounded-2xl shadow-2xl p-10 w-full max-w-md flex flex-col items-center">
        <div className="mb-6 flex flex-col items-center">
          <span className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-blue-600 to-teal-600 mb-2">
            <Heart className="w-8 h-8 text-white" />
          </span>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Mama AI Health Guardian</h1>
          <p className="text-gray-500 text-sm">Sign in to access your clinic dashboard</p>
        </div>
        <div className="flex space-x-2 mb-8">
          <button
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${mode === 'login' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-blue-50'}`}
            onClick={() => setMode('login')}
          >
            <LogIn className="w-4 h-4 inline mr-1" /> Sign In
          </button>
          <button
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${mode === 'signup' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-blue-50'}`}
            onClick={() => setMode('signup')}
          >
            <UserPlus className="w-4 h-4 inline mr-1" /> Sign Up
          </button>
          <button
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${mode === 'patient' ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-teal-50'}`}
            onClick={() => setMode('patient')}
          >
            <Heart className="w-4 h-4 inline mr-1" /> Login as Patient
          </button>
        </div>
        <form className="w-full space-y-4" onSubmit={handleSubmit}>
          {mode === 'login' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <input
                  type="text"
                  name="username"
                  required
                  value={form.username}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  autoComplete="username"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  name="password"
                  required
                  value={form.password}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  autoComplete="current-password"
                />
              </div>
            </>
          )}
          {mode === 'signup' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <input
                  type="text"
                  name="username"
                  required
                  value={form.username}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  autoComplete="username"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  required
                  value={form.email}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  autoComplete="email"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  name="password"
                  required
                  value={form.password}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  autoComplete="new-password"
                />
              </div>
            </>
          )}
          {mode === 'patient' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Patient Email</label>
                <input
                  type="email"
                  name="patientEmail"
                  required
                  value={form.patientEmail}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  autoComplete="email"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  name="patientPhone"
                  required
                  value={form.patientPhone}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  autoComplete="tel"
                />
              </div>
            </>
          )}
          <Button
            type="submit"
            variant="primary"
            className="w-full mt-2"
            loading={loading}
            icon={<Lock className="w-4 h-4" />}
            disabled={loading}
          >
            {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : mode === 'signup' ? 'Sign Up' : 'Login as Patient'}
          </Button>
        </form>
        <Modal isOpen={!!error} onClose={() => setError(null)} title="Authentication Error">
          <div className="text-red-600 text-center">{error}</div>
        </Modal>
      </div>
    </div>
  );
}; 