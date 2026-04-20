'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';

interface LoadingSpinnerProps {
  /** Full-page overlay with centered spinner */
  variant?: 'fullpage' | 'inline' | 'overlay';
  /** Optional message below the spinner */
  message?: string;
  /** Show/hide (for AnimatePresence transitions) */
  show?: boolean;
}

export default function LoadingSpinner({ 
  variant = 'fullpage', 
  message = 'Memuat data...', 
  show = true 
}: LoadingSpinnerProps) {
  if (variant === 'inline') {
    return (
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '60px 0',
              gap: '20px'
            }}
          >
            <div className="loading-spinner-ring" />
            {message && <span className="loading-text">{message}</span>}
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  if (variant === 'overlay') {
    return (
      <AnimatePresence>
        {show && (
          <motion.div
            className="loading-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ position: 'absolute', borderRadius: 'inherit' }}
          >
            <div className="loading-spinner-ring" />
            {message && <span className="loading-text">{message}</span>}
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  // variant === 'fullpage'
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="loading-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Branding Icon */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.4, ease: 'easeOut' }}
            style={{
              width: '64px',
              height: '64px',
              background: 'linear-gradient(135deg, var(--primary), #8b5cf6)',
              borderRadius: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              boxShadow: '0 12px 24px -4px rgba(99, 102, 241, 0.4)',
            }}
          >
            <Sparkles size={28} />
          </motion.div>

          {/* Animated dots */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="loading-dots"
          >
            <div className="loading-dot" />
            <div className="loading-dot" />
            <div className="loading-dot" />
          </motion.div>

          {/* Message */}
          {message && (
            <motion.span
              className="loading-text"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.4 }}
            >
              {message}
            </motion.span>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
