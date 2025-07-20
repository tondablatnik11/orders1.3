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
            // OPRAVA: Soubor se nyní ukládá do složky pojmenované podle UID uživatele.
            // Příklad cesty: `public/vasi_uid/avatar.png`
            const filePath = `${uid}/avatar.${fileExt}`;

            const fileOptions = {
                contentType: file.type,
                cacheControl: '3600',
                // Důležité: upsert: true zajistí, že nový avatar přepíše ten starý.
                upsert: true
            };

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file, fileOptions);

            if (uploadError) {
                throw uploadError;
            }

            // Získáme veřejnou URL k nově nahranému souboru
            const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
            
            // Předáme novou URL rodičovské komponentě pro aktualizaci profilu
            // Přidáme časovou značku, abychom obešli cache prohlížeče
            onUpload(`${data.publicUrl}?t=${new Date().getTime()}`);
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