import React, { useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';

export const NotificationSystem: React.FC = () => {
    const { user } = useAuth();

    useEffect(() => {
        if (!user) return;

        // We can use a single channel for all user notifications
        const channel = supabase
            .channel(`notifications:${user.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `receiver_id=eq.${user.id}`,
                },
                async (payload) => {
                    // Fetch sender name
                    const { data } = await supabase.from('profiles').select('handle').eq('id', payload.new.sender_id).single();
                    const senderName = data?.handle || 'Alguien';

                    const displaySender = senderName.startsWith('@') ? senderName : `@${senderName}`;
                    showNotification(`Nueva transmisión de ${displaySender}`, payload.new.content);
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${user.id}`,
                },
                (payload) => {
                    showNotification(payload.new.title, payload.new.content);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user]);

    const showNotification = (title: string, body: string) => {
        // Create a floating toast element
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-surface-dark border border-primary/50 shadow-glow-lg p-4 rounded-xl z-50 animate-slideIn flex flex-col gap-1 min-w-[300px] cursor-pointer';
        notification.innerHTML = `
        <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-primary text-sm">notifications_active</span>
            <h4 class="text-white font-bold text-sm">${title}</h4>
        </div>
        <p class="text-slate-300 text-xs pl-6">${body}</p>
      `;

        // Auto remove
        setTimeout(() => {
            notification.classList.add('opacity-0', 'translate-x-full', 'transition-all', 'duration-500');
            setTimeout(() => notification.remove(), 500);
        }, 5000);

        document.body.appendChild(notification);
    };

    return null; // This component renders nothing but handles side effects
};
