"use client";
import React from 'react';
import { useUI } from '@/hooks/useUI';
import { Card, CardContent } from '@/components/ui/Card';
import { Warehouse } from 'lucide-react';

export default function WarehouseActivitiesTab() {
    const { t } = useUI();

    return (
        <Card>
            <CardContent>
                <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2 text-lime-400">
                    <Warehouse className="w-6 h-6" /> {t.warehouseActivitiesTab || 'Warehouse Activities'}
                </h2>
                <div className="text-center py-16">
                    <p className="text-gray-400">Obsah pro skladové aktivity bude doplněn.</p>
                </div>
            </CardContent>
        </Card>
    );
}