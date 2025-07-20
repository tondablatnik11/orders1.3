// src/components/ui/Modal.jsx
import React from 'react';
import { XCircle } from 'lucide-react';

export const Modal = ({ title, children, onClose }) => (
  // UPRAVENO: Přidán vnitřní flex kontejner pro správné centrování
  <div className="fixed inset-0 bg-black bg-opacity-70 z-50 p-4 overflow-y-auto">
    <div className="flex items-center justify-center min-h-full">
      <div 
        className="bg-gray-800 rounded-xl shadow-2xl p-6 relative w-full max-w-7xl"
        // onClick se přidá, aby se modal nezavřel při kliknutí dovnitř
        onClick={(e) => e.stopPropagation()} 
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-white transition-colors"
          title="Close"
        >
          <XCircle className="w-6 h-6" />
        </button>
        <h2 className="text-2xl font-bold mb-4 text-blue-400 text-center">{title}</h2>
        {children}
      </div>
    </div>
  </div>
);