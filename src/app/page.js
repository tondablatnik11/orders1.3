'use client';
import AppProviders from '@/components/layout/AppProviders';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Login from '@/components/auth/Login';
import { useAuth } from '@/hooks/useAuth';
import { Toaster } from 'react-hot-toast';export default function Home() {
const { user, loading } = useAuth();if (loading) {
return (

Načítání...

);
}return (


);
}