import { useState } from 'react';
import { useAuthStore } from '../store/auth';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignup, setIsSignup] = useState(false);
  const { login, signup, isLoading, error, setError } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (isSignup) {
      await signup(email, password);
    } else {
      await login(email, password);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[hsl(222.2,84%,4.9%)]">
      <div className="w-full max-w-md p-8 rounded-2xl bg-[hsl(222.2,84%,7%)] border border-[hsl(217.2,32.6%,17.5%)] shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            GoBase
          </h1>
          <p className="text-sm text-[hsl(215,20.2%,65.1%)] mt-2">
            Admin Dashboard
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[hsl(215,20.2%,65.1%)] mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-lg bg-[hsl(217.2,32.6%,17.5%)] border border-[hsl(217.2,32.6%,22%)] text-white placeholder-[hsl(215,20.2%,45%)] focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all"
              placeholder="admin@gobase.dev"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[hsl(215,20.2%,65.1%)] mb-1.5">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-lg bg-[hsl(217.2,32.6%,17.5%)] border border-[hsl(217.2,32.6%,22%)] text-white placeholder-[hsl(215,20.2%,45%)] focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isLoading ? 'Loading...' : isSignup ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-sm text-[hsl(215,20.2%,65.1%)] mt-6">
          {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            onClick={() => { setIsSignup(!isSignup); setError(null); }}
            className="text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
          >
            {isSignup ? 'Sign In' : 'Sign Up'}
          </button>
        </p>
      </div>
    </div>
  );
}
