'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  UserPlus, 
  Mail, 
  Lock, 
  User,
  Eye, 
  EyeOff, 
  ArrowRight, 
  AlertCircle,
  Loader2,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import styles from '../login.module.css';

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await axios.post('/api/auth/register', {
        username,
        email,
        password,
      });

      setIsSuccess(true);
      setTimeout(() => {
        router.push('/');
      }, 2000);
    } catch (err: any) {
      console.error('Registration error:', err);
      const errorMessage = err.response?.data?.error || 'Sedang terjadi kesalahan. Silakan coba lagi.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.backgroundDecor}>
        <div className={`${styles.blob} ${styles.blob1}`} />
        <div className={`${styles.blob} ${styles.blob2}`} />
      </div>

      <div className={styles.card}>
        <div className={styles.header}>
          <motion.div 
            className={styles.logo}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <Sparkles size={28} />
          </motion.div>
          <motion.h1 
            className={styles.title}
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.5 }}
          >
            Daftar Akun
          </motion.h1>
          <motion.p 
            className={styles.subtitle}
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            Mulai kelola tugas anda dengan elegan
          </motion.p>
        </div>

        <AnimatePresence mode="wait">
          {isSuccess ? (
            <motion.div 
              className={styles.successMessage}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              style={{ textAlign: 'center', padding: '20px 0' }}
            >
              <div style={{ color: 'var(--success)', marginBottom: '16px' }}>
                <CheckCircle2 size={64} style={{ margin: '0 auto' }} />
              </div>
              <h3 style={{ marginBottom: '8px' }}>Registrasi Berhasil!</h3>
              <p style={{ color: 'var(--text-muted)' }}>Mengarahkan anda ke halaman login...</p>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {error && (
                <div className={styles.error} style={{ marginBottom: '20px' }}>
                  <AlertCircle size={18} />
                  <span>{error}</span>
                </div>
              )}

              <form className={styles.form} onSubmit={handleSubmit}>
                <div className={styles.inputGroup}>
                  <label className={styles.label} htmlFor="username">Username</label>
                  <div className={styles.inputWrapper}>
                    <User className={styles.inputIcon} size={18} />
                    <input 
                      id="username"
                      type="text" 
                      className={styles.input}
                      placeholder="pilih username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className={styles.inputGroup}>
                  <label className={styles.label} htmlFor="email">Email Address</label>
                  <div className={styles.inputWrapper}>
                    <Mail className={styles.inputIcon} size={18} />
                    <input 
                      id="email"
                      type="email" 
                      className={styles.input}
                      placeholder="nama@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className={styles.inputGroup}>
                  <label className={styles.label} htmlFor="password">Password</label>
                  <div className={styles.inputWrapper}>
                    <Lock className={styles.inputIcon} size={18} />
                    <input 
                      id="password"
                      type={showPassword ? 'text' : 'password'} 
                      className={styles.input}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)}
                      style={{ 
                        position: 'absolute', 
                        right: '12px', 
                        color: 'var(--text-muted)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <button 
                  type="submit" 
                  className={styles.submitBtn}
                  disabled={isLoading}
                  style={{ marginTop: '10px' }}
                >
                  {isLoading ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : (
                    <>
                      <span>Daftar Sekarang</span>
                      <UserPlus size={18} />
                    </>
                  )}
                </button>
              </form>

              <div className={styles.footer}>
                Sudah punya akun? 
                <a href="/" className={styles.signUpLink}>Masuk di sini</a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
