// src/components/shared/AvatarUpload.jsx
"use client";
import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Camera, Loader2 } from 'lucide-react';
import Image from 'next/image';
import toast from 'react-hot-toast';

export default function AvatarUpload({ uid, currentAvatarUrl, onUpload }) {
    const { supabase } = useAuth();
    const [uploading, setUploading] = useState(false);

    const uploadAvatar = async (event) => {
        try {
            setUploading(true);
            if (!event.target.files || event.target.files.length === 0) {
                throw new Error('Musíte vybrat obrázek k nahrání.');
            }

            const file = event.target.files[0];
            const fileExt = file.name.split('.').pop();
            // Ponecháváme původní logiku názvu souboru, která je v pořádku
            const filePath = `${uid}-${Date.now()}.${fileExt}`;

            // --- DŮLEŽITÁ OPRAVA ZDE ---
            // Explicitně nastavíme Content-Type, abychom předešli chybám 400 Bad Request.
            const fileOptions = {
                contentType: file.type, // Např. 'image/jpeg' nebo 'image/png'
                cacheControl: '3600',   // Uložit do mezipaměti na hodinu
                upsert: false           // Nepřepisovat soubor se stejným jménem
            };

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file, fileOptions); // <-- Zde přidáváme fileOptions

            if (uploadError) {
                throw uploadError;
            }

            const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
            
            // Přidáme časovou značku pro obejití cache
            const newUrl = `${data.publicUrl}?t=${new Date().getTime()}`;
            onUpload(newUrl);

            toast.success("Avatar byl úspěšně nahrán!");
        } catch (error) {
            toast.error(`Chyba při nahrávání: ${error.message}`);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="relative group w-32 h-32">
            <Image
                src={currentAvatarUrl || '/profile-avatar.png'}
                alt="Avatar"
                key={currentAvatarUrl} // Klíč pro vynucení znovunačtení obrázku
                width={128}
                height={128}
                className="rounded-full object-cover w-32 h-32 border-4 border-slate-600 group-hover:opacity-60 transition-opacity"
            />
            <label
                htmlFor="avatar-upload"
                className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            >
                {uploading ? (
                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                ) : (
                    <Camera className="w-8 h-8 text-white" />
                )}
                <input
                    type="file"
                    id="avatar-upload"
                    className="hidden"
                    accept="image/*"
                    onChange={uploadAvatar}
                    disabled={uploading}
                />
            </label>
        </div>
    );
}