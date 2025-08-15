// src/components/modals/MaterialErrorsModal.jsx
"use client";
import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { Table, TableHead, TableRow, TableHeaderCell, TableBody, TableCell, Text } from '@tremor/react';

export default function MaterialErrorsModal({ material, allErrors, onClose }) {
    if (!material) return null;

    const materialErrors = allErrors.filter(e => e.material === material);

    return (
        <Modal title={`Chyby pro materiál: ${material}`} onClose={onClose}>
            <div className="max-h-[60vh] overflow-y-auto">
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableHeaderCell>Timestamp</TableHeaderCell>
                            <TableHeaderCell>Pozice</TableHeaderCell>
                            <TableHeaderCell>Typ chyby</TableHeaderCell>
                            <TableHeaderCell>Uživatel</TableHeaderCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {materialErrors.map((error, index) => (
                            <TableRow key={error.unique_key || index}>
                                <TableCell>{new Date(error.timestamp).toLocaleString('cs-CZ')}</TableCell>
                                <TableCell>{error.error_location}</TableCell>
                                <TableCell>{error.description}</TableCell>
                                <TableCell>{error.user}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </Modal>
    );
}