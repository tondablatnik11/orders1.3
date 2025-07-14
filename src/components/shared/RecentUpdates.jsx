'use client';
import React from 'react';
import { format, parseISO } from 'date-fns';
import { cs } from 'date-fns/locale';
import { FiArrowRight } from 'react-icons/fi';
import { Card, CardContent } from '../ui/Card';

const RecentUpdates = ({ updates }) => {
    return (
        <Card>
            <CardContent>
                <h3 className="text-xl font-semibold mb-4">Poslední změny stavu</h3>
                <div className="space-y-4">
                    {updates && updates.length > 0 ? updates.map(order => (
                        <div key={order["Delivery No"]} className="flex items-center justify-between text-sm">
                            <div>
                                <p className="font-bold text-white">{order["Delivery No"]}</p>
                                <p className="text-xs text-gray-400">
                                    {order.updated_at ? format(parseISO(order.updated_at), 'd. M. yyyy, HH:mm', { locale: cs }) : 'N/A'}
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-gray-500">{order.old_status || '?'}</span>
                                <FiArrowRight className="text-gray-500" />
                                <span className="font-bold text-blue-400 bg-blue-900/50 px-2 py-1 rounded">{order.Status}</span>
                            </div>
                        </div>
                    )) : (
                        <p className="text-sm text-gray-500">Žádné nedávné aktualizace.</p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

export default RecentUpdates;