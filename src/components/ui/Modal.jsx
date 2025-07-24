'use client';
import React from 'react';
import { X } from 'lucide-react';

// Ujistíme se, že komponenta je správně definována
const Modal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center"
            onClick={onClose}
        >
            <div 
                className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col"
                onClick={e => e.stopPropagation()} // Zabrání zavření při kliknutí dovnitř
            >
                <div className="flex justify-between items-center p-4 border-b">
                    <h3 className="text-xl font-semibold text-slate-800">{title}</h3>
                    <button 
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600"
                    >
                        <X size={24} />
                    </button>
                </div>
                <div className="overflow-y-auto">
                    {children}
                </div>
            </div>
        </div>
    );
};

// A zde zajistíme, že je správně exportována jako "default"
export default Modal;