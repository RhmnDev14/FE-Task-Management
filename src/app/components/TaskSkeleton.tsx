'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Skeleton } from "@/components/ui/skeleton";

interface TaskSkeletonProps {
  count?: number;
}

export default function TaskSkeleton({ count = 4 }: TaskSkeletonProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {Array.from({ length: count }).map((_, idx) => (
        <motion.div
          key={idx}
          className="skeleton-card"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.08, duration: 0.4 }}
        >
          {/* Circle icon placeholder */}
          <Skeleton className="h-[22px] w-[22px] rounded-full shrink-0" />
          
          {/* Content lines */}
          <div className="skeleton-content">
            <Skeleton className="h-3.5 w-[70%]" />
            <Skeleton className="h-3 w-[85%] opacity-70" />
            <div style={{ display: 'flex', gap: '16px', marginTop: '4px' }}>
              <Skeleton className="h-2.5 w-[80px]" />
              <Skeleton className="h-2.5 w-[50px]" />
            </div>
          </div>

          {/* Action button placeholder */}
          <Skeleton className="h-[34px] w-[34px] rounded-lg shrink-0" />
        </motion.div>
      ))}
    </div>
  );
}
