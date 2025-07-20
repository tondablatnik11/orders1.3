// src/components/ui/Modal.jsx
import React from 'react';
import { XCircle } from 'lucide-react';

export const Modal = ({ title, children, onClose }) => (
  // UPRAVENO: Nahrazení 'flex items-center justify-center' za 'grid place-items-center'
  // Toto je spolehlivější způsob, jak zajistit dokonalé vertikální i horizontální vycentrování.
  <div className="fixed inset-0 bg-black bg-opacity-70 grid place-items-center z-50 p-4">
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