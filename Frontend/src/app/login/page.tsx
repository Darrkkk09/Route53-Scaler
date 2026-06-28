'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Lock, User, AlertCircle } from 'lucide-react';

// Mocked auth — any non-empty username and password is accepted

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulate a small network delay for realism
    await new Promise((r) => setTimeout(r, 600));

    if (username.trim() && password.trim()) {
      // Mocked — any non-empty credentials succeed
      const expires = new Date(Date.now() + 8 * 60 * 60 * 1000).toUTCString();
      document.cookie = `r53_session=${btoa(username.trim())}; expires=${expires}; path=/; SameSite=Lax`;
      router.push('/');
      router.refresh();
    } else {
      setError('Username and password cannot be empty.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f1f3f4] flex flex-col">
      {/* AWS-style top bar */}
      <div className="h-[48px] bg-[#1b2530] flex items-center px-6">
        <span className="font-bold text-[16px] text-white tracking-wide">
          aws<span className="text-[#ec7211]">.</span>
        </span>
      </div>

      {/* Login Box */}
      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-[380px]">
          <div className="bg-white border border-[#eaeded] shadow-sm rounded p-8">
            {/* AWS Console lock icon */}
            <div className="flex flex-col items-center mb-6">
              <div className="w-12 h-12 bg-[#1b2530] rounded-full flex items-center justify-center mb-4">
                <Lock className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-[20px] font-bold text-gray-900 text-center">Sign in</h1>
              <p className="text-[12px] text-gray-500 text-center mt-1">
                Amazon Route 53 Management Console
              </p>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="mb-4 flex items-start gap-2 bg-red-50 border border-red-200 rounded p-3 text-[12px] text-red-700">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              {/* Username */}
              <div className="space-y-1">
                <label className="block text-[13px] font-semibold text-gray-700">
                  IAM Username
                </label>
                <div className="relative">
                  <User className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter username"
                    className="w-full h-[36px] pl-9 pr-3 bg-white border border-gray-300 rounded text-[13px] outline-none focus:border-[#0073bb] focus:ring-1 focus:ring-[#0073bb] transition-all"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1">
                <label className="block text-[13px] font-semibold text-gray-700">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full h-[36px] pl-9 pr-9 bg-white border border-gray-300 rounded text-[13px] outline-none focus:border-[#0073bb] focus:ring-1 focus:ring-[#0073bb] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-[36px] bg-[#ec7211] hover:bg-[#dd6200] disabled:bg-gray-300 text-white font-semibold text-[13px] rounded shadow-sm transition-all mt-2"
              >
                {isLoading ? 'Signing in...' : 'Sign in'}
              </button>
            </form>

            {/* Hint */}
            <div className="mt-5 pt-4 border-t border-gray-100 text-[11px] text-gray-400 text-center">
              <p>Any username and password will work — this is a mocked auth system.</p>
            </div>
          </div>

          <p className="text-center text-[11px] text-gray-400 mt-4">
            This is a mocked authentication system for demo purposes.
          </p>
        </div>
      </div>
    </div>
  );
}
