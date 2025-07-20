// src/components/ui/Modal.jsx
import React from 'react';
import { XCircle } from 'lucide-react';

// UPRAVENO: Změna max-w-3xl na max-w-7xl pro širší obsah
export const Modal = ({ title, children, onClose }) => (
  <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
    <div className="bg-gray-800 rounded-xl shadow-2xl p-6 relative w-full max-w-7xl max-h-[90vh] overflow-y-auto">
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
);