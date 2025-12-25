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
    
    let newOffset = startOffset.current + diff;
    
    if (newOffset > 0) newOffset = 0; 
    if (newOffset < -100) newOffset = -100; 
    
    setOffset(newOffset);
  };

  const handleTouchEnd = () => {
    if (offset < -50) {
      setOffset(-80); 
    } else {
      setOffset(0); 
    }
    touchStartX.current = null;
  };

  const handleClick = (e: React.MouseEvent) => {
    // If we are swiped open, a click anywhere closes it
    if (offset !== 0) {
      setOffset(0);
      e.stopPropagation();
    } else {
      // Otherwise, the page handles the edit/view via handleExpenseClick in parent
      onEdit();
    }
  };

  return (
    <div className="relative mb-3 overflow-hidden select-none touch-pan-y group">
      {/* Background Actions Layer - Higher Z when open to be clickable */}
      <div 
        className={`absolute inset-y-0 right-0 w-20 bg-red-500 rounded-xl flex items-center justify-center transition-opacity ${offset < -20 ? 'opacity-100 z-30' : 'opacity-0 z-0'}`}
      >
        <button 
          type="button"
          onClick={(e) => { 
            e.stopPropagation(); 
            onDelete(); 
            setOffset(0);
          }}
          className="w-full h-full flex items-center justify-center text-white active:scale-90 transition-transform"
        >
          <Trash2 size={22} />
        </button>
      </div>

      {/* Foreground Content */}
      <div 
        ref={rowRef}
        className="relative z-10 transition-transform duration-200 ease-out bg-transparent cursor-pointer"
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