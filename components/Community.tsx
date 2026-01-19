import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CommunityPost } from '../types';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabase';

const Community: React.FC = () => {
    const { user } = useAuth();
    const [posts, setPosts] = useState<CommunityPost[]>([]);
    const [newPostContent, setNewPostContent] = useState('');
    const [inputActive, setInputActive] = useState(false);
    const [activeFilter, setActiveFilter] = useState<'trending' | 'recent' | 'verified'>('trending');
    const [isLoading, setIsLoading] = useState(true);
    const [expandedCommentsId, setExpandedCommentsId] = useState<string | null>(null);
    const [comments, setComments] = useState<any[]>([]);
    const [newComment, setNewComment] = useState('');
    const [isSubmittingComment, setIsSubmittingComment] = useState(false);
    const [userLikes, setUserLikes] = useState<string[]>([]);
    const [mediaUrl, setMediaUrl] = useState('');
    const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
    const [linkUrl, setLinkUrl] = useState('');
    const [showMediaModal, setShowMediaModal] = useState(false);
    const [showLinkModal, setShowLinkModal] = useState(false);

    useEffect(() => {
        fetchPosts();
        if (user) fetchUserLikes();
    }, [user]);

    const fetchUserLikes = async () => {
        if (!user) return;
        const { data } = await supabase
            .from('post_likes')
            .select('post_id')
            .eq('user_id', user.id);

        if (data) setUserLikes(data.map(l => l.post_id));
    };

    const fetchPosts = async () => {
        setIsLoading(true);
        const { data, error } = await supabase
            .from('posts')
            .select(`
                id,
                content,
                created_at,
                likes_count,
                bg_image,
                tags,
                author_id,
                media_url,
                media_type,
                link_url,
                link_title,
                link_description,
                profiles (name, handle, avatar, role)
            `)
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Error fetching posts", error);
        } else if (data) {
            // Also fetch comment counts
            const { data: countData } = await supabase
                .from('comments')
                .select('post_id');

            const commentCounts = (countData || []).reduce((acc: any, curr: any) => {
                acc[curr.post_id] = (acc[curr.post_id] || 0) + 1;
                return acc;
            }, {});

            const mappedPosts: CommunityPost[] = data.map((p: any) => ({
                id: p.id,
                author_id: p.author_id,
                authorName: p.profiles?.name || 'Unknown',
                authorHandle: p.profiles?.handle || '@unknown',
                avatar: p.profiles?.avatar || '',
                content: p.content,
                timestamp: new Date(p.created_at),
                likes: p.likes_count || 0,
                comments: commentCounts[p.id] || 0,
                tags: p.tags ? (Array.isArray(p.tags) ? p.tags : []) : [],
                bgImage: p.bg_image,
                isVerified: p.profiles?.role !== 'user',
                mediaUrl: p.media_url,
                mediaType: p.media_type,
                linkUrl: p.link_url,
                linkTitle: p.link_title,
                linkDescription: p.link_description
            }));
            setPosts(mappedPosts);
        }
        setIsLoading(false);
    };

    const handlePublish = async () => {
        if (!newPostContent.trim() || !user || !user.id) return;

        const { error } = await supabase.from('posts').insert({
            author_id: user.id,
            content: newPostContent,
            tags: [],
            media_url: mediaUrl || null,
            media_type: mediaType || null,
            link_url: linkUrl || null
        });

        if (error) {
            console.error("Error creating post", error);
            alert("Error al publicar: " + error.message);
        } else {
            setNewPostContent('');
            setMediaUrl('');
            setMediaType(null);
            setLinkUrl('');
            fetchPosts();
            setActiveFilter('recent');
        }
    };

    const handleLike = async (postId: string) => {
        if (!user) {
            alert("Debes iniciar sesión para dar me gusta");
            return;
        }

        const isLiked = userLikes.includes(postId);

        if (isLiked) {
            // Unlike
            const { error } = await supabase
                .from('post_likes')
                .delete()
                .eq('post_id', postId)
                .eq('user_id', user.id);

            if (!error) {
                setUserLikes(prev => prev.filter(id => id !== postId));
                setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes: Math.max(0, p.likes - 1) } : p));
                // Update counter in DB
                await supabase.rpc('decrement_likes', { post_id: postId });
            }
        } else {
            // Like
            const { error } = await supabase
                .from('post_likes')
                .insert({ post_id: postId, user_id: user.id });

            if (!error) {
                setUserLikes(prev => [...prev, postId]);
                setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes: p.likes + 1 } : p));
                // Update counter in DB
                await supabase.rpc('increment_likes', { post_id: postId });
            } else if (error.code === '23505') { // Unique constraint
                setUserLikes(prev => [...prev, postId]);
            }
        }
    };

    const toggleComments = async (postId: string) => {
        if (expandedCommentsId === postId) {
            setExpandedCommentsId(null);
            setComments([]);
            return;
        }

        setExpandedCommentsId(postId);
        setIsSubmittingComment(true);
        const { data, error } = await supabase
            .from('comments')
            .select(`
                id,
                content,
                created_at,
                profiles (name, handle, avatar)
            `)
            .eq('post_id', postId)
            .order('created_at', { ascending: true });

        if (data) setComments(data);
        setIsSubmittingComment(false);
    };

    const handleAddComment = async (postId: string) => {
        if (!newComment.trim() || !user) return;

        setIsSubmittingComment(true);
        const { data, error } = await supabase
            .from('comments')
            .insert({
                post_id: postId,
                author_id: user.id,
                content: newComment.trim()
            })
            .select(`
                id,
                content,
                created_at,
                profiles (name, handle, avatar)
            `)
            .single();

        if (error) {
            alert("Error al comentar: " + error.message);
        } else {
            setComments(prev => [...prev, data]);
            setNewComment('');
            setPosts(prev => prev.map(p => p.id === postId ? { ...p, comments: p.comments + 1 } : p));
        }
        setIsSubmittingComment(false);
    };

    const getFilteredPosts = () => {
        let filtered = [...posts];

        switch (activeFilter) {
            case 'recent':
                return filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
            case 'trending':
                return filtered.sort((a, b) => b.likes - a.likes);
            case 'verified':
                return filtered.filter(p => p.isVerified).sort((a, b) => b.likes - a.likes);
            default:
                return filtered;
        }
    };

    // Helper to format time relative (e.g., "hace 2h")
    const formatTimeAgo = (date: Date) => {
        const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + " años";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + " meses";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + " días";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + "h";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + " mins";
        return Math.floor(seconds) + " segs";
    };

    const displayPosts = getFilteredPosts();

    return (
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 pb-24">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start h-full">
                {/* LEFT COLUMN */}
                <aside className="hidden lg:flex lg:col-span-3 flex-col gap-6 sticky top-24">
                    {/* Navigation Module */}
                    <nav className="bg-surface-dark rounded-xl border border-white/5 p-4 flex flex-col gap-2 shadow-lg">
                        <div className="px-3 py-2 text-xs font-bold text-slate-500 uppercase tracking-wider font-mono">Navegación</div>
                        <Link to="/" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all group">
                            <span className="material-symbols-outlined text-[22px] group-hover:text-primary transition-colors">satellite_alt</span>
                            <span className="text-sm font-medium">Centro de Mando</span>
                        </Link>
                        <Link to="/milestones" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all group">
                            <span className="material-symbols-outlined text-[22px] group-hover:text-primary transition-colors">rocket</span>
                            <span className="text-sm font-medium">Historial de Lanzamientos</span>
                        </Link>
                        <Link to="/support" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all group">
                            <span className="material-symbols-outlined text-[22px] group-hover:text-primary transition-colors">handyman</span>
                            <span className="text-sm font-medium">Soporte Técnico</span>
                        </Link>
                        <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-primary/10 text-primary border-l-2 border-primary transition-all" href="#">
                            <span className="material-symbols-outlined icon-fill text-[22px]">forum</span>
                            <span className="text-sm font-semibold">Feed</span>
                        </a>
                    </nav>
                    {/* Mini Status Card */}
                    <div className="bg-gradient-to-br from-surface-dark to-surface-darker rounded-xl border border-white/5 p-5 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                            <span className="material-symbols-outlined text-6xl">public</span>
                        </div>
                        <h3 className="text-white font-serif font-medium mb-1">Vuelo Starship 5</h3>
                        <p className="text-slate-400 text-xs mb-4">Ventana de Lanzamiento: T-menos 48h</p>
                        <div className="flex items-center gap-2 mb-2">
                            <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                                <div className="h-full bg-primary w-[75%]"></div>
                            </div>
                            <span className="text-xs text-primary font-mono">75%</span>
                        </div>
                        <p className="text-[10px] text-slate-500">Revisión de Preparación Completa</p>
                    </div>
                </aside>

                {/* CENTER COLUMN: Feed */}
                <section className="col-span-1 lg:col-span-6 flex flex-col gap-6">
                    {/* Headline & Filters */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <h2 className="text-2xl font-bold text-white tracking-tight">Transmisiones Activas</h2>
                        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-hide">
                            <button
                                onClick={() => setActiveFilter('trending')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium whitespace-nowrap transition-colors ${activeFilter === 'trending' ? 'bg-surface-dark border-primary/30 text-primary shadow-glow' : 'bg-surface-dark border-white/5 text-slate-400 hover:text-white'}`}
                            >
                                <span className="material-symbols-outlined text-[16px]">trending_up</span>
                                Relevancia (Líderes)
                            </button>
                            <button
                                onClick={() => setActiveFilter('recent')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium whitespace-nowrap transition-colors ${activeFilter === 'recent' ? 'bg-surface-dark border-primary/30 text-primary shadow-glow' : 'bg-surface-dark border-white/5 text-slate-400 hover:text-white'}`}
                            >
                                <span className="material-symbols-outlined text-[16px]">schedule</span>
                                Recientes
                            </button>
                            <button
                                onClick={() => setActiveFilter('trending')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium whitespace-nowrap transition-colors ${activeFilter === 'trending' ? 'bg-surface-dark border-primary/30 text-primary shadow-glow' : 'bg-surface-dark border-white/5 text-slate-400 hover:text-white'}`}
                            >
                                <span className="material-symbols-outlined text-[16px]">favorite</span>
                                Más Me Gusta
                            </button>
                            <button
                                onClick={() => setActiveFilter('verified')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium whitespace-nowrap transition-colors ${activeFilter === 'verified' ? 'bg-surface-dark border-primary/30 text-primary shadow-glow' : 'bg-surface-dark border-white/5 text-slate-400 hover:text-white'}`}
                            >
                                <span className="material-symbols-outlined text-[16px]">verified_user</span>
                                Verificados
                            </button>
                        </div>
                    </div>

                    {/* Create Post Input */}
                    {user ? (
                        <div className={`bg-surface-dark rounded-xl border border-white/5 p-4 flex gap-4 items-start transition-all ${inputActive ? 'ring-1 ring-primary/50' : ''}`}>
                            <div className="size-10 rounded-full bg-surface-darker border border-white/10 overflow-hidden shrink-0">
                                <img alt="Me" className="w-full h-full object-cover" src={user.avatar} />
                            </div>
                            <div className="flex-1 flex flex-col gap-2">
                                <textarea
                                    value={newPostContent}
                                    onChange={(e) => setNewPostContent(e.target.value)}
                                    onFocus={() => setInputActive(true)}
                                    onBlur={() => setInputActive(false)}
                                    className="w-full bg-transparent border-none text-white placeholder-slate-500 focus:ring-0 resize-none text-sm p-0 pt-1"
                                    placeholder={`Transmisión de ${user.name}...`}
                                    rows={2}
                                ></textarea>
                                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setShowMediaModal(true)}
                                            className={`transition-colors p-1 ${mediaUrl ? 'text-primary' : 'text-slate-400 hover:text-primary'}`}
                                            title="Agregar imagen o video"
                                        >
                                            <span className="material-symbols-outlined text-[20px]">image</span>
                                        </button>
                                        <button
                                            onClick={() => setShowLinkModal(true)}
                                            className={`transition-colors p-1 ${linkUrl ? 'text-primary' : 'text-slate-400 hover:text-primary'}`}
                                            title="Agregar enlace"
                                        >
                                            <span className="material-symbols-outlined text-[20px]">link</span>
                                        </button>
                                        {mediaUrl && (
                                            <span className="text-xs text-primary flex items-center gap-1">
                                                <span className="material-symbols-outlined text-[14px]">check_circle</span>
                                                {mediaType === 'image' ? 'Imagen' : 'Video'} adjunto
                                            </span>
                                        )}
                                        {linkUrl && (
                                            <span className="text-xs text-primary flex items-center gap-1">
                                                <span className="material-symbols-outlined text-[14px]">check_circle</span>
                                                Enlace adjunto
                                            </span>
                                        )}
                                    </div>
                                    <button
                                        onClick={handlePublish}
                                        className="bg-primary text-background-dark hover:bg-primary/90 px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide transition-colors"
                                    >
                                        Transmitir
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-surface-dark rounded-xl border border-white/5 p-4 text-center">
                            <p className="text-slate-400 text-sm mb-2">Inicia sesión para transmitir a la comunidad.</p>
                            <Link to="/login" className="text-primary hover:underline text-sm font-bold">Iniciar Sesión</Link>
                        </div>
                    )}

                    {/* Post List */}
                    {isLoading ? (
                        <div className="py-12 text-center text-slate-500">Cargando transmisiones...</div>
                    ) : displayPosts.length === 0 ? (
                        <div className="py-12 text-center text-slate-500">No hay transmisiones activas aún.</div>
                    ) : (
                        displayPosts.map(post => (
                            <article key={post.id} className={`bg-surface-dark rounded-xl border ${post.bgImage ? 'border-white/5 overflow-hidden' : 'border-white/5 p-4'} hover:border-white/10 transition-colors`}>
                                {post.bgImage ? (
                                    <>
                                        <div className="h-48 w-full bg-cover bg-center relative" style={{ backgroundImage: `url('${post.bgImage}')` }}>
                                            <div className="absolute inset-0 bg-gradient-to-t from-surface-dark to-transparent"></div>
                                            <div className="absolute bottom-4 left-4 right-4">
                                                {post.tags && (
                                                    <div className="flex gap-2 mb-2">
                                                        {post.tags.map((tag, idx) => (
                                                            <span key={idx} className={`px-2 py-0.5 rounded bg-${tag.color}-500/10 border border-${tag.color}-500/20 text-${tag.color}-400 text-[10px] font-bold uppercase tracking-wider`}>
                                                                {tag.label}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                                <h3 className="text-xl font-bold text-white leading-tight">Actualización Importante: {post.content.substring(0, 40)}...</h3>
                                            </div>
                                        </div>
                                        <div className="p-4 pt-2">
                                            <div className="flex items-center gap-2 text-xs text-slate-400 mb-3">
                                                <span className="font-medium text-white">{post.authorHandle}</span>
                                                <span>•</span>
                                                <span>hace {formatTimeAgo(post.timestamp)}</span>
                                            </div>
                                            <p className="text-slate-300 text-sm leading-relaxed mb-4">
                                                {post.content}
                                            </p>
                                            <div className="flex flex-col border-t border-white/5 mt-2">
                                                <div className="flex items-center justify-between pt-3">
                                                    <div className="flex items-center gap-4">
                                                        <button
                                                            onClick={() => handleLike(post.id)}
                                                            className={`flex items-center gap-1.5 transition-colors group ${userLikes.includes(post.id) ? 'text-primary' : 'text-slate-400 hover:text-primary'}`}
                                                        >
                                                            <span className={`material-symbols-outlined text-[18px] ${userLikes.includes(post.id) ? 'icon-fill' : 'group-hover:icon-fill'}`}>thumb_up</span>
                                                            <span className="text-xs font-medium">{post.likes}</span>
                                                        </button>
                                                        <button
                                                            onClick={() => toggleComments(post.id)}
                                                            className={`flex items-center gap-1.5 transition-colors ${expandedCommentsId === post.id ? 'text-white' : 'text-slate-400 hover:text-white'}`}
                                                        >
                                                            <span className={`material-symbols-outlined text-[18px] ${expandedCommentsId === post.id ? 'icon-fill' : ''}`}>chat_bubble</span>
                                                            <span className="text-xs font-medium">{post.comments}</span>
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Comments Section */}
                                                {expandedCommentsId === post.id && (
                                                    <div className="mt-4 space-y-4 animate-fadeIn">
                                                        <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                                            {comments.length === 0 && !isSubmittingComment && (
                                                                <p className="text-xs text-slate-500 italic">No hay comentarios aún. ¡Sé el primero!</p>
                                                            )}
                                                            {comments.map(c => (
                                                                <div key={c.id} className="flex gap-2 items-start bg-white/5 p-2 rounded-lg">
                                                                    <img src={c.profiles?.avatar} className="size-6 rounded-full shrink-0" alt="" />
                                                                    <div className="flex-1 min-w-0">
                                                                        <div className="flex items-center gap-2 mb-0.5">
                                                                            <span className="text-[10px] font-bold text-white">{c.profiles?.name}</span>
                                                                            <span className="text-primary text-[9px] font-mono">{c.profiles?.handle.startsWith('@') ? c.profiles?.handle : `@${c.profiles?.handle}`}</span>
                                                                        </div>
                                                                        <p className="text-xs text-slate-300 leading-snug">{c.content}</p>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                        {user && (
                                                            <div className="flex gap-2 items-center">
                                                                <input
                                                                    type="text"
                                                                    value={newComment}
                                                                    onChange={(e) => setNewComment(e.target.value)}
                                                                    placeholder="Escribe un comentario..."
                                                                    className="flex-1 bg-surface-darker border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-primary/50"
                                                                    onKeyDown={(e) => e.key === 'Enter' && handleAddComment(post.id)}
                                                                />
                                                                <button
                                                                    disabled={isSubmittingComment || !newComment.trim()}
                                                                    onClick={() => handleAddComment(post.id)}
                                                                    className="text-primary hover:text-white disabled:opacity-50 transition-colors"
                                                                >
                                                                    <span className="material-symbols-outlined text-[20px]">send</span>
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    /* Standard Text Post */
                                    <>
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex gap-3">
                                                <Link to={`/profile/${post.author_id}`} className="size-10 rounded-full bg-indigo-900/50 border border-indigo-500/20 flex items-center justify-center shrink-0 overflow-hidden hover:ring-2 hover:ring-primary transition-all">
                                                    <img src={post.avatar} alt="Author" className="w-full h-full object-cover" />
                                                </Link>
                                                <div>
                                                    <Link to={`/profile/${post.author_id}`} className="text-base font-bold text-white mb-1 flex items-center gap-1 hover:text-primary transition-colors">
                                                        {post.authorName}
                                                        {post.isVerified && <span className="material-symbols-outlined text-[14px] text-primary" title="Verified">verified</span>}
                                                    </Link>

                                                    <div className="flex items-center gap-2 text-xs text-slate-500">
                                                        <span className="text-slate-300">{post.authorHandle}</span>
                                                        <span>•</span>
                                                        <span>hace {formatTimeAgo(post.timestamp)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="shrink-0 px-2 py-1 rounded bg-primary/10 border border-primary/20">
                                                <span className="flex items-center gap-1 text-[10px] font-bold text-primary uppercase tracking-wide">
                                                    <span className="material-symbols-outlined text-[12px]">public</span>
                                                    Público
                                                </span>
                                            </div>
                                        </div>
                                        <p className="text-slate-300 text-sm leading-relaxed mt-3 mb-4 pl-[52px]">
                                            {post.content}
                                        </p>

                                        {/* Media Attachment */}
                                        {post.mediaUrl && (
                                            <div className="pl-[52px] mb-4">
                                                {post.mediaType === 'image' ? (
                                                    <img
                                                        src={post.mediaUrl}
                                                        alt="Post media"
                                                        className="w-full max-h-96 object-cover rounded-lg border border-white/10"
                                                    />
                                                ) : (
                                                    <video
                                                        src={post.mediaUrl}
                                                        controls
                                                        className="w-full max-h-96 rounded-lg border border-white/10"
                                                    />
                                                )}
                                            </div>
                                        )}

                                        {/* Link Attachment */}
                                        {post.linkUrl && (
                                            <div className="pl-[52px] mb-4">
                                                <a
                                                    href={post.linkUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="block border border-white/10 rounded-lg p-3 bg-surface-darker hover:bg-white/5 transition-colors group"
                                                >
                                                    <div className="flex items-start gap-3">
                                                        <span className="material-symbols-outlined text-primary text-[24px] group-hover:scale-110 transition-transform">link</span>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-xs text-slate-400 mb-1">Enlace externo</p>
                                                            <p className="text-sm text-white truncate group-hover:text-primary transition-colors">{post.linkUrl}</p>
                                                        </div>
                                                        <span className="material-symbols-outlined text-slate-600 group-hover:text-primary transition-colors">open_in_new</span>
                                                    </div>
                                                </a>
                                            </div>
                                        )}

                                        <div className="flex flex-col border-t border-white/5 pt-3 ml-[52px]">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <button
                                                        onClick={() => handleLike(post.id)}
                                                        className={`flex items-center gap-1.5 transition-colors group ${userLikes.includes(post.id) ? 'text-primary' : 'text-slate-400 hover:text-primary'}`}
                                                    >
                                                        <span className={`material-symbols-outlined text-[18px] ${userLikes.includes(post.id) ? 'icon-fill' : 'group-hover:icon-fill'}`}>thumb_up</span>
                                                        <span className="text-xs font-medium">{post.likes}</span>
                                                    </button>
                                                    <button
                                                        onClick={() => toggleComments(post.id)}
                                                        className={`flex items-center gap-1.5 transition-colors ${expandedCommentsId === post.id ? 'text-white' : 'text-slate-400 hover:text-white'}`}
                                                    >
                                                        <span className={`material-symbols-outlined text-[18px] ${expandedCommentsId === post.id ? 'icon-fill' : ''}`}>chat_bubble</span>
                                                        <span className="text-xs font-medium">{post.comments}</span>
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Comments Section */}
                                            {expandedCommentsId === post.id && (
                                                <div className="mt-4 space-y-4 animate-fadeIn">
                                                    <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                                        {comments.length === 0 && !isSubmittingComment && (
                                                            <p className="text-xs text-slate-500 italic">No hay comentarios aún. ¡Sé el primero!</p>
                                                        )}
                                                        {comments.map(c => (
                                                            <div key={c.id} className="flex gap-2 items-start bg-white/5 p-2 rounded-lg">
                                                                <img src={c.profiles?.avatar} className="size-6 rounded-full shrink-0" alt="" />
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-center gap-2 mb-0.5">
                                                                        <span className="text-[10px] font-bold text-white">{c.profiles?.name}</span>
                                                                        <span className="text-primary text-[9px] font-mono">{c.profiles?.handle.startsWith('@') ? c.profiles?.handle : `@${c.profiles?.handle}`}</span>
                                                                    </div>
                                                                    <p className="text-xs text-slate-300 leading-snug">{c.content}</p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    {user && (
                                                        <div className="flex gap-2 items-center">
                                                            <input
                                                                type="text"
                                                                value={newComment}
                                                                onChange={(e) => setNewComment(e.target.value)}
                                                                placeholder="Escribe un comentario..."
                                                                className="flex-1 bg-surface-darker border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-primary/50"
                                                                onKeyDown={(e) => e.key === 'Enter' && handleAddComment(post.id)}
                                                            />
                                                            <button
                                                                disabled={isSubmittingComment || !newComment.trim()}
                                                                onClick={() => handleAddComment(post.id)}
                                                                className="text-primary hover:text-white disabled:opacity-50 transition-colors"
                                                            >
                                                                <span className="material-symbols-outlined text-[20px]">send</span>
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}
                            </article>
                        ))
                    )}
                </section>

                {/* RIGHT COLUMN */}
                <aside className="hidden lg:flex lg:col-span-3 flex-col gap-6 sticky top-24">
                    {/* Telemetry / Stats */}
                    <div className="bg-surface-dark rounded-xl border border-white/5 p-5 flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Mi Telemetría</h3>
                            <span className="material-symbols-outlined text-slate-600 text-[20px]">equalizer</span>
                        </div>
                        <div className="flex items-center justify-center py-2 relative">
                            <div className="size-32 rounded-full border-[12px] border-surface-darker relative flex items-center justify-center">
                                <div className="absolute inset-0 rounded-full border-[12px] border-primary border-t-transparent border-l-transparent -rotate-45"></div>
                                <div className="flex flex-col items-center">
                                    <span className="text-2xl font-bold text-white">94</span>
                                    <span className="text-[10px] text-slate-400 uppercase">Reputación</span>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-slate-400">Salud de Contribución</span>
                                <span className="text-emerald-400 font-medium">Excelente</span>
                            </div>
                            <div className="w-full bg-surface-darker h-1.5 rounded-full overflow-hidden">
                                <div className="bg-emerald-500 h-full w-[95%]"></div>
                            </div>
                        </div>
                    </div>
                    {/* Safe Haven Protocols */}
                    <div className="bg-surface-dark rounded-xl border border-white/5 p-5 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-primary to-transparent"></div>
                        <div className="flex items-center gap-2 mb-4">
                            <span className="material-symbols-outlined text-primary">shield</span>
                            <h3 className="text-lg font-serif font-bold text-white">Protocolos de Refugio Seguro</h3>
                        </div>
                        <ul className="space-y-4">
                            <li className="flex gap-3 items-start">
                                <span className="text-primary font-mono text-xs mt-0.5">01</span>
                                <p className="text-sm text-slate-300">Critica las ideas, no a las personas. Los ataques ad hominem resultan en pérdida inmediata de señal (baneo).</p>
                            </li>
                            <li className="flex gap-3 items-start">
                                <span className="text-primary font-mono text-xs mt-0.5">02</span>
                                <p className="text-sm text-slate-300">Cita tus fuentes para afirmaciones técnicas. La desinformación es contaminación.</p>
                            </li>
                            <li className="flex gap-3 items-start">
                                <span className="text-primary font-mono text-xs mt-0.5">03</span>
                                <p className="text-sm text-slate-300">Respeta a los novatos. Todos fuimos nuevos alguna vez.</p>
                            </li>
                        </ul>
                    </div>
                </aside>
            </div>

            {/* Media Modal */}
            {showMediaModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowMediaModal(false)}>
                    <div className="bg-surface-dark rounded-xl border border-white/10 p-6 max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-white">Agregar Imagen o Video</h3>
                            <button onClick={() => setShowMediaModal(false)} className="text-slate-400 hover:text-white transition-colors">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-slate-400 mb-2">Tipo de medio</label>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setMediaType('image')}
                                        className={`flex-1 px-4 py-2 rounded-lg border transition-colors ${mediaType === 'image' ? 'bg-primary/20 border-primary text-primary' : 'bg-surface-darker border-white/10 text-slate-400 hover:border-primary/50'}`}
                                    >
                                        <span className="material-symbols-outlined text-[20px] mb-1">image</span>
                                        <div className="text-xs">Imagen</div>
                                    </button>
                                    <button
                                        onClick={() => setMediaType('video')}
                                        className={`flex-1 px-4 py-2 rounded-lg border transition-colors ${mediaType === 'video' ? 'bg-primary/20 border-primary text-primary' : 'bg-surface-darker border-white/10 text-slate-400 hover:border-primary/50'}`}
                                    >
                                        <span className="material-symbols-outlined text-[20px] mb-1">videocam</span>
                                        <div className="text-xs">Video</div>
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-2">URL del {mediaType === 'video' ? 'video' : 'imagen'}</label>
                                <input
                                    type="url"
                                    value={mediaUrl}
                                    onChange={(e) => setMediaUrl(e.target.value)}
                                    placeholder={`https://ejemplo.com/${mediaType === 'video' ? 'video.mp4' : 'imagen.jpg'}`}
                                    className="w-full bg-surface-darker border border-white/10 rounded-lg px-4 py-2 text-white text-sm focus:border-primary/50 focus:outline-none"
                                />
                            </div>
                            {mediaUrl && (
                                <div className="border border-white/10 rounded-lg p-2 bg-surface-darker">
                                    <p className="text-xs text-slate-400 mb-2">Vista previa:</p>
                                    {mediaType === 'image' ? (
                                        <img src={mediaUrl} alt="Preview" className="w-full h-32 object-cover rounded" onError={(e) => { e.currentTarget.src = ''; e.currentTarget.alt = 'Error al cargar imagen'; }} />
                                    ) : (
                                        <video src={mediaUrl} className="w-full h-32 object-cover rounded" controls />
                                    )}
                                </div>
                            )}
                            <div className="flex gap-2 pt-2">
                                <button
                                    onClick={() => {
                                        setMediaUrl('');
                                        setMediaType(null);
                                        setShowMediaModal(false);
                                    }}
                                    className="flex-1 px-4 py-2 rounded-lg bg-surface-darker border border-white/10 text-slate-400 hover:text-white transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={() => setShowMediaModal(false)}
                                    disabled={!mediaUrl || !mediaType}
                                    className="flex-1 px-4 py-2 rounded-lg bg-primary text-background-dark font-bold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Agregar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Link Modal */}
            {showLinkModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowLinkModal(false)}>
                    <div className="bg-surface-dark rounded-xl border border-white/10 p-6 max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-white">Agregar Enlace</h3>
                            <button onClick={() => setShowLinkModal(false)} className="text-slate-400 hover:text-white transition-colors">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-slate-400 mb-2">URL del enlace</label>
                                <input
                                    type="url"
                                    value={linkUrl}
                                    onChange={(e) => setLinkUrl(e.target.value)}
                                    placeholder="https://ejemplo.com/articulo"
                                    className="w-full bg-surface-darker border border-white/10 rounded-lg px-4 py-2 text-white text-sm focus:border-primary/50 focus:outline-none"
                                />
                            </div>
                            {linkUrl && (
                                <div className="border border-white/10 rounded-lg p-3 bg-surface-darker">
                                    <div className="flex items-start gap-3">
                                        <span className="material-symbols-outlined text-primary text-[24px]">link</span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs text-slate-400 mb-1">Enlace adjunto:</p>
                                            <p className="text-sm text-white truncate">{linkUrl}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div className="flex gap-2 pt-2">
                                <button
                                    onClick={() => {
                                        setLinkUrl('');
                                        setShowLinkModal(false);
                                    }}
                                    className="flex-1 px-4 py-2 rounded-lg bg-surface-darker border border-white/10 text-slate-400 hover:text-white transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={() => setShowLinkModal(false)}
                                    disabled={!linkUrl}
                                    className="flex-1 px-4 py-2 rounded-lg bg-primary text-background-dark font-bold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Agregar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Community;
