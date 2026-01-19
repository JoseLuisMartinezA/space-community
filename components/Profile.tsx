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

const Profile: React.FC = () => {
   const { user, updateProfile } = useAuth();
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

   // Edit Profile State
   const [isEditing, setIsEditing] = useState(false);
   const [editForm, setEditForm] = useState({
      name: "",
      handle: "",
      bio: "",
   });

   useEffect(() => {
      if (user) {
         setEditForm({
            name: user.name,
            handle: user.handle,
            bio: user.bio
         });
         fetchFriends();
         fetchRequests();
      }
   }, [user, notificationTrigger]);

   // Realtime Friends and Requests
   useEffect(() => {
      if (!user) return;

      const channel = supabase
         .channel(`friendship_realtime:${user.id}`)
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
      const { data: requestData, error } = await supabase
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


   // Search
   const handleSearch = async (query: string) => {
      setSearchQuery(query);
      if (query.length < 3) {
         setSearchResults([]);
         return;
      }
      const { data } = await supabase
         .from('profiles')
         .select('id, name, handle, avatar')
         .ilike('handle', `%${query}%`)
         .limit(5);

      if (data) setSearchResults(data);
   };

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
            .channel(`chat:${selectedFriend.id}`)
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

   const handleSaveProfile = () => {
      updateProfile(editForm);
      setIsEditing(false);
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
                     <div className="size-24 md:size-32 rounded-full p-1 bg-surface-dark border-2 border-primary/30 overflow-hidden">
                        <img src={user.avatar} alt="Profile" className="w-full h-full rounded-full object-cover" />
                     </div>
                     <div className="absolute bottom-2 right-2 size-6 bg-surface-dark rounded-full flex items-center justify-center border border-white/10">
                        <span className="material-symbols-outlined text-sm text-primary">verified</span>
                     </div>
                  </div>
                  <div className="mb-2 flex-1">
                     {isEditing ? (
                        <div className="flex flex-col gap-2 max-w-xs">
                           <input
                              type="text"
                              value={editForm.name}
                              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                              className="bg-surface-dark/80 border border-white/20 rounded px-2 py-1 text-white font-bold text-xl md:text-2xl"
                              placeholder="Nombre"
                           />
                           <input
                              type="text"
                              value={editForm.handle}
                              onChange={(e) => setEditForm({ ...editForm, handle: e.target.value })}
                              className="bg-surface-dark/80 border border-white/20 rounded px-2 py-1 text-primary font-mono text-sm"
                              placeholder="@usuario"
                           />
                        </div>
                     ) : (
                        <>
                           <h1 className="text-3xl font-serif font-bold text-white">{user.name}</h1>
                           <p className="text-primary font-mono text-sm">{user.handle} • {user.role}</p>
                        </>
                     )}
                  </div>
               </div>

               <div className="hidden md:flex gap-4 mb-2 items-center">
                  {/* Pending Requests Indicator */}
                  {requests.length > 0 && (
                     <div className="bg-primary/20 border border-primary text-white px-4 py-2 rounded-lg flex items-center gap-2 animate-pulse">
                        <span className="material-symbols-outlined">notifications_active</span>
                        <span className="font-bold">{requests.length} Solicitudes</span>
                     </div>
                  )}

                  {isEditing ? (
                     <div className="flex gap-2">
                        <button onClick={() => setIsEditing(false)} className="bg-red-500/20 hover:bg-red-500/40 text-red-200 px-4 py-2 rounded-lg font-bold text-sm uppercase tracking-wide transition-colors">
                           Cancelar
                        </button>
                        <button onClick={handleSaveProfile} className="bg-primary text-background-dark px-4 py-2 rounded-lg font-bold text-sm uppercase tracking-wide hover:bg-white transition-colors">
                           Guardar
                        </button>
                     </div>
                  ) : (
                     <button onClick={() => setIsEditing(true)} className="bg-primary text-background-dark px-4 py-2 rounded-lg font-bold text-sm uppercase tracking-wide hover:bg-white transition-colors">
                        Editar Perfil
                     </button>
                  )}
               </div>
            </div>
         </div>

         {/* Main Content Grid */}
         <div className="p-4 md:p-8 pt-0 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:h-[600px] items-stretch">

            {/* Left Col: Friends & Overview */}
            <div className="lg:col-span-4 flex flex-col gap-6 h-full overflow-hidden">

               {/* Requests Notification Card (Mobile/Inline) */}
               {requests.length > 0 && (
                  <div className="bg-surface-dark border border-primary/50 shadow-glow rounded-xl p-4">
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

               {/* Search Users */}
               <div className="bg-surface-dark border border-white/5 rounded-xl p-4">
                  <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-2">Búsqueda Global</h3>
                  <div className="relative">
                     <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => handleSearch(e.target.value)}
                        placeholder="Buscar por nametag..."
                        className="w-full bg-surface-darker border border-white/10 rounded-lg py-2 px-3 pl-9 text-white text-sm focus:border-primary outline-none"
                     />
                     <span className="material-symbols-outlined absolute left-2 top-2 text-slate-500 text-[20px]">search</span>
                  </div>

                  {searchResults.length > 0 && (
                     <div className="mt-2 space-y-1">
                        {searchResults.map(result => (
                           <div
                              key={result.id}
                              onClick={() => navigate(`/profile/${result.id}`)}
                              className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg cursor-pointer transition-colors"
                           >
                              <img src={result.avatar} className="size-8 rounded-full" />
                              <div>
                                 <p className="text-white text-sm font-bold">{result.name}</p>
                                 <p className="text-primary text-xs">{result.handle.startsWith('@') ? result.handle : `@${result.handle}`}</p>
                              </div>
                           </div>
                        ))}
                     </div>
                  )}
               </div>

               {/* Friends List */}
               <div className="bg-surface-dark border border-white/5 rounded-xl flex flex-col overflow-hidden flex-1 min-h-0 shadow-2xl">
                  <div className="p-4 border-b border-white/5 flex justify-between items-center">
                     <h3 className="text-white font-bold text-sm uppercase tracking-wider">Enlace de Comms</h3>
                     <span className="bg-primary/20 text-primary text-[10px] px-2 py-0.5 rounded-full font-bold">{friends.length} Aliados</span>
                  </div>
                  <div className="flex-1 overflow-y-auto p-2 space-y-1">
                     {friends.length === 0 ? (
                        <div className="text-center p-4 text-slate-500 text-xs">
                           No hay conexiones activas. <br /> Busca usuarios para conectar.
                        </div>
                     ) : (
                        friends.map(friend => (
                           <button
                              key={friend.id}
                              onClick={() => setSelectedFriend(friend)}
                              className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${selectedFriend?.id === friend.id ? 'bg-primary/10 border border-primary/20' : 'hover:bg-white/5 border border-transparent'}`}
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
                                       onClick={(e) => {
                                          e.stopPropagation();
                                          navigate(`/profile/${friend.id}`);
                                       }}
                                       className={`text-sm font-bold hover:text-primary transition-colors cursor-pointer ${selectedFriend?.id === friend.id ? 'text-primary' : 'text-white'}`}
                                    >
                                       {friend.name}
                                    </span>
                                    <div className="flex items-center gap-2">
                                       {friend.unreadCount && friend.unreadCount > 0 && (
                                          <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full animate-pulse shadow-low-red">
                                             {friend.unreadCount}
                                          </span>
                                       )}
                                       <span
                                          onClick={(e) => {
                                             e.stopPropagation();
                                             navigate(`/profile/${friend.id}`);
                                          }}
                                          className="material-symbols-outlined text-[16px] text-slate-500 hover:text-primary opacity-0 group-hover/info:opacity-100 transition-all"
                                       >
                                          visibility
                                       </span>
                                    </div>
                                 </div>
                                 <p className="text-xs text-slate-500 truncate max-w-[150px]">{friend.handle.startsWith('@') ? friend.handle : `@${friend.handle}`}</p>
                              </div>
                           </button>
                        ))
                     )}
                  </div>
               </div>
            </div>

            {/* Right Col: Chat or Stats */}
            <div className="lg:col-span-8 h-full flex flex-col bg-surface-dark border border-white/5 rounded-xl overflow-hidden relative shadow-2xl">

               {selectedFriend ? (
                  /* Chat Interface */
                  <>
                     <div className="p-4 border-b border-white/5 bg-surface-darker flex justify-between items-center">
                        <div className="flex items-center gap-3">
                           <div
                              onClick={() => navigate(`/profile/${selectedFriend.id}`)}
                              className="relative cursor-pointer group"
                           >
                              <img src={selectedFriend.avatar} className="size-10 rounded-full border border-white/10 group-hover:border-primary transition-all" />
                              <div className="absolute inset-0 bg-primary/20 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                                 <span className="material-symbols-outlined text-white text-sm">visibility</span>
                              </div>
                           </div>
                           <div
                              onClick={() => navigate(`/profile/${selectedFriend.id}`)}
                              className="cursor-pointer group"
                           >
                              <h3 className="text-white font-bold text-sm group-hover:text-primary transition-colors">{selectedFriend.name}</h3>
                              <p className="text-slate-400 text-xs flex items-center gap-1">
                                 <span className={`size-1.5 rounded-full ${selectedFriend.status === 'online' ? 'bg-emerald-500' : 'bg-slate-500'}`}></span>
                                 {selectedFriend.handle.startsWith('@') ? selectedFriend.handle : `@${selectedFriend.handle}`}
                              </p>
                           </div>
                        </div>
                        <button onClick={() => setSelectedFriend(null)} className="text-slate-400 hover:text-white">
                           <span className="material-symbols-outlined">close</span>
                        </button>
                     </div>

                     <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#111117]/30 flex flex-col-reverse scrollbar-thin scrollbar-thumb-white/10">
                        {[...chatHistory].reverse().map(msg => (
                           <div key={msg.id} className={`flex ${msg.sender_id === user.id ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-[70%] p-3 rounded-xl text-sm ${msg.sender_id === user.id
                                 ? 'bg-primary text-[#111117] font-medium rounded-tr-none'
                                 : 'bg-surface-darker border border-white/10 text-slate-300 rounded-tl-none'
                                 }`}>
                                 {msg.content}
                                 <div className={`text-[9px] mt-1 opacity-60 text-right`}>
                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                 </div>
                              </div>
                           </div>
                        ))}
                     </div>

                     <div className="p-4 bg-surface-darker border-t border-white/5">
                        <div className="flex gap-2">
                           <input
                              type="text"
                              value={messageInput}
                              onChange={(e) => setMessageInput(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                              placeholder={`Mensaje a @${selectedFriend.handle.replace('@', '')}...`}
                              className="flex-1 bg-surface-dark border border-white/10 rounded-lg px-4 py-2 text-white text-sm focus:border-primary/50 focus:ring-1 focus:ring-primary/50 outline-none"
                           />
                           <button
                              onClick={handleSendMessage}
                              className="bg-primary/10 text-primary border border-primary/20 hover:bg-primary hover:text-[#111117] p-2 rounded-lg transition-colors"
                           >
                              <span className="material-symbols-outlined">send</span>
                           </button>
                        </div>
                     </div>
                  </>
               ) : (
                  /* Default Stats View */
                  <div className="h-full flex flex-col">
                     <div className="p-6 border-b border-white/5">
                        <h2 className="text-xl font-serif text-white">Métricas de Rendimiento</h2>
                     </div>
                     {/* ... Stats Content ... */}
                     <div className="flex-1 p-8 grid grid-cols-1 md:grid-cols-2 gap-8 items-center justify-center">
                        <div className="flex flex-col items-center gap-4 p-6 rounded-2xl bg-white/5 border border-white/5">
                           <div className="relative size-40">
                              <svg className="size-full -rotate-90" viewBox="0 0 36 36">
                                 <path className="text-white/5" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3"></path>
                                 <path className="text-primary" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeDasharray="85, 100" strokeLinecap="round" strokeWidth="3"></path>
                              </svg>
                              <div className="absolute inset-0 flex flex-col items-center justify-center">
                                 <span className="text-3xl font-bold text-white">85</span>
                                 <span className="text-xs text-slate-400 uppercase">Reputación</span>
                              </div>
                           </div>
                           <div className="text-center">
                              <h4 className="text-white font-bold">Rango Comunitario</h4>
                              <p className="text-sm text-slate-400">Top 15% de Contribuidores</p>
                           </div>
                        </div>
                     </div>
                     <div className="p-6 text-center border-t border-white/5">
                        <p className="text-slate-500 text-sm">Selecciona un aliado para abrir un canal privado.</p>
                     </div>
                  </div>
               )}

            </div>
         </div>
      </div>
   );
};

export default Profile;
