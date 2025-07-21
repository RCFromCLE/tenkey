// src/components/ui/logo.tsx
'use client';

import React from 'react';
import Link from 'next/link';

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2.5 group">
      <div className="relative">
        <svg
          width="28"
          height="28"
          viewBox="0 0 28 28"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="transition-transform duration-300 group-hover:scale-105"
        >
          <defs>
            <linearGradient 
              id="logoGradient" 
              x1="0" 
              y1="0" 
              x2="28" 
              y2="28" 
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%" stopColor="#10B981" />
              <stop offset="100%" stopColor="#0EA5E9" />
            </linearGradient>
          </defs>
          
          {/* Base Shape */}
          <path
            d="M14 4L24 9.5V18.5L14 24L4 18.5V9.5L14 4Z"
            fill="#0F172A"
            stroke="url(#logoGradient)"
            strokeWidth="1.5"
            className="transition-all duration-300"
          />
          
          {/* "T" shape */}
          <path
            d="M10 8H18M14 8V20"
            stroke="url(#logoGradient)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <span className="font-display text-lg font-medium bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-sky-400">
        Tenkey
      </span>
    </Link>
  );
}