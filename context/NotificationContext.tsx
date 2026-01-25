import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from './AuthContext';
import { useNavigate } from 'react-router-dom';

export interface AppNotification {
    id: string;
    type: 'message' | 'friend_request' | 'request_accepted';
    title: string;
    content: string;
    source_id: string;
    source_handle: string;
    source_avatar: string;
    is_read: boolean;
    created_at: string;
}

interface NotificationContextType {
    unreadCount: number;
    notifications: AppNotification[];
    markAsRead: (notificationId: string) => Promise<void>;
    markMessagesAsRead: (senderId: string) => Promise<void>;
    clearAllNotifications: () => Promise<void>;
    notificationTrigger: number;
    fetchNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType>({
    unreadCount: 0,
    notifications: [],
    markAsRead: async () => { },
    markMessagesAsRead: async () => { },
    markAllAsRead: async () => { },
    clearAllNotifications: async () => { },
    notificationTrigger: 0,
    fetchNotifications: async () => { }
});

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [unreadCount, setUnreadCount] = useState(0);
    const [notificationTrigger, setNotificationTrigger] = useState(0);
    const [notifications, setNotifications] = useState<AppNotification[]>([]);

    const fetchNotifications = async () => {
        if (!user) return;

        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(20);

        if (data) {
            setNotifications(data);
            const unread = data.filter(n => !n.is_read).length;
            setUnreadCount(unread);
        }
    };

    useEffect(() => {
        if (!user) return;
        fetchNotifications();

        const channel = supabase
            .channel(`notifications:${user.id}`)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
                () => {
                    fetchNotifications();
                    setNotificationTrigger(prev => prev + 1);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user]);

    const markAsRead = async (id: string) => {
        if (!user) return;

        await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('id', id);

        fetchNotifications();
        setNotificationTrigger(prev => prev + 1);
    };

    const markMessagesAsRead = async (senderId: string) => {
        if (!user) return;

        // 1. Mark actual messages as read (for the friend list indicator)
        await supabase
            .from('messages')
            .update({ is_read: true })
            .eq('sender_id', senderId)
            .eq('receiver_id', user.id)
            .eq('is_read', false);

        // 2. Mark corresponding notifications as read (for the bell icon menu)
        await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('user_id', user.id)
            .eq('source_id', senderId)
            .eq('type', 'message')
            .eq('is_read', false);

        fetchNotifications();
        setNotificationTrigger(prev => prev + 1);
    };

    const markAllAsRead = async () => {
        if (!user) return;

        await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('user_id', user.id)
            .eq('is_read', false);

        fetchNotifications();
        setNotificationTrigger(prev => prev + 1);
    };

    const clearAllNotifications = async () => {
        if (!user) return;

        // Optimistic Update: Clear local state immediately
        const previousNotifications = [...notifications];
        const previousUnread = unreadCount;

        setNotifications([]);
        setUnreadCount(0);

        const { error } = await supabase
            .from('notifications')
            .delete()
            .eq('user_id', user.id);

        if (error) {
            // Fallback in case of error
            setNotifications(previousNotifications);
            setUnreadCount(previousUnread);
            console.error("Error al borrar notificaciones:", error);
        } else {
            setNotificationTrigger(prev => prev + 1);
        }
    };

    return (
        <NotificationContext.Provider value={{
            unreadCount,
            notifications,
            markAsRead,
            markMessagesAsRead,
            markAllAsRead,
            clearAllNotifications,
            notificationTrigger,
            fetchNotifications
        }}>
            {children}
        </NotificationContext.Provider>
    );
};
