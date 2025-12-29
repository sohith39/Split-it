import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTrips } from '../context/TripContext';
import { Button } from '../components/ui/Button';
import { ArrowRight, AlertCircle, RefreshCw } from 'lucide-react';
import { SplitItLogo } from '../components/ui/Logo';

const Login: React.FC = () => {
  const router = useRouter();
  const { login } = useTrips();
  const [isSignUp, setIsSignUp] = useState(false);
  const [username, setUsername] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
        setError('Please fill in all fields.');
        return;
    }

    if (isSignUp) {
        if (!phoneNumber) {
            setError('Please enter your phone number.');
            return;
        }
        if (password.length < 6) {
            setError('Password must be at least 6 characters long.');
            return;
        }
        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }
    }

    setIsPending(true);
    try {
      await login(username, password, isSignUp, isSignUp ? phoneNumber : undefined);
      if (isSignUp) {
        router.push('/onboarding');
      } else {
        router.push('/');
      }
    } catch (e: any) {
      setError(e.message || 'Authentication failed. Please check your connection.');
    } finally {
      setIsPending(false);
    }
  };

  const toggleMode = () => {
      setIsSignUp(!isSignUp);
      setError('');
      setPassword('');
      setConfirmPassword('');
      setPhoneNumber('');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-white dark:bg-black transition-colors">
      <div className="w-full max-w-sm space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="mb-6 flex justify-center">
             <SplitItLogo size={80} />
          </div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400">
            {isSignUp ? 'Sign up to sync with Turso cloud' : 'Enter your details to sign in'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-white focus:border-brand-pink focus:ring-2 focus:ring-brand-pink/20 transition-all outline-none placeholder:text-neutral-400 font-medium"
              required
              disabled={isPending}
            />
            
            {isSignUp && (
                <div className="animate-in slide-in-from-top-2 fade-in duration-300">
                     <input
                        type="tel"
                        placeholder="Phone Number"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="w-full px-4 py-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-white focus:border-brand-pink focus:ring-2 focus:ring-brand-pink/20 transition-all outline-none placeholder:text-neutral-400 font-medium"
                        required
                        disabled={isPending}
                    />
                </div>
            )}

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-white focus:border-brand-pink focus:ring-2 focus:ring-brand-pink/20 transition-all outline-none placeholder:text-neutral-400 font-medium"
              required
              disabled={isPending}
            />
            
            {isSignUp && (
                <div className="animate-in slide-in-from-top-2 fade-in duration-300">
                    <input
                        type="password"
                        placeholder="Confirm Password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full px-4 py-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-white focus:border-brand-pink focus:ring-2 focus:ring-brand-pink/20 transition-all outline-none placeholder:text-neutral-400 font-medium"
                        required
                        disabled={isPending}
                    />
                </div>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-xl border border-red-100 dark:border-red-900/30 animate-in fade-in slide-in-from-top-1">
                <AlertCircle size={16} className="shrink-0" />
                <span>{error}</span>
            </div>
          )}

          <Button type="submit" fullWidth className="mt-2 group" disabled={isPending}>
            <span className="flex items-center justify-center gap-2">
              {isPending ? (
                  <RefreshCw size={18} className="animate-spin" />
              ) : (
                  <>
                    {isSignUp ? 'Sign Up' : 'Sign In'}
                    <ArrowRight size={18} className="group-active:translate-x-1 transition-transform" />
                  </>
              )}
            </span>
          </Button>
        </form>

        <p className="text-center text-sm text-neutral-500 dark:text-neutral-400 pt-4">
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button 
            type="button"
            onClick={toggleMode}
            className="text-brand-pink font-bold hover:underline"
            disabled={isPending}
          >
            {isSignUp ? 'Log in' : 'Sign up'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default Login;