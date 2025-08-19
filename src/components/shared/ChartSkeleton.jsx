"use client";
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';

export const ChartSkeleton = ({ title, isSimple = false }) => {
    return (
        <div className="w-full h-full">
            {isSimple ? (
                 <div className="w-full h-[350px] bg-slate-800/50 rounded-lg animate-pulse"></div>
            ) : (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                           <div className="w-5 h-5 bg-slate-700 rounded animate-pulse"></div>
                           <div className="w-40 h-6 bg-slate-700 rounded animate-pulse"></div>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="w-full h-[350px] bg-slate-800/50 rounded-lg animate-pulse"></div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};