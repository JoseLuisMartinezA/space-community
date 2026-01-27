import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabase';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
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

const Profile: React.FC = () => {
   const { user, updateProfile, logout } = useAuth();
   const { theme, toggleTheme } = useTheme();
   const { notifications, clearAllNotifications, markAsRead } = useNotifications();
   const navigate = useNavigate();

   // UI State
   const [showSettings, setShowSettings] = useState(false);
   const [showNotificationsView, setShowNotificationsView] = useState(false);

   const handleLogout = () => {
      logout();
      navigate('/login');
   };

   // Real Data State
   const [friends, setFriends] = useState<Friend[]>([]);
   const [searchQuery, setSearchQuery] = useState('');
   const [searchResults, setSearchResults] = useState<any[]>([]);
   const [sendingRequestTo, setSendingRequestTo] = useState<string | null>(null);

   // Edit Profile State
   const [isEditing, setIsEditing] = useState(false);
   const [editForm, setEditForm] = useState({
      name: "",
      handle: "",
      bio: "",
   });

   // Stats & Data State
   const [stats, setStats] = useState({
      friends: 0,
      posts: 0,
      likesReceived: 0,
      commentsReceived: 0
   });
   const [latestPost, setLatestPost] = useState<any>(null);
   const [activities, setActivities] = useState<any[]>([]);
   const [uploadingAvatar, setUploadingAvatar] = useState(false);
   const fileInputRef = useRef<HTMLInputElement>(null);

   useEffect(() => {
      if (user) {
         setEditForm({
            name: user.name,
            handle: user.handle,
            bio: user.bio
         });
         fetchFriends();
         fetchProfileData();
      }
   }, [user]);

   const fetchProfileData = async () => {
      if (!user) return;

      // 1. Fetch Stats from View
      const { data: statsData, error: statsError } = await supabase
         .from('user_stats')
         .select('*')
         .eq('user_id', user.id)
         .single();

      if (statsData) {
         setStats({
            friends: statsData.friends_count,
            posts: statsData.posts_count,
            likesReceived: statsData.likes_received_count,
            commentsReceived: statsData.comments_received_count
         });
      }

      // 2. Fetch Latest Post
      const { data: postData } = await supabase
         .from('posts')
         .select(`
            *,
            likes:post_likes(count),
            comments:comments(count)
         `)
         .eq('author_id', user.id)
         .order('created_at', { ascending: false })
         .limit(1)
         .single();

      if (postData) {
         // Actually, let's fix the count fetching:
         const { count: likesCount } = await supabase.from('post_likes').select('*', { count: 'exact', head: true }).eq('post_id', postData.id);
         const { count: commentsCount } = await supabase.from('comments').select('*', { count: 'exact', head: true }).eq('post_id', postData.id);
         setLatestPost({ ...postData, likes_count: likesCount || 0, comments_count: commentsCount || 0 });
      }

      // 3. Activity Feed (Synthesized)
      // Joined
      const joinedParams = {
         type: 'joined',
         date: new Date(user.created_at || new Date().toISOString()), // user.created_at might come from auth or profile
         text: 'Te uniste a la comunidad de SpaceX'
      };

      // Last Post
      // We already fetched latest post.
      const activitiesList = [joinedParams];
      if (postData) {
         activitiesList.push({
            type: 'post',
            date: new Date(postData.created_at),
            text: 'Publicaste una nueva actualización'
         });
      }

      // Last Friend
      const { data: lastFriend } = await supabase
         .from('friend_requests')
         .select('updated_at')
         .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
         .eq('status', 'accepted')
         .order('updated_at', { ascending: false })
         .limit(1)
         .single();

      if (lastFriend) {
         activitiesList.push({
            type: 'friend',
            date: new Date(lastFriend.updated_at),
            text: 'Hiciste una nueva conexión'
         });
      }

      // Sort and take top 3
      activitiesList.sort((a, b) => b.date.getTime() - a.date.getTime());
      setActivities(activitiesList.slice(0, 3));
   };

   // Fetch Friends
   const fetchFriends = async () => {
      if (!user) return;
      const { data: requestData } = await supabase
         .from('friend_requests')
         .select(`
            id,
            sender:sender_id(id, name, handle, avatar),
            receiver:receiver_id(id, name, handle, avatar)
        `)
         .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
         .eq('status', 'accepted');

      if (requestData) {
         const formattedFriends = requestData.map((req: any) => {
            const friendData = req.sender_id === user.id ? req.receiver : req.sender;
            return {
               id: friendData.id,
               name: friendData.name,
               handle: friendData.handle,
               avatar: friendData.avatar,
               status: 'online', // Default for now, real-time status could be added back if needed
            };
         });
         setFriends(formattedFriends);
      }
   };

   const handleSaveProfile = () => {
      updateProfile(editForm);
      setIsEditing(false);
   };

   const handleAvatarClick = () => {
      if (isEditing) {
         fileInputRef.current?.click();
      }
   };

   const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !user) return;

      // Basic validation
      if (!file.type.startsWith('image/')) {
         alert('Por favor selecciona un archivo de imagen válido.');
         return;
      }

      if (file.size > 2 * 1024 * 1024) {
         alert('La imagen es demasiado grande. Máximo 2MB.');
         return;
      }

      setUploadingAvatar(true);
      try {
         const reader = new FileReader();
         reader.readAsDataURL(file);
         reader.onload = async () => {
            try {
               const base64String = reader.result as string;
               console.log("Converted to Base64, length:", base64String.length);

               // Update profile in AuthContext (which updates DB and state)
               await updateProfile({ avatar: base64String });
               setUploadingAvatar(false);
            } catch (err: any) {
               console.error("Error updating profile with base64:", err);
               alert("Error al actualizar la base de datos.");
               setUploadingAvatar(false);
            }
         };
         reader.onerror = () => {
            alert("Error al leer el archivo.");
            setUploadingAvatar(false);
         };

      } catch (error: any) {
         console.error("Error processing image:", error);
         alert("Error al procesar la imagen.");
         setUploadingAvatar(false);
      }
   };

   const handleSearch = async (query: string) => {
      setSearchQuery(query);
      if (query.trim().length < 3) {
         setSearchResults([]);
         return;
      }

      const { data, error } = await supabase
         .from('profiles')
         .select('id, name, handle, avatar, bio')
         .ilike('handle', `%${query}%`)
         .neq('id', user?.id)
         .limit(5);

      if (!error && data) {
         setSearchResults(data);
      }
   };

   const handleAddFriend = async (targetUserId: string) => {
      if (!user) return;
      setSendingRequestTo(targetUserId);

      try {
         // 1. Check if already friends or request pending
         const { data: existing } = await supabase
            .from('friend_requests')
            .select('*')
            .or(`and(sender_id.eq.${user.id},receiver_id.eq.${targetUserId}),and(sender_id.eq.${targetUserId},receiver_id.eq.${user.id})`)
            .single();

         if (existing) {
            alert("Ya existe una conexión o solicitud pendiente con este usuario.");
            return;
         }

         // 2. Insert request
         const { error } = await supabase
            .from('friend_requests')
            .insert({
               sender_id: user.id,
               receiver_id: targetUserId,
               status: 'pending'
            });

         if (error) throw error;

         // 3. Notify target
         await supabase.from('notifications').insert({
            user_id: targetUserId,
            type: 'friend_request',
            title: 'Nueva Solicitud',
            content: `${user.handle} quiere establecer un enlace de comunicaciones contigo.`,
            source_id: user.id,
            source_handle: user.handle,
            source_avatar: user.avatar
         });

         alert("Solicitud de alianza enviada correctamente.");
         setSearchQuery('');
         setSearchResults([]);
      } catch (err: any) {
         console.error("Error adding friend:", err);
         alert("Error al enviar solicitud.");
      } finally {
         setSendingRequestTo(null);
      }
   };

   const getRelativeTime = (date: Date) => {
      const diff = Math.floor((new Date().getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
      if (diff === 0) return 'Hoy';
      if (diff === 1) return 'Ayer';
      return `Hace ${diff} días`;
   };

   if (!user) return null;

   return (
      <div className="flex flex-col bg-background-dark pb-32">
         {/* Profile Header (Top Section) */}
         <div className="relative h-64 shrink-0">
            <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuDkps8EaHx_S4AmVmMeWq0mOMytCPtfRKSBtGh7dKlGHw8rH8V8_ch2SpY7MKnFDoyDWnWqRbCE0EP4nxOIk_lcKBW5ytP-1fplvC-lOaluPXeOnyodU25T1CQMiC54VttTnCMggS8ajU1rNh4deuklpAJMmYA8EQ3yEZhyiVKXJxKQB_Py3Dz9SEtAZh_Wczu9YCSLI3RD7Cwg4e0FIkSrenDiSgVsQlc-TNvcxQkJmcBvv0xklg80o5HcAoUEfEge8YdL1BoLgVM")' }}>
               <div className="absolute inset-0 bg-gradient-to-t from-background-dark via-background-dark/80 to-transparent"></div>
            </div>

            <div className="absolute bottom-0 left-0 w-full p-6 md:p-8 flex items-end justify-between">
               <div className="flex items-end gap-6 w-full md:w-auto">
                  <div className="relative">
                     <div
                        className={`size-24 md:size-32 rounded-full p-1 bg-surface-dark border-2 border-primary/30 overflow-hidden relative ${isEditing ? 'cursor-pointer group' : ''}`}
                        onClick={handleAvatarClick}
                     >
                        <img src={user.avatar} alt="Profile" className="w-full h-full rounded-full object-cover" />
                        {isEditing && (
                           <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <span className="material-symbols-outlined text-white text-3xl">add_a_photo</span>
                           </div>
                        )}
                        {uploadingAvatar && (
                           <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                              <div className="size-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                           </div>
                        )}
                     </div>
                     <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/*"
                        className="hidden"
                     />
                     <div className="absolute bottom-2 right-2 size-6 bg-surface-dark rounded-full flex items-center justify-center border border-white/10">
                        <span className="material-symbols-outlined text-sm text-primary">verified</span>
                     </div>
                  </div>
                  <div className="mb-2 flex-1">
                     <h1 className="text-3xl font-serif font-bold text-white">{user.name}</h1>
                     <p className="text-primary font-mono text-sm">{user.handle}</p>
                  </div>
               </div>


            </div>
         </div>

         {/* New Profile Dashboard Layout */}
         <div className="p-4 md:p-8 container mx-auto space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
               {/* Left Column: Profile & Stats */}
               <div className="space-y-6">
                  {/* Profile Card */}
                  <div className="bg-surface-dark border border-white/5 rounded-2xl overflow-hidden shadow-lg animate-slideUp">
                     {/* Banner Area */}
                     <div className="h-28 bg-gradient-to-r from-blue-900 via-indigo-900 to-purple-900 relative">
                        <div className="absolute -bottom-12 left-6">
                           <div
                              className={`size-24 rounded-full p-1 bg-surface-dark relative ${isEditing ? 'cursor-pointer group' : ''}`}
                              onClick={handleAvatarClick}
                           >
                              <img src={user.avatar} alt="Profile" className="w-full h-full rounded-full object-cover" />
                              {isEditing && (
                                 <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="material-symbols-outlined text-white">add_a_photo</span>
                                 </div>
                              )}
                              {uploadingAvatar && (
                                 <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center">
                                    <div className="size-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                 </div>
                              )}
                              <div className="absolute bottom-1 right-1 size-4 bg-green-500 border-2 border-surface-dark rounded-full"></div>
                           </div>
                        </div>
                     </div>

                     {/* Profile Info */}
                     <div className="pt-14 p-6">
                        <h2 className="text-2xl font-serif font-bold text-white mb-1">{user.name}</h2>

                        {isEditing ? (
                           <div className="space-y-3 mb-4">
                              <input
                                 type="text"
                                 value={editForm.name}
                                 onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                 className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white outline-none focus:border-primary text-sm"
                                 placeholder="Nombre Display"
                              />
                              <input
                                 type="text"
                                 value={editForm.handle}
                                 onChange={(e) => setEditForm({ ...editForm, handle: e.target.value })}
                                 className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-primary font-mono text-sm outline-none focus:border-primary"
                                 placeholder="@usuario"
                              />
                              <textarea
                                 value={editForm.bio}
                                 onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                                 className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white/80 text-sm outline-none focus:border-primary h-20 resize-none font-sans"
                                 placeholder="Biografía breve..."
                              />
                              <div className="flex gap-2 justify-end">
                                 <button onClick={() => setIsEditing(false)} className="text-xs text-slate-400 hover:text-white">Cancelar</button>
                                 <button onClick={handleSaveProfile} className="text-xs text-primary font-bold">Guardar</button>
                              </div>
                           </div>
                        ) : (
                           <>
                              <p className="text-slate-400 text-sm mb-4 leading-relaxed">
                                 {user.bio || "Entusiasta del espacio y la tecnología. Explorando el cosmos un lanzamiento a la vez."}
                              </p>

                              <div className="space-y-3 mb-6">
                                 <div className="flex items-center gap-3 text-sm text-slate-400">
                                    <span className="material-symbols-outlined text-lg">mail</span>
                                    <span>{user.email}</span>
                                 </div>
                                 <div className="flex items-center gap-3 text-sm text-slate-400">
                                    <span className="material-symbols-outlined text-lg">calendar_month</span>
                                    <span>Miembro desde {new Date(user.created_at || Date.now()).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}</span>
                                 </div>
                              </div>
                           </>
                        )}

                        {!isEditing && (
                           <div className="flex flex-col gap-2">
                              <button
                                 onClick={() => setIsEditing(true)}
                                 className="w-full py-2.5 bg-[#1d4ed8] hover:bg-[#1e40af] text-white rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2"
                              >
                                 <span className="material-symbols-outlined text-lg">edit</span>
                                 Editar Perfil
                              </button>
                              <div className="grid grid-cols-2 gap-2 md:hidden">
                                 <button
                                    onClick={() => setShowSettings(true)}
                                    className="py-2.5 bg-surface-darker hover:bg-white/5 border border-white/5 text-slate-300 rounded-lg font-medium text-xs transition-colors flex items-center justify-center gap-1.5"
                                 >
                                    <span className="material-symbols-outlined text-[18px]">settings</span>
                                    Ajustes
                                 </button>
                                 <button
                                    onClick={() => setShowNotificationsView(true)}
                                    className="py-2.5 bg-surface-darker hover:bg-white/5 border border-white/5 text-slate-300 rounded-lg font-medium text-xs transition-colors flex items-center justify-center gap-1.5"
                                 >
                                    <span className="material-symbols-outlined text-[18px]">notifications</span>
                                    Avisos
                                 </button>
                              </div>
                           </div>
                        )}
                     </div>
                  </div>

                  {/* Statistics Card */}
                  <div className="bg-surface-dark border border-white/5 rounded-2xl p-6 shadow-lg animate-slideUp" style={{ animationDelay: '0.1s' }}>
                     <h3 className="text-lg font-bold text-white mb-4">Estadísticas</h3>
                     <div className="space-y-4">
                        <div className="flex justify-between items-center group cursor-pointer">
                           <span className="text-slate-400 group-hover:text-white transition-colors">Amigos</span>
                           <span className="text-blue-400 font-bold text-xl">{stats.friends}</span>
                        </div>
                        <div className="flex justify-between items-center group cursor-pointer">
                           <span className="text-slate-400 group-hover:text-white transition-colors">Publicaciones</span>
                           <span className="text-[#0bda50] font-bold text-xl">{stats.posts}</span>
                        </div>
                        <div className="flex justify-between items-center group cursor-pointer">
                           <span className="text-slate-400 group-hover:text-white transition-colors">Likes recibidos</span>
                           <span className="text-purple-400 font-bold text-xl">{stats.likesReceived}</span>
                        </div>
                        <div className="flex justify-between items-center group cursor-pointer">
                           <span className="text-slate-400 group-hover:text-white transition-colors">Comentarios</span>
                           <span className="text-yellow-400 font-bold text-xl">{stats.commentsReceived}</span>
                        </div>
                     </div>
                  </div>

                  {/* Global Search / Add Friends */}
                  <div className="bg-surface-dark border border-white/5 rounded-2xl p-6 shadow-lg animate-slideUp" style={{ animationDelay: '0.15s' }}>
                     <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">person_search</span>
                        Añadir Amigos
                     </h3>
                     <div className="relative mb-4">
                        <input
                           type="text"
                           value={searchQuery}
                           onChange={(e) => handleSearch(e.target.value)}
                           placeholder="Buscar por @usuario..."
                           className="w-full bg-surface-darker border border-white/10 rounded-xl py-2.5 px-4 pl-10 text-white text-sm focus:border-primary outline-none transition-all"
                        />
                        <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-500">search</span>
                     </div>

                     <div className="space-y-3">
                        {searchResults.map(res => (
                           <div key={res.id} className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/5 group">
                              <img src={res.avatar} className="size-10 rounded-full object-cover" />
                              <div className="flex-1 min-w-0">
                                 <p className="text-sm font-bold text-white truncate">{res.name}</p>
                                 <p className="text-[10px] text-primary font-mono">{res.handle}</p>
                              </div>
                              <button
                                 onClick={() => handleAddFriend(res.id)}
                                 disabled={sendingRequestTo === res.id}
                                 className="size-8 rounded-full bg-primary/20 text-primary hover:bg-primary hover:text-black flex items-center justify-center transition-all disabled:opacity-50"
                              >
                                 <span className="material-symbols-outlined text-[20px]">
                                    {sendingRequestTo === res.id ? 'sync' : 'person_add'}
                                 </span>
                              </button>
                           </div>
                        ))}
                        {searchQuery.length >= 3 && searchResults.length === 0 && (
                           <p className="text-center text-xs text-slate-500 py-2 italic font-serif">No se encontraron exploradores...</p>
                        )}
                     </div>
                  </div>
               </div>

               {/* Right Column: Latest Posts & Activity */}
               <div className="lg:col-span-2 space-y-6">
                  {/* My Posts */}
                  <div className="bg-surface-dark border border-white/5 rounded-2xl p-6 shadow-lg animate-slideUp" style={{ animationDelay: '0.2s' }}>
                     <h3 className="text-xl font-serif font-bold text-white mb-6">Mi última publicación</h3>

                     {latestPost ? (
                        <div className="bg-surface-darker/30 rounded-2xl p-6 border border-black/5 dark:border-white/5 hover:border-primary/30 transition-all cursor-pointer group" onClick={() => navigate('/community')}>
                           <div className="flex items-center gap-3 mb-3">
                              <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 text-[10px] font-bold uppercase tracking-wider">Reciente</span>
                              <span className="text-slate-500 text-xs">{new Date(latestPost.created_at).toLocaleDateString()}</span>
                           </div>
                           <h4 className="text-white font-bold text-lg mb-2">{latestPost.content.length > 50 ? latestPost.content.substring(0, 50) + "..." : latestPost.content}</h4>
                           <p className="text-slate-400 text-sm mb-4 leading-relaxed line-clamp-2">
                              {latestPost.content}
                           </p>
                           <div className="flex items-center gap-4 text-xs text-slate-500 font-medium">
                              <span className="flex items-center gap-1 hover:text-white cursor-pointer transition-colors">
                                 <span className="material-symbols-outlined text-sm">favorite</span> {latestPost.likes_count} likes
                              </span>
                              <span className="flex items-center gap-1 hover:text-white cursor-pointer transition-colors">
                                 <span className="material-symbols-outlined text-sm">chat_bubble</span> {latestPost.comments_count} comentarios
                              </span>
                           </div>
                        </div>
                     ) : (
                        <div className="text-center p-8 border border-white/5 border-dashed rounded-xl">
                           <p className="text-slate-500 text-sm">Aún no has participado en la comunidad.</p>
                           <button onClick={() => navigate('/community')} className="mt-2 text-primary text-sm hover:underline">Crear primera publicación</button>
                        </div>
                     )}
                  </div>

                  {/* Recent Activity */}
                  <div className="bg-surface-dark border border-white/5 rounded-2xl p-6 shadow-lg animate-slideUp" style={{ animationDelay: '0.3s' }}>
                     <h3 className="text-xl font-serif font-bold text-white mb-6">Actividad Reciente</h3>

                     <div className="space-y-6 relative before:absolute before:inset-0 before:ml-[5px] before:w-0.5 before:bg-white/5 before:h-full">
                        {activities.map((act, idx) => (
                           <div key={idx} className="pl-6 relative">
                              <div className={`absolute left-0 top-1.5 size-2.5 rounded-full shadow-[0_0_10px_rgba(255,255,255,0.2)] ${act.type === 'joined' ? 'bg-blue-500' :
                                 act.type === 'post' ? 'bg-[#0bda50]' : 'bg-purple-500'
                                 }`}></div>
                              <p className="text-slate-500 text-xs mb-0.5 capitalize">{getRelativeTime(act.date)}</p>
                              <p className="text-white font-medium text-sm">{act.text}</p>
                           </div>
                        ))}
                     </div>
                  </div>
               </div>
            </div>
         </div>

         {/* Main Content: Aliados List */}
         <div className="p-4 md:p-8 container mx-auto">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
               <span className="material-symbols-outlined text-primary">group</span>
               Mis Amigos <span className="text-slate-500 text-sm font-normal">({friends.length})</span>
            </h2>

            {friends.length === 0 ? (
               <div className="text-center py-12 border border-dashed border-white/10 rounded-xl bg-surface-dark/50">
                  <p className="text-slate-400">Aún no tienes amigos en tu red.</p>
               </div>
            ) : (
               <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {friends.map(friend => (
                     <div key={friend.id} className="bg-surface-dark border border-white/5 rounded-xl p-4 flex items-center gap-4 hover:border-primary/30 transition-all group">
                        <img src={friend.avatar} alt={friend.name} className="size-14 rounded-full bg-slate-800 object-cover" />
                        <div className="flex-1 min-w-0">
                           <h3 className="text-white font-bold truncate group-hover:text-primary transition-colors">{friend.name}</h3>
                           <p className="text-slate-400 text-xs truncate bg-white/5 inline-block px-1.5 py-0.5 rounded mt-1">
                              {friend.handle.startsWith('@') ? friend.handle : `@${friend.handle}`}
                           </p>
                        </div>
                        <button
                           onClick={() => navigate('/chat')}
                           className="p-2 bg-white/5 rounded-full hover:bg-primary hover:text-black text-slate-400 transition-colors"
                           title="Enviar mensaje"
                        >
                           <span className="material-symbols-outlined text-[20px]">chat</span>
                        </button>
                     </div>
                  ))}
               </div>
            )}
         </div>

         {/* Fullscreen Settings Modal */}
         {showSettings && (
            <div className="fixed inset-0 z-[100] bg-background-dark animate-slideUp overflow-y-auto">
               <div className="sticky top-0 bg-surface-dark/80 backdrop-blur-md border-b border-white/10 p-4 flex items-center justify-between z-10">
                  <div className="flex items-center gap-3">
                     <button onClick={() => setShowSettings(false)} className="text-primary">
                        <span className="material-symbols-outlined text-[32px]">chevron_left</span>
                     </button>
                     <h2 className="text-xl font-bold text-white">Configuración</h2>
                  </div>
               </div>

               <div className="p-6 space-y-8">
                  <section>
                     <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Experiencia Visual</h3>
                     <div className="bg-surface-dark border border-white/5 rounded-2xl p-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                           <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="material-symbols-outlined text-primary">
                                 {theme === 'dark' ? 'dark_mode' : 'light_mode'}
                              </span>
                           </div>
                           <div>
                              <p className="font-bold text-white">Modo {theme === 'dark' ? 'Oscuro' : 'Claro'}</p>
                              <p className="text-xs text-slate-400">Cambiar apariencia del sistema</p>
                           </div>
                        </div>
                        <button
                           onClick={toggleTheme}
                           className={`relative w-14 h-7 rounded-full transition-colors ${theme === 'dark' ? 'bg-primary' : 'bg-slate-600'}`}
                        >
                           <div className={`absolute top-1 left-1 size-5 rounded-full bg-white transition-transform ${theme === 'dark' ? 'translate-x-7' : 'translate-x-0'}`} />
                        </button>
                     </div>
                  </section>

                  <section>
                     <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Notificaciones</h3>
                     <div className="bg-surface-dark border border-white/5 rounded-2xl overflow-hidden divide-y divide-white/5">
                        <div className="p-4 flex items-center justify-between">
                           <div>
                              <p className="font-bold text-white">Mensajes Directos</p>
                              <p className="text-xs text-slate-400">Recibir alertas de nuevos chats</p>
                           </div>
                           <input type="checkbox" defaultChecked className="size-5 rounded border-white/10 bg-white/5 text-primary focus:ring-primary" />
                        </div>
                        <div className="p-4 flex items-center justify-between">
                           <div>
                              <p className="font-bold text-white">Lanzamientos en Vivo</p>
                              <p className="text-xs text-slate-400">Notificar misiones espaciales</p>
                           </div>
                           <input type="checkbox" defaultChecked className="size-5 rounded border-white/10 bg-white/5 text-primary focus:ring-primary" />
                        </div>
                     </div>
                  </section>

                  <section>
                     <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Cuenta</h3>
                     <div className="bg-surface-dark border border-white/5 rounded-2xl overflow-hidden divide-y divide-white/5">
                        <button className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                           <div className="flex items-center gap-3 text-slate-300">
                              <span className="material-symbols-outlined">lock</span>
                              <span>Seguridad</span>
                           </div>
                           <span className="material-symbols-outlined text-slate-600">chevron_right</span>
                        </button>
                        <button className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                           <div className="flex items-center gap-3 text-slate-300">
                              <span className="material-symbols-outlined">language</span>
                              <span>Idioma (Español)</span>
                           </div>
                           <span className="material-symbols-outlined text-slate-600">chevron_right</span>
                        </button>
                     </div>
                  </section>

                  <div className="pt-10">
                     <button
                        onClick={handleLogout}
                        className="w-full py-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl font-bold flex items-center justify-center gap-2"
                     >
                        <span className="material-symbols-outlined">logout</span>
                        Cerrar Sesión
                     </button>
                  </div>
               </div>
            </div>
         )}

         {/* Fullscreen Notifications Modal */}
         {showNotificationsView && (
            <div className="fixed inset-0 z-[100] bg-background-dark animate-slideUp overflow-y-auto">
               <div className="sticky top-0 bg-surface-dark/80 backdrop-blur-md border-b border-white/10 p-4 flex items-center justify-between z-10">
                  <div className="flex items-center gap-3">
                     <button onClick={() => setShowNotificationsView(false)} className="text-primary">
                        <span className="material-symbols-outlined text-[32px]">chevron_left</span>
                     </button>
                     <h2 className="text-xl font-bold text-white">Notificaciones</h2>
                  </div>
                  <button onClick={clearAllNotifications} className="text-xs text-primary font-bold uppercase">Limpiar</button>
               </div>

               <div className="p-4 space-y-2">
                  {notifications.length === 0 ? (
                     <div className="flex flex-col items-center justify-center py-20 text-slate-500 opacity-30">
                        <span className="material-symbols-outlined text-8xl">notifications_off</span>
                        <p className="mt-4 font-bold uppercase tracking-widest">Silencio Espacial</p>
                     </div>
                  ) : (
                     notifications.map(n => (
                        <div key={n.id} className="bg-surface-dark border border-white/5 rounded-2xl p-4 flex gap-4">
                           <img src={n.source_avatar} className="size-12 rounded-full object-cover" />
                           <div className="flex-1 min-w-0">
                              <div className="flex justify-between">
                                 <p className="font-bold text-white text-sm">{n.title}</p>
                                 <span className="text-[10px] text-slate-500">{new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                              <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{n.content}</p>
                           </div>
                        </div>
                     ))
                  )}
               </div>
            </div>
         )}
      </div>
   );
};

export default Profile;
