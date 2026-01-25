import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { User, Post } from '../types';

export const PublicProfile: React.FC = () => {
    const { userId } = useParams<{ userId: string }>();
    const { user: currentUser } = useAuth();
    const navigate = useNavigate();

    // Core State
    const [profile, setProfile] = useState<User | null>(null);
    const [posts, setPosts] = useState<Post[]>([]);
    const [friends, setFriends] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [friendStatus, setFriendStatus] = useState<'none' | 'pending' | 'accepted' | 'rejected'>('none');

    // UI State
    const [activeTab, setActiveTab] = useState<'posts' | 'friends'>('posts');
    const [showMessageModal, setShowMessageModal] = useState(false);
    const [messageText, setMessageText] = useState('');
    const [isFollowing, setIsFollowing] = useState(false);

    useEffect(() => {
        if (currentUser && userId === currentUser.id) {
            navigate('/profile');
            return;
        }
        fetchProfile();
        checkFriendStatus();
        checkFollowStatus();
        fetchFriends();

        // Realtime Subscription for friendship changes
        const channel = supabase
            .channel(`public_friendship:${userId}`)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'friend_requests' },
                (payload) => {
                    const oldData = payload.old as any;
                    const newData = payload.new as any;

                    // Check if this change involves the profile we are looking at
                    const involvesThisProfile =
                        (newData?.sender_id === userId || newData?.receiver_id === userId) ||
                        (oldData?.sender_id === userId || oldData?.receiver_id === userId);

                    if (involvesThisProfile) {
                        checkFriendStatus();
                        fetchFriends();
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [userId, currentUser]);

    const fetchFriends = async () => {
        if (!userId) return;
        const { data } = await supabase
            .from('friend_requests')
            .select(`
                id,
                sender:sender_id(id, name, handle, avatar, role),
                receiver:receiver_id(id, name, handle, avatar, role)
            `)
            .eq('status', 'accepted')
            .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`);

        if (data) {
            const formattedFriends = data.map((req: any) => {
                return req.sender.id === userId ? req.receiver : req.sender;
            });
            setFriends(formattedFriends);
        }
    };

    const fetchProfile = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (data) setProfile(data);

            // Fetch posts
            const { data: postsData } = await supabase
                .from('posts')
                .select('*, profiles(*)')
                .eq('author_id', userId)
                .order('created_at', { ascending: false });

            if (postsData) setPosts(postsData);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const checkFollowStatus = async () => {
        if (!currentUser || !userId) return;
        const { data } = await supabase
            .from('follows')
            .select('*')
            .eq('follower_id', currentUser.id)
            .eq('following_id', userId)
            .maybeSingle();

        setIsFollowing(!!data);
    };

    const checkFriendStatus = async () => {
        if (!currentUser || !userId) return;

        const { data } = await supabase
            .from('friend_requests')
            .select('*')
            .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${userId}),and(sender_id.eq.${userId},receiver_id.eq.${currentUser.id})`)
            .maybeSingle();

        if (data) {
            setFriendStatus(data.status as any);
        } else {
            setFriendStatus('none');
        }
    };

    const handleFollow = async () => {
        if (!currentUser || !userId) return;
        const { error } = await supabase
            .from('follows')
            .insert({ follower_id: currentUser.id, following_id: userId });

        if (!error) setIsFollowing(true);
    };

    const handleUnfollow = async () => {
        if (!currentUser || !userId) return;

        // If they are friends, warn that unfollowing breaks the friendship
        if (friendStatus === 'accepted') {
            if (!window.confirm("Si dejas de seguir a este usuario, la amistad se romperá automáticamente. ¿Continuar?")) return;
        }

        const { error } = await supabase
            .from('follows')
            .delete()
            .eq('follower_id', currentUser.id)
            .eq('following_id', userId);

        if (!error) {
            setIsFollowing(false);
            // The DB trigger will handle deleting friend_requests,
            // but we update local state for immediate feedback
            if (friendStatus === 'accepted') {
                setFriendStatus('none');
                fetchFriends();
            }
        }
    };

    const sendFriendRequest = async () => {
        if (!currentUser || !profile) return;

        const { error } = await supabase
            .from('friend_requests')
            .upsert({
                sender_id: currentUser.id,
                receiver_id: profile.id,
                status: 'pending'
            }, {
                onConflict: 'sender_id,receiver_id'
            });

        if (!error) {
            setFriendStatus('pending');
        }
    };

    const sendMessage = async () => {
        if (!currentUser || !profile || !messageText.trim()) return;

        const { error } = await supabase
            .from('messages')
            .insert({
                sender_id: currentUser.id,
                receiver_id: profile.id,
                content: messageText
            });

        if (!error) {
            setMessageText('');
            setShowMessageModal(false);
        }
    };

    const handleRemoveFriend = async () => {
        if (!currentUser || !profile) return;

        if (!window.confirm("¿Seguro que quieres romper la amistad con este usuario?")) return;

        const { error } = await supabase
            .from('friend_requests')
            .delete()
            .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${profile.id}),and(sender_id.eq.${profile.id},receiver_id.eq.${currentUser.id})`);

        if (!error) {
            setFriendStatus('none');
            fetchFriends();
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-background-dark">
            <div className="flex flex-col items-center gap-4">
                <span className="size-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></span>
                <p className="text-primary font-mono animate-pulse">Estableciendo Enlace...</p>
            </div>
        </div>
    );

    if (!profile) return (
        <div className="min-h-screen flex items-center justify-center bg-background-dark p-8">
            <div className="text-center space-y-4">
                <span className="material-symbols-outlined text-6xl text-red-500/50">person_off</span>
                <h1 className="text-2xl font-bold text-white">Explorador no encontrado</h1>
                <button onClick={() => navigate('/community')} className="px-6 py-2 bg-primary text-background-dark rounded-lg font-bold">Volver al Feed</button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-background-dark text-white p-4 md:p-8 animate-fadeIn">
            <div className="max-w-5xl mx-auto space-y-8 pb-20">
                {/* Header Profile Card */}
                <div className="relative bg-surface-dark border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
                    <div className="h-48 md:h-64 relative bg-slate-900">
                        <div className="absolute inset-0 bg-cover bg-center opacity-40" style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&q=80")' }}></div>
                        <div className="absolute inset-0 bg-gradient-to-t from-surface-dark via-transparent to-transparent"></div>
                    </div>

                    <div className="px-6 md:px-10 pb-10">
                        <div className="flex flex-col md:flex-row gap-8 items-end -mt-16 md:-mt-20 relative z-10">
                            <div className="relative group">
                                <div className="size-32 md:size-40 rounded-3xl border-4 border-surface-dark overflow-hidden bg-surface-darker shadow-glow-lg transition-transform hover:scale-105 duration-300">
                                    <img src={profile.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"} className="w-full h-full object-cover" />
                                </div>
                                <div className="absolute -bottom-2 -right-2 size-8 bg-primary rounded-xl flex items-center justify-center shadow-lg">
                                    <span className="material-symbols-outlined text-[20px] text-background-dark">verified</span>
                                </div>
                            </div>

                            <div className="flex-1 space-y-1">
                                <h1 className="text-4xl font-serif font-bold text-white tracking-tight">{profile.name}</h1>
                                <div className="flex items-center gap-3 text-lg font-mono text-primary/80">
                                    <span>{profile.handle.startsWith('@') ? profile.handle : `@${profile.handle}`}</span>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-4 mb-2">
                                {/* Follow Button */}
                                {isFollowing ? (
                                    <button onClick={handleUnfollow} className="px-6 py-3 bg-surface-darker/50 border border-white/10 text-white font-bold rounded-2xl hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 transition-all flex items-center gap-2 backdrop-blur-sm">
                                        <span className="material-symbols-outlined text-[20px]">person_remove</span>
                                        Siguiendo
                                    </button>
                                ) : (
                                    <button onClick={handleFollow} className="px-6 py-3 bg-white/5 border border-white/10 text-white font-bold rounded-2xl hover:bg-primary hover:text-background-dark transition-all flex items-center gap-2">
                                        <span className="material-symbols-outlined text-[20px]">person_add</span>
                                        Seguir
                                    </button>
                                )}

                                {/* Friendship Section */}
                                {(friendStatus === 'none' || friendStatus === 'rejected') && (
                                    <button onClick={sendFriendRequest} className="px-6 py-3 bg-primary text-background-dark font-bold rounded-2xl hover:bg-white transition-all shadow-glow hover:shadow-glow-lg flex items-center gap-2">
                                        <span className="material-symbols-outlined font-bold">handshake</span>
                                        {friendStatus === 'rejected' ? 'Reintentar Amistad' : 'Solicitar Amistad'}
                                    </button>
                                )}
                                {friendStatus === 'pending' && (
                                    <div className="px-6 py-3 bg-surface-darker/50 border border-white/10 text-slate-400 rounded-2xl flex items-center gap-2 backdrop-blur-sm">
                                        <span className="material-symbols-outlined animate-spin text-[20px]">hourglass_top</span>
                                        Enlace Pendiente
                                    </div>
                                )}
                                {friendStatus === 'accepted' && (
                                    <div className="flex gap-3">
                                        <div className="px-6 py-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-2xl flex items-center gap-2 cursor-default backdrop-blur-sm">
                                            <span className="material-symbols-outlined font-bold">shield_with_heart</span>
                                            Amigos
                                        </div>
                                        <button onClick={() => setShowMessageModal(true)} className="size-12 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all flex items-center justify-center">
                                            <span className="material-symbols-outlined">chat</span>
                                        </button>
                                        <button onClick={handleRemoveFriend} className="size-12 bg-red-500/5 hover:bg-red-500/10 border border-red-500/20 rounded-2xl transition-all flex items-center justify-center text-red-400" title="Romper Amistad">
                                            <span className="material-symbols-outlined">link_off</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content Tabs & Bio */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Sidebar Bio */}
                    <div className="lg:col-span-1 space-y-6">
                        <section className="bg-surface-dark border border-white/10 rounded-3xl p-6 space-y-4 shadow-xl">
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                <span className="material-symbols-outlined text-sm">info</span>
                                Sobre el Explorador
                            </h3>
                            <p className="text-slate-300 leading-relaxed">
                                {profile.bio || "Este tripulante aún no ha redactado su bitácora de biografía."}
                                {!profile.bio && <span className="block italic text-slate-500 mt-2 text-xs">Información clasificada.</span>}
                            </p>
                            <div className="pt-4 border-t border-white/5 space-y-4">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-500">Misión Iniciada</span>
                                    <span className="font-mono text-slate-300">JAN 2024</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-500">Reputación</span>
                                    <span className="text-primary font-bold">NOBLE</span>
                                </div>
                            </div>
                        </section>

                        {/* Quick Stats */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-surface-dark border border-white/5 rounded-2xl p-4 text-center">
                                <p className="text-2xl font-serif font-bold text-white">{posts.length}</p>
                                <p className="text-[10px] text-slate-500 uppercase tracking-wider">Posts</p>
                            </div>
                            <div className="bg-surface-dark border border-white/5 rounded-2xl p-4 text-center">
                                <p className="text-2xl font-serif font-bold text-white">{friends.length}</p>
                                <p className="text-[10px] text-slate-500 uppercase tracking-wider">Amigos</p>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Main Feed */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Tabs Header */}
                        <div className="flex gap-2 p-1.5 bg-surface-dark border border-white/10 rounded-2xl w-fit">
                            <button
                                onClick={() => setActiveTab('posts')}
                                className={`px-6 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'posts' ? 'bg-primary text-background-dark' : 'text-slate-400 hover:text-white'}`}
                            >
                                <span className="material-symbols-outlined text-[18px]">article</span>
                                Bitácora
                            </button>
                            <button
                                onClick={() => setActiveTab('friends')}
                                className={`px-6 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'friends' ? 'bg-primary text-background-dark' : 'text-slate-400 hover:text-white'}`}
                            >
                                <span className="material-symbols-outlined text-[18px]">group</span>
                                Red de Amigos
                            </button>
                        </div>

                        {/* Tab Content */}
                        <div className="min-h-[400px]">
                            {activeTab === 'posts' ? (
                                <div className="space-y-6">
                                    {posts.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-20 text-slate-500 bg-surface-dark/40 rounded-3xl border border-white/5 border-dashed">
                                            <span className="material-symbols-outlined text-5xl opacity-20 mb-3">history_edu</span>
                                            <p className="text-sm font-medium">No hay registros públicos en esta bitácora.</p>
                                        </div>
                                    ) : (
                                        posts.map((post) => (
                                            <div key={post.id} className="bg-surface-dark border border-white/10 rounded-3xl p-6 hover:border-primary/20 transition-all group overflow-hidden relative">
                                                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10">
                                                    <span className="material-symbols-outlined text-6xl">satellite</span>
                                                </div>
                                                <p className="text-slate-200 text-lg leading-relaxed mb-6 block">{post.content}</p>
                                                {post.bg_image && (
                                                    <div className="rounded-2xl overflow-hidden mb-6 border border-white/10 shadow-lg">
                                                        <img src={post.bg_image} alt="Media" className="w-full h-80 object-cover transition-transform group-hover:scale-105 duration-700" />
                                                    </div>
                                                )}
                                                <div className="flex items-center justify-between text-xs font-mono">
                                                    <span className="text-slate-500">{new Date(post.created_at).toLocaleString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                                                    <div className="flex items-center gap-4">
                                                        <span className="flex items-center gap-1 text-slate-400"><span className="material-symbols-outlined text-sm">thumb_up</span> {post.likes_count || 0}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {friends.length === 0 ? (
                                        <div className="col-span-full flex flex-col items-center justify-center py-20 text-slate-500 bg-surface-dark/40 rounded-3xl border border-white/5 border-dashed">
                                            <span className="material-symbols-outlined text-5xl opacity-20 mb-3">safety_divider</span>
                                            <p className="text-sm font-medium">Este explorador aún no ha formado amistades.</p>
                                        </div>
                                    ) : (
                                        friends.map((friend) => (
                                            <div
                                                key={friend.id}
                                                onClick={() => {
                                                    navigate(`/profile/${friend.id}`);
                                                    window.scrollTo(0, 0);
                                                }}
                                                className="bg-surface-dark border border-white/5 rounded-2xl p-4 flex items-center gap-4 hover:border-primary/30 cursor-pointer transition-all hover:bg-white/5 group"
                                            >
                                                <img src={friend.avatar} className="size-14 rounded-xl object-cover border border-white/10 group-hover:border-primary transition-all" />
                                                <div className="min-w-0">
                                                    <p className="font-bold text-white truncate">{friend.name}</p>
                                                    <p className="text-xs text-primary font-mono">{friend.handle.startsWith('@') ? friend.handle : `@${friend.handle}`}</p>
                                                    <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-tighter">{friend.role}</p>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Message Modal */}
            {showMessageModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fadeIn">
                    <div className="bg-surface-dark border border-white/10 rounded-3xl w-full max-w-md overflow-hidden shadow-glow-lg border-primary/20">
                        <div className="bg-primary/5 p-6 border-b border-white/5">
                            <h3 className="text-xl font-bold text-white flex items-center gap-3">
                                <span className="material-symbols-outlined text-primary">terminal</span>
                                Transmisión Privada
                            </h3>
                            <p className="text-slate-400 text-sm mt-1">Hacia {profile.handle.startsWith('@') ? profile.handle : `@${profile.handle}`}</p>
                        </div>
                        <div className="p-6">
                            <textarea
                                value={messageText}
                                onChange={(e) => setMessageText(e.target.value)}
                                className="w-full h-40 bg-surface-darker/50 border border-white/10 rounded-2xl p-4 text-white focus:border-primary outline-none resize-none mb-6 placeholder:text-slate-600 font-medium"
                                placeholder="Escribe tu mensaje encriptado para este tripulante..."
                            />
                            <div className="flex gap-4">
                                <button
                                    onClick={() => setShowMessageModal(false)}
                                    className="flex-1 px-4 py-3 text-slate-400 hover:text-white font-bold transition-all"
                                >
                                    Abortar
                                </button>
                                <button
                                    onClick={sendMessage}
                                    className="flex-[2] bg-primary text-background-dark px-4 py-3 rounded-2xl font-bold hover:bg-white transition-all shadow-glow"
                                >
                                    Transmitir
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
