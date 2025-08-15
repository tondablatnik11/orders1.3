// src/components/modals/ErrorListModal.jsx
"use client";
import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { Table, TableHead, TableRow, TableHeaderCell, TableBody, TableCell } from '@tremor/react';

export default function ErrorListModal({ title, errors, onClose }) {
    if (!errors) return null;

    return (
        <Modal title={title} onClose={onClose}>
            <div className="max-h-[60vh] overflow-y-auto">
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableHeaderCell>Timestamp</TableHeaderCell>
                            <TableHeaderCell>Typ chyby</TableHeaderCell>
                            <TableHeaderCell>Pozice</TableHeaderCell>
                             <TableHeaderCell>Materiál</TableHeaderCell>
                            <TableHeaderCell>Uživatel</TableHeaderCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {errors.map((error) => (
                            <TableRow key={error.unique_key}>
                                <TableCell>{new Date(error.timestamp).toLocaleString('cs-CZ')}</TableCell>
                                <TableCell>{error.description}</TableCell>
                                <TableCell>{error.error_location}</TableCell>
                                <TableCell>{error.material}</TableCell>
                                <TableCell>{error.user}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </Modal>
    );
}