import React from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { useUI } from '@/hooks/useUI';

export default function SummaryCards({ summary }) {
    const { t } = useUI();
    
    const cards = [
        { labelKey: 'total', value: summary.total, color: 'text-blue-400' },
        { labelKey: 'done', value: summary.doneTotal, color: 'text-green-400' },
        { labelKey: 'remaining', value: summary.remainingTotal, color: 'text-yellow-400' },
        { labelKey: 'inProgress', value: summary.inProgressTotal, color: 'text-orange-400' },
        { labelKey: 'newOrders', value: summary.newOrdersTotal, color: 'text-purple-400' },
        { labelKey: 'pallets', value: summary.palletsTotal, color: 'text-pink-400' },
        { labelKey: 'carton', value: summary.cartonsTotal, color: 'text-cyan-400' },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-6">
            {cards.map(card => (
                <Card key={card.labelKey}>
                    <CardContent>
                        <p className="text-gray-400">{t[card.labelKey]}</p>
                        <p className={`text-3xl font-bold ${card.color}`}>{card.value}</p>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}