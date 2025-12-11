'use client';
import React, { useState, useRef } from 'react';
import { Trash2 } from 'lucide-react';

interface SwipeableRowProps {
  children: React.ReactNode;
  onDelete: () => void;
  onEdit: () => void;
  disabled?: boolean;
}

export const SwipeableRow: React.FC<SwipeableRowProps> = ({ children, onDelete, onEdit, disabled }) => {
  const [offset, setOffset] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const startOffset = useRef(0);
  const rowRef = useRef<HTMLDivElement>(null);

  if (disabled) {
    return <div className="mb-3">{children}</div>;
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    startOffset.current = offset;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = e.touches[0].clientX - touchStartX.current;
    
    // Calculate new potential offset
    // Only allow swiping left (negative)
    let newOffset = startOffset.current + diff;
    
    // Resistance limits
    if (newOffset > 0) newOffset = 0; // Prevent swipe right
    if (newOffset < -100) newOffset = -100; // Max delete width + some resistance
    
    setOffset(newOffset);
  };

  const handleTouchEnd = () => {
    if (offset < -50) {
      setOffset(-80); // Snap open
    } else {
      setOffset(0); // Snap closed
    }
    touchStartX.current = null;
  };

  const handleClick = (e: React.MouseEvent) => {
    if (offset !== 0) {
      // If open, close it
      setOffset(0);
      e.stopPropagation(); // Prevent edit click if we are just closing the swipe
    } else {
      onEdit();
    }
  };

  return (
    <div className="relative mb-3 overflow-hidden select-none touch-pan-y">
      {/* Background Actions */}
      <div className="absolute inset-y-0 right-0 w-20 bg-red-500 rounded-xl flex items-center justify-center z-0">
        <button 
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="w-full h-full flex items-center justify-center text-white"
        >
          <Trash2 size={20} />
        </button>
      </div>

      {/* Foreground Content */}
      <div 
        ref={rowRef}
        className="relative z-10 transition-transform duration-200 ease-out bg-transparent"
        style={{ transform: `translateX(${offset}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={handleClick}
      >
        {children}
      </div>
    </div>
  );
};