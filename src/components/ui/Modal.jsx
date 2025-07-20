// src/components/ui/Modal.jsx
import React from 'react';
import { XCircle } from 'lucide-react';
import { motion } from 'framer-motion'; // NOVÉ: Přidáno pro animaci

export const Modal = ({ title, children, onClose }) => (
  // UPRAVENO: Přepracováno pro robustní centrování a vylepšené pozadí
  // Hlavní kontejner pro pozadí
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    onClick={onClose} // Kliknutí na pozadí zavře modální okno
  >
    {/* Samotné modální okno */}
    <motion.div
      initial={{ scale: 0.95, y: -20 }}
      animate={{ scale: 1, y: 0 }}
      exit={{ scale: 0.95, y: 20 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className="bg-gray-800 rounded-xl shadow-2xl p-6 relative w-full max-w-7xl max-h-[90vh] flex flex-col"
      onClick={(e) => e.stopPropagation()} // Zamezí zavření při kliknutí dovnitř okna
    >
      <div className="flex-shrink-0 flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-blue-400 text-center flex-grow">{title}</h2>
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-white transition-colors"
          title="Close"
        >
          <XCircle className="w-6 h-6" />
        </button>
      </div>
      {/* Kontejner pro obsah, který se bude scrollovat */}
      <div className="flex-grow overflow-y-auto pr-2">
        {children}
      </div>
    </motion.div>
  </motion.div>
);