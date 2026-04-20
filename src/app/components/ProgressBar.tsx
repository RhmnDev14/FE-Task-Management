'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ProgressBarProps {
  show: boolean;
}

export default function ProgressBar({ show }: ProgressBarProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="loading-progress-bar"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        />
      )}
    </AnimatePresence>
  );
}
