import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabase';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../context/NotificationContext';

interface Friend {
    id: string; // This is the profile ID
    name: string;
    handle: string;
    avatar: string;
    status: 'online' | 'offline' | 'busy';
    lastMessage?: string;
    unreadCount?: number;
}

interface Message {
    id: string;
    sender_id: string;
    content: string;
    created_at: string;
}

const Chat: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { notificationTrigger, markMessagesAsRead } = useNotifications();

    // Real Data State
    const [friends, setFriends] = useState<Friend[]>([]);
    const [requests, setRequests] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);

    // Messages State
    const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
    const [messageInput, setMessageInput] = useState('');
    const [chatHistory, setChatHistory] = useState<Message[]>([]);

    useEffect(() => {
        if (user) {
            fetchFriends();
            fetchRequests();
        }
    }, [user, notificationTrigger]);

    // Realtime Friends and Requests
    useEffect(() => {
        if (!user) return;

        const channel = supabase
            .channel(`friendship_realtime_chat:${user.id}`)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'friend_requests' },
                (payload) => {
                    const oldData = payload.old as any;
                    const newData = payload.new as any;

                    // Check if this change involves the current user
                    const involvesMe =
                        (newData?.sender_id === user.id || newData?.receiver_id === user.id) ||
                        (oldData?.sender_id === user.id || oldData?.receiver_id === user.id);

                    if (involvesMe) {
                        fetchFriends();
                        fetchRequests();

                        // If we deleted a friendship and it was the selected friend, deselect it
                        if (payload.eventType === 'DELETE' && selectedFriend) {
                            const deletedId = oldData.sender_id === user.id ? oldData.receiver_id : oldData.sender_id;
                            if (deletedId === selectedFriend.id) {
                                setSelectedFriend(null);
                            }
                        }
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user, selectedFriend]);

    // Fetch Friends and Requests
    const fetchFriends = async () => {
        if (!user) return;
        // Fetch where I am sender OR receiver AND status is accepted
        const { data: requestData } = await supabase
            .from('friend_requests')
            .select(`
            *,
            sender:sender_id(id, name, handle, avatar),
            receiver:receiver_id(id, name, handle, avatar)
        `)
            .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
            .eq('status', 'accepted');

        if (requestData) {
            // Check unread counts per sender
            const { data: unreadData } = await supabase
                .from('messages')
                .select('sender_id')
                .eq('receiver_id', user.id)
                .eq('is_read', false);

            const unreadCountsMap: Record<string, number> = {};
            unreadData?.forEach((m: any) => {
                unreadCountsMap[m.sender_id] = (unreadCountsMap[m.sender_id] || 0) + 1;
            });

            const formattedFriends = requestData.map((req: any) => {
                const friendData = req.sender_id === user.id ? req.receiver : req.sender;
                const isSelected = selectedFriend?.id === friendData.id;
                return {
                    id: friendData.id,
                    name: friendData.name,
                    handle: friendData.handle,
                    avatar: friendData.avatar,
                    status: 'online',
                    lastMessage: 'Conexión establecida',
                    unreadCount: isSelected ? 0 : (unreadCountsMap[friendData.id] || 0)
                };
            });
            setFriends(formattedFriends);
        }
    };

    const fetchRequests = async () => {
        if (!user) return;
        // Fetch where I am receiver AND status is pending
        const { data } = await supabase
            .from('friend_requests')
            .select(`*, sender:sender_id(id, name, handle, avatar)`)
            .eq('receiver_id', user.id)
            .eq('status', 'pending');

        if (data) setRequests(data);
    };

    const handleAcceptRequest = async (requestId: string) => {
        const request = requests.find(r => r.id === requestId);
        if (!request || !user) return;

        const { error } = await supabase
            .from('friend_requests')
            .update({ status: 'accepted' })
            .eq('id', requestId);

        if (error) {
            console.error("Error accepting request:", error);
            alert("Error al aceptar solicitud: " + error.message);
        } else {
            // Create notification for the sender
            try {
                await supabase.from('notifications').insert({
                    user_id: request.sender_id,
                    type: 'request_accepted',
                    title: '¡Alianza Aceptada!',
                    content: `${user.handle.startsWith('@') ? user.handle : `@${user.handle}`} ha aceptado tu solicitud de alianza.`,
                    source_id: user.id,
                    source_handle: user.handle,
                    source_avatar: user.avatar
                });
            } catch (notifyErr) {
                console.error("Error sending acceptance notification:", notifyErr);
            }

            fetchRequests();
            fetchFriends();
        }
    };

    const handleRejectRequest = async (requestId: string) => {
        await supabase
            .from('friend_requests')
            .delete()
            .eq('id', requestId);

        fetchRequests();
    };


    // Filter Friends locally
    const filteredFriends = friends.filter(friend =>
        friend.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        friend.handle.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Chat
    const fetchMessages = async (friendId: string) => {
        if (!user) return;
        const { data } = await supabase
            .from('messages')
            .select('*')
            .or(`and(sender_id.eq.${user.id},receiver_id.eq.${friendId}),and(sender_id.eq.${friendId},receiver_id.eq.${user.id})`)
            .order('created_at', { ascending: true });

        if (data) setChatHistory(data);

        // Mark as read immediately when loading chat (clears both messages and notifications table)
        markMessagesAsRead(friendId);

        // Update local state to clear numeric indicator immediately
        setFriends(prev => prev.map(f => f.id === friendId ? { ...f, unreadCount: 0 } : f));
    };

    useEffect(() => {
        if (selectedFriend && user) {
            fetchMessages(selectedFriend.id);
            // Mark as read when opening chat
            markMessagesAsRead(selectedFriend.id);

            // Subscribe to new messages
            const channel = supabase
                .channel(`chat_room:${selectedFriend.id}`)
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'messages',
                        filter: `receiver_id=eq.${user.id}`,
                    },
                    (payload) => {
                        if (payload.new.sender_id === selectedFriend.id) {

                            setChatHistory((prev) => [...prev, payload.new as Message]);
                            markMessagesAsRead(selectedFriend.id);
                            // Ensure unread count stays 0 locally if we are looking at the chat
                            setFriends(prev => prev.map(f => f.id === selectedFriend.id ? { ...f, unreadCount: 0 } : f));
                        }
                    }
                )
                .subscribe();

            return () => {
                if (selectedFriend) markMessagesAsRead(selectedFriend.id);
                supabase.removeChannel(channel);
            };
        }
    }, [selectedFriend, user]);

    const handleSendMessage = async () => {
        if (!selectedFriend || !messageInput.trim() || !user) return;

        const { error } = await supabase
            .from('messages')
            .insert({
                sender_id: user.id,
                receiver_id: selectedFriend.id,
                content: messageInput
            });

        if (!error) {
            setMessageInput('');
            fetchMessages(selectedFriend.id);
        }
    };

    if (!user) return null;

    return (
        <div className="flex h-full p-0 md:p-8 pt-4 gap-6 items-stretch animate-slideUp">

            {/* Left Col: Friends & Overview (Hidden on mobile when a friend is selected) */}
            <div className={`${selectedFriend ? 'hidden md:flex' : 'flex'} w-full md:w-96 flex-col gap-6 h-full overflow-hidden shrink-0 transition-all duration-300 p-4 md:p-0`}>

                {/* Requests Notification Card (Mobile/Inline) */}
                {requests.length > 0 && (
                    <div className="bg-surface-dark border border-primary/50 shadow-glow rounded-xl p-4 shrink-0">
                        <h3 className="text-primary font-bold text-sm uppercase mb-3 flex items-center gap-2">
                            <span className="material-symbols-outlined">person_add</span> Solicitudes Pendientes
                        </h3>
                        <div className="space-y-3">
                            {requests.map(req => (
                                <div key={req.id} className="flex items-center gap-3 bg-white/5 p-2 rounded-lg">
                                    <img src={req.sender.avatar} className="size-8 rounded-full" />
                                    <div className="flex-1 overflow-hidden">
                                        <p className="text-white text-sm font-bold truncate">{req.sender.name}</p>
                                        <p className="text-xs text-slate-400">{req.sender.handle.startsWith('@') ? req.sender.handle : `@${req.sender.handle}`}</p>
                                    </div>
                                    <div className="flex gap-1">
                                        <button onClick={() => handleAcceptRequest(req.id)} className="p-1 bg-green-500/20 hover:bg-green-500/40 text-green-400 rounded">
                                            <span className="material-symbols-outlined text-[18px]">check</span>
                                        </button>
                                        <button onClick={() => handleRejectRequest(req.id)} className="p-1 bg-red-500/20 hover:bg-red-500/40 text-red-400 rounded">
                                            <span className="material-symbols-outlined text-[18px]">close</span>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Search My Friends */}
                <div className="bg-surface-dark border border-white/5 rounded-xl p-4 shadow-xl shrink-0">
                    <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-2">Buscar Amigos</h3>
                    <div className="relative">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Buscar en mis contactos..."
                            className="w-full bg-surface-darker border border-white/10 rounded-lg py-2 px-3 pl-9 text-white text-sm focus:border-primary outline-none transition-all focus:shadow-[0_0_10px_rgba(0,214,207,0.1)]"
                        />
                        <span className="material-symbols-outlined absolute left-2 top-2 text-slate-500 text-[20px]">search</span>
                    </div>
                </div>

                {/* Friends List */}
                <div className="bg-surface-dark border border-white/5 rounded-xl flex flex-col overflow-hidden flex-1 min-h-0 shadow-2xl">
                    <div className="p-4 border-b border-white/5 flex justify-between items-center bg-surface-darker/50">
                        <h3 className="text-white font-bold text-sm uppercase tracking-wider">Enlace de Comms</h3>
                        <span className="bg-primary/20 text-primary text-[10px] px-2 py-0.5 rounded-full font-bold self-start">{friends.length} Amigos</span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                        {friends.length === 0 ? (
                            <div className="text-center p-8 text-slate-500 text-xs flex flex-col items-center gap-2">
                                <span className="material-symbols-outlined text-4xl opacity-20">sentiment_dissatisfied</span>
                                <p>No hay conexiones activas.</p>
                                <p>Busca usuarios para conectar.</p>
                            </div>
                        ) : searchQuery.trim() !== '' && filteredFriends.length === 0 ? (
                            <div className="text-center p-8 text-slate-500 text-xs italic">
                                <p>No se encontraron amigos con ese nombre.</p>
                            </div>
                        ) : (
                            (searchQuery.trim() === '' ? friends : filteredFriends).map(friend => (
                                <button
                                    key={friend.id}
                                    onClick={() => setSelectedFriend(friend)}
                                    className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${selectedFriend?.id === friend.id ? 'bg-primary/10 border border-primary/30 shadow-[inset_0_0_10px_rgba(0,214,207,0.1)]' : 'hover:bg-white/5 border border-transparent'}`}
                                >
                                    <div className="relative">
                                        <img src={friend.avatar} alt={friend.name} className="size-10 rounded-full object-cover bg-slate-700" />
                                        <div className={`absolute bottom-0 right-0 size-3 rounded-full border-2 border-surface-dark ${friend.status === 'online' ? 'bg-emerald-500' :
                                            friend.status === 'busy' ? 'bg-yellow-500' : 'bg-slate-500'
                                            }`}></div>
                                    </div>
                                    <div className="flex-1 text-left relative group/info">
                                        <div className="flex justify-between items-center">
                                            <span
                                                className={`text-sm font-bold transition-colors ${selectedFriend?.id === friend.id ? 'text-primary' : 'text-white'}`}
                                            >
                                                {friend.name}
                                            </span>
                                            <div className="flex items-center gap-2">
                                                {friend.unreadCount && friend.unreadCount > 0 ? (
                                                    <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full animate-pulse shadow-glow-red">
                                                        {friend.unreadCount}
                                                    </span>
                                                ) : null}
                                            </div>
                                        </div>
                                        <p className="text-xs text-slate-500 truncate max-w-[150px] font-mono opacity-80">{friend.handle.startsWith('@') ? friend.handle : `@${friend.handle}`}</p>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Right Col: Chat (Fullscreen on mobile when friend selected) */}
            <div className={`${selectedFriend ? 'flex' : 'hidden md:flex'} flex-1 h-full bg-surface-dark md:border border-white/5 md:rounded-xl overflow-hidden relative shadow-2xl flex-col`}>

                {selectedFriend ? (
                    /* Chat Interface */
                    <>
                        <div className="p-4 border-b border-white/5 bg-surface-darker flex justify-between items-center shadow-lg z-10">
                            <div className="flex items-center gap-3">
                                {/* Back Button Mobile */}
                                <button onClick={() => setSelectedFriend(null)} className="md:hidden text-primary p-1 -ml-2">
                                    <span className="material-symbols-outlined text-[28px]">chevron_left</span>
                                </button>

                                <div
                                    onClick={() => navigate(`/profile/${selectedFriend.id}`)}
                                    className="relative cursor-pointer group"
                                >
                                    <img src={selectedFriend.avatar} className="size-10 rounded-full border border-white/10 group-hover:border-primary transition-all shadow-glow-sm" />
                                </div>
                                <div
                                    onClick={() => navigate(`/profile/${selectedFriend.id}`)}
                                    className="cursor-pointer group min-w-0"
                                >
                                    <h3 className="text-white font-bold text-sm group-hover:text-primary transition-colors truncate">{selectedFriend.name}</h3>
                                    <p className="text-slate-400 text-[10px] flex items-center gap-1 font-mono">
                                        <span className={`size-1.5 rounded-full ${selectedFriend.status === 'online' ? 'bg-emerald-500' : 'bg-slate-500'}`}></span>
                                        {selectedFriend.handle.startsWith('@') ? selectedFriend.handle : `@${selectedFriend.handle}`}
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedFriend(null)} className="text-slate-400 hover:text-white p-2 hover:bg-white/5 rounded-full transition-all hidden md:block">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 gap-4 bg-[#111117]/50 flex flex-col-reverse scrollbar-thin scrollbar-thumb-white/10">
                            {[...chatHistory].reverse().map(msg => (
                                <div key={msg.id} className={`flex ${msg.sender_id === user.id ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[85%] md:max-w-[75%] p-3 px-4 text-sm transition-all hover:scale-[1.01] ${msg.sender_id === user.id
                                        ? 'bg-[#00d6cf] text-black font-medium rounded-2xl rounded-tr-sm'
                                        : 'bg-surface-darker border border-white/10 text-slate-200 rounded-2xl rounded-tl-sm shadow-md backdrop-blur-sm'
                                        }`}>
                                        <div className="leading-relaxed break-words">{msg.content}</div>
                                        <div className={`text-[10px] mt-1 text-right block font-mono ${msg.sender_id === user.id ? 'text-black/70 font-bold' : 'text-slate-500'}`}>
                                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="p-4 bg-surface-darker border-t border-white/5 relative z-20 pb-[calc(1rem+env(safe-area-inset-bottom))]">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={messageInput}
                                    onChange={(e) => setMessageInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                    placeholder="Mensaje..."
                                    className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-primary focus:bg-black/60 focus:ring-1 focus:ring-primary/50 outline-none transition-all placeholder:text-slate-500"
                                />
                                <button
                                    onClick={handleSendMessage}
                                    className="bg-primary text-[#111117] px-4 rounded-xl transition-all duration-300 flex items-center justify-center shadow-glow"
                                >
                                    <span className="material-symbols-outlined">send</span>
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    /* Default Stats View */
                    <div className="h-full flex flex-col relative overflow-hidden">
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10 pointer-events-none"></div>

                        <div className="flex-1 flex flex-col items-center justify-center p-8 z-10 text-center">
                            <div className="size-24 rounded-full bg-white/5 flex items-center justify-center mb-6 animate-pulse">
                                <span className="material-symbols-outlined text-5xl text-slate-500">chat</span>
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-2">Comunicaciones Seguras</h2>
                            <p className="text-slate-400 max-w-md">
                                Inicia una transmisión encriptada con tus amigos. Selecciona un contacto de la lista para comenzar.
                            </p>
                        </div>

                        <div className="p-6 text-center border-t border-white/5 bg-surface-darker/30">
                            <p className="text-slate-500 text-sm font-mono flex items-center justify-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                                Selecciona un amigo para abrir un canal privado.
                            </p>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

export default Chat;
