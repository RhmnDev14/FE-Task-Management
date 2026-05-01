'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  LogOut, 
  LayoutDashboard, 
  Plus, 
  Search, 
  CheckCircle2, 
  Circle, 
  Clock, 
  Calendar,
  MoreVertical,
  Trash2,
  Edit2,
  Loader2,
  Inbox,
  AlertCircle,
  User,
  Users,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import TaskSkeleton from '../components/TaskSkeleton';
import ProgressBar from '../components/ProgressBar';

interface Task {
  id: string;
  task_name: string;
  description: string;
  id_user: string;
  created_at: string;
  updated_at: string;
}

interface Group {
  id: string;
  name: string;
  created_at: string;
}

interface JWTPayload {
  id: string;
  exp: number;
}

interface UserProfile {
  id: string;
  username: string;
  email: string;
  avatar_url?: string;
  role_name?: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 5,
    totalItems: 0,
    totalPages: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [displayAvatarUrl, setDisplayAvatarUrl] = useState<string | null>(null);

  // Group state
  const [groups, setGroups] = useState<Group[]>([]);
  const [isGroupsLoading, setIsGroupsLoading] = useState(true);

  // New task form state
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const storedToken = localStorage.getItem('auth_token');
    if (!storedToken) {
      router.push('/');
      return;
    }

    try {
      const decoded: JWTPayload = jwtDecode(storedToken);
      setToken(storedToken);
      setUserId(decoded.id);
      fetchTasks(storedToken);
      fetchProfile(storedToken);
      fetchGroups(storedToken);
    } catch (err) {
      console.error('Failed to decode token', err);
      localStorage.removeItem('auth_token');
      router.push('/');
    }
  }, [router]);

  const fetchProfile = async (tk: string) => {
    try {
      const response = await axios.get('/api/auth/me', {
        headers: { Authorization: `Bearer ${tk}` }
      });
      const userData = response.data;
      setProfile(userData);
      
      // Fetch presigned view URL if avatar exists
      if (userData.avatar_url) {
        try {
          const fileName = userData.avatar_url.includes('/') 
            ? userData.avatar_url.split('/').pop() 
            : userData.avatar_url;
            
          const viewRes = await axios.get(`/api/s3/view/${fileName}`, {
            headers: { Authorization: `Bearer ${tk}` }
          });
          setDisplayAvatarUrl(viewRes.data.url);
        } catch (viewErr) {
          console.error('Failed to fetch avatar view URL', viewErr);
          if (userData.avatar_url.startsWith('http')) {
            setDisplayAvatarUrl(userData.avatar_url);
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch profile', err);
    }
  };

  const fetchGroups = async (tk: string) => {
    setIsGroupsLoading(true);
    try {
      const response = await axios.get('/api/groups', {
        headers: { Authorization: `Bearer ${tk}` }
      });
      setGroups(response.data.items || []);
    } catch (err) {
      console.error('Failed to fetch groups', err);
    } finally {
      setIsGroupsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      setIsSearching(true);
      const delayDebounceFn = setTimeout(() => {
        fetchTasks(token, searchQuery);
      }, 500); // 500ms debounce

      return () => {
        clearTimeout(delayDebounceFn);
        setIsSearching(false);
      };
    }
  }, [searchQuery, token]);

  const fetchTasks = async (tk: string, query?: string, page: number = 1, limit?: number) => {
    setIsLoading(true);
    const currentLimit = limit || pagination.limit;
    try {
      const endpoint = query 
        ? `/api/tasks/search?q=${encodeURIComponent(query)}&page=${page}&limit=${currentLimit}`
        : `/api/tasks/my?page=${page}&limit=${currentLimit}`;
        
      const response = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${tk}` }
      });
      
      // Handle the new paginated structure
      const { items, total_items, total_pages, page: currentPage, limit: responseLimit } = response.data;
      
      setTasks(items || []);
      setPagination({
        page: currentPage,
        limit: responseLimit || currentLimit,
        totalItems: total_items,
        totalPages: total_pages
      });
    } catch (err: any) {
      console.error('Failed to fetch tasks', err);
      setError(err.response?.data?.error || 'Gagal memuat tugas');
    } finally {
      setIsLoading(false);
      setIsSearching(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (token && newPage >= 1 && newPage <= pagination.totalPages) {
      fetchTasks(token, searchQuery, newPage);
    }
  };

  const handleLimitChange = (newLimit: number) => {
    if (token) {
      // Fetch page 1 with new limit
      fetchTasks(token, searchQuery, 1, newLimit);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !userId) return;

    setIsCreating(true);
    try {
      await axios.post('/api/tasks', {
        task_name: newTaskName,
        description: newTaskDesc,
        id_user: userId
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setNewTaskName('');
      setNewTaskDesc('');
      fetchTasks(token);
    } catch (err: any) {
      console.error('Failed to create task', err);
      alert(err.response?.data?.error || 'Gagal membuat tugas');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!token || !userId || !confirm('Yakin ingin menghapus tugas ini?')) return;

    setIsDeleting(taskId);
    try {
      await axios.delete(`/api/tasks/${taskId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchTasks(token);
    } catch (err: any) {
      console.error('Failed to delete task', err);
      alert('Gagal menghapus tugas');
    } finally {
      setIsDeleting(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    router.push('/');
  };

  if (!token) return null;

  const isActionLoading = isCreating || isDeleting !== null || isSearching;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)', color: 'var(--foreground)' }}>
      {/* Top progress bar for actions */}
      <ProgressBar show={isActionLoading} />
      {/* Sidebar / Topbar mix */}
      <nav style={{ 
        position: 'sticky', 
        top: 0, 
        zIndex: 50, 
        padding: '16px 40px', 
        background: 'rgba(255, 255, 255, 0.8)', 
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--card-border)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ padding: '8px', background: 'linear-gradient(135deg, var(--primary), #8b5cf6)', borderRadius: '12px', color: 'white' }}>
            <LayoutDashboard size={24} />
          </div>
          <span style={{ fontWeight: 700, fontSize: '20px', letterSpacing: '-0.5px' }}>Aura</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          {profile && (
            <Link href="/profile" style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px', 
              padding: '6px 12px', 
              paddingRight: '16px',
              borderRadius: '16px', 
              background: 'rgba(79, 70, 229, 0.05)',
              border: '1px solid rgba(79, 70, 229, 0.1)',
              transition: 'all 0.2s',
              textDecoration: 'none'
            }}>
              <div style={{ 
                width: '36px', 
                height: '36px', 
                borderRadius: '10px', 
                overflow: 'hidden',
                background: '#f1f5f9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid white'
              }}>
                <img 
                  src={displayAvatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.username)}&background=4f46e5&color=fff&size=256`} 
                  alt="Avatar" 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--foreground)', lineHeight: 1.2 }}>{profile.username}</span>
                <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--primary)', opacity: 0.8 }}>{profile.role_name || 'User'}</span>
              </div>
            </Link>
          )}
          <button 
            onClick={handleLogout}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              padding: '10px 20px', 
              borderRadius: '12px', 
              background: 'rgba(239, 68, 68, 0.1)', 
              color: '#b91c1c',
              fontWeight: 500,
              fontSize: '14px',
              transition: 'all 0.2s'
            }}
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </nav>

      <div style={{ display: 'flex', width: '100%', alignItems: 'flex-start' }}>
        {/* Left Sidebar for Groups */}
        <aside style={{ 
          width: '260px', 
          padding: '32px 16px', 
          borderRight: '1px solid var(--card-border)', 
          minHeight: 'calc(100vh - 73px)',
          position: 'sticky',
          top: '73px',
          background: 'var(--card-bg)'
        }}>
          <h2 style={{ 
            fontSize: '12px', 
            fontWeight: 700, 
            color: 'var(--text-muted)', 
            textTransform: 'uppercase', 
            letterSpacing: '0.5px', 
            marginBottom: '16px', 
            padding: '0 12px',
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px' 
          }}>
            <Users size={16} />
            Grup Pengguna
          </h2>
          {isGroupsLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
               <Loader2 className="animate-spin" size={24} color="var(--primary)" />
            </div>
          ) : groups.length === 0 ? (
            <div style={{ 
              padding: '16px', 
              background: 'var(--card-bg)', 
              borderRadius: '12px', 
              border: '1px dashed var(--card-border)',
              textAlign: 'center'
            }}>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Belum ada grup.</p>
            </div>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {groups.map(group => (
                <li key={group.id}>
                  <Link href={`/dashboard?group_id=${group.id}`} style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '12px', 
                    padding: '10px 12px', 
                    borderRadius: '10px', 
                    color: 'var(--foreground)',
                    textDecoration: 'none',
                    transition: 'all 0.2s',
                    fontWeight: 600,
                    fontSize: '14px',
                    background: 'transparent',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(79, 70, 229, 0.05)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{ 
                      width: '32px', 
                      height: '32px', 
                      borderRadius: '8px', 
                      background: 'rgba(79, 70, 229, 0.1)', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      color: 'var(--primary)',
                      fontWeight: 700,
                      fontSize: '14px'
                    }}>
                      {group.name.charAt(0).toUpperCase()}
                    </div>
                    {group.name}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </aside>

        <main style={{ flex: 1, padding: '40px 60px', minWidth: 0, display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: '100%', maxWidth: '1140px' }}>
          <header style={{ 
          marginBottom: '32px', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          padding: '8px 0'
        }}>
          <div>
            <h1 style={{ fontSize: '32px', fontWeight: 800, color: 'var(--foreground)', marginBottom: '4px', letterSpacing: '-1px' }}>Tugas Saya</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', fontWeight: 500 }}>Kelola produktivitas harian Anda</p>
          </div>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
             <div style={{ position: 'relative', width: '320px' }}>
                <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', zIndex: 10 }} />
                <input 
                  placeholder="Cari sesuatu..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ 
                    padding: '12px 16px 12px 46px', 
                    borderRadius: '14px', 
                    border: '1px solid var(--card-border)', 
                    background: 'rgba(255, 255, 255, 0.8)', 
                    color: 'var(--foreground)',
                    width: '100%',
                    outline: 'none',
                    fontSize: '14px',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 2px 10px -3px rgba(0,0,0,0.05)',
                    backdropFilter: 'blur(8px)'
                  }} 
                />
             </div>
          </div>
        </header>


        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '40px', alignItems: 'start' }}>
          {/* Main Task List */}
          <section>
            {isLoading ? (
              <TaskSkeleton count={4} />
            ) : tasks.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '80px 40px', 
                background: 'var(--card-bg)', 
                borderRadius: '24px', 
                border: '2px dashed var(--card-border)',
                color: 'var(--text-muted)'
              }}>
                <Inbox size={48} style={{ margin: '0 auto 20px', opacity: 0.3 }} />
                <h3>Belum ada tugas</h3>
                <p style={{ fontSize: '14px', marginTop: '8px' }}>Mulai dengan menambahkan tugas baru di panel sebelah kanan</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 250px)', minHeight: '400px' }}>
                <div 
                  className="custom-scrollbar"
                  style={{ 
                    flex: 1, 
                    overflowY: 'auto', 
                    paddingRight: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                    marginBottom: '16px'
                  }}
                >
                  <AnimatePresence>
                    {tasks.map((task, idx) => (
                      <motion.div 
                        key={task.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        style={{ 
                          padding: '24px', 
                          background: 'white', 
                          borderRadius: '24px', 
                          border: '1px solid var(--card-border)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '20px',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          cursor: 'pointer',
                          position: 'relative',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                        }}
                        whileHover={{ y: -4, boxShadow: '0 12px 20px -8px rgba(0,0,0,0.1)' }}
                      >
                        <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(79, 70, 229, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                          <Circle size={24} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <h3 style={{ fontSize: '17px', fontWeight: 600, marginBottom: '4px' }}>{task.task_name}</h3>
                          <p style={{ fontSize: '14px', color: 'var(--text-muted)', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {task.description || 'Tidak ada deskripsi'}
                          </p>
                          <div style={{ display: 'flex', gap: '16px', marginTop: '12px', fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={14} /> {new Date(task.created_at).toLocaleDateString()}</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={14} /> Baru</span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button 
                            onClick={() => handleDeleteTask(task.id)}
                            disabled={isDeleting === task.id}
                            style={{ 
                              padding: '8px', 
                              borderRadius: '8px', 
                              color: '#ef4444',
                              opacity: isDeleting === task.id ? 0.5 : 1,
                              transition: 'opacity 0.2s'
                            }}
                          >
                            {isDeleting === task.id ? (
                              <Loader2 className="animate-spin" size={18} />
                            ) : (
                              <Trash2 size={18} />
                            )}
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                {/* Pagination Controls */}
                {pagination.totalItems > 0 && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      padding: '12px 20px',
                      background: 'var(--card-bg)',
                      borderRadius: '16px',
                      border: '1px solid var(--card-border)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                      <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500 }}>
                        Menampilkan <span style={{ color: 'var(--foreground)' }}>{(pagination.page - 1) * pagination.limit + 1}-{Math.min(pagination.page * pagination.limit, pagination.totalItems)}</span> dari <span style={{ color: 'var(--foreground)' }}>{pagination.totalItems}</span> tugas
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingLeft: '20px', borderLeft: '1px solid var(--card-border)' }}>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>Baris per halaman:</span>
                        <select 
                          value={pagination.limit}
                          onChange={(e) => handleLimitChange(Number(e.target.value))}
                          style={{
                            padding: '4px 8px',
                            borderRadius: '8px',
                            border: '1px solid var(--card-border)',
                            background: 'white',
                            fontSize: '12px',
                            fontWeight: 600,
                            color: 'var(--foreground)',
                            cursor: 'pointer',
                            outline: 'none'
                          }}
                        >
                          <option value={5}>5</option>
                          <option value={10}>10</option>
                          <option value={20}>20</option>
                          <option value={50}>50</option>
                        </select>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <button 
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={pagination.page === 1}
                        style={{ 
                          padding: '8px', 
                          borderRadius: '10px', 
                          background: 'white', 
                          border: '1px solid var(--card-border)',
                          color: pagination.page === 1 ? '#cbd5e1' : 'var(--foreground)',
                          cursor: pagination.page === 1 ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                      >
                        <ChevronLeft size={18} />
                      </button>
                      
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                          // Simple pagination logic showing up to 5 pages around current
                          let pageNum = pagination.page;
                          if (pagination.totalPages <= 5) {
                            pageNum = i + 1;
                          } else {
                             if (pagination.page <= 3) pageNum = i + 1;
                             else if (pagination.page >= pagination.totalPages - 2) pageNum = pagination.totalPages - 4 + i;
                             else pageNum = pagination.page - 2 + i;
                          }
                          
                          return (
                            <button 
                              key={pageNum}
                              onClick={() => handlePageChange(pageNum)}
                              style={{ 
                                width: '36px', 
                                height: '36px', 
                                borderRadius: '10px', 
                                background: pagination.page === pageNum ? 'var(--primary)' : 'white',
                                color: pagination.page === pageNum ? 'white' : 'var(--foreground)',
                                fontWeight: 600,
                                fontSize: '13px',
                                border: '1px solid var(--card-border)',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                              }}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                      </div>

                      <button 
                        onClick={() => handlePageChange(pagination.page + 1)}
                        disabled={pagination.page === pagination.totalPages}
                        style={{ 
                          padding: '8px', 
                          borderRadius: '10px', 
                          background: 'white', 
                          border: '1px solid var(--card-border)',
                          color: pagination.page === pagination.totalPages ? '#cbd5e1' : 'var(--foreground)',
                          cursor: pagination.page === pagination.totalPages ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                      >
                        <ChevronRight size={18} />
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            )}
          </section>

          {/* New Task Form Sidebar */}
          <aside style={{ position: 'sticky', top: '120px' }}>
            <div style={{ 
              background: 'var(--card-bg)', 
              padding: '24px', 
              borderRadius: '24px', 
              border: '1px solid var(--card-border)',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)'
            }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Plus size={20} color="var(--primary)" />
                Tambah Tugas
              </h2>
              
              <form onSubmit={handleCreateTask} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>Nama Tugas</label>
                  <input 
                    required
                    value={newTaskName}
                    onChange={(e) => setNewTaskName(e.target.value)}
                    placeholder="Contoh: Beli Kopi" 
                    style={{ 
                      padding: '12px', 
                      borderRadius: '12px', 
                      border: '1px solid var(--card-border)', 
                      background: 'var(--input-bg)', 
                      color: 'var(--foreground)' 
                    }} 
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>Deskripsi</label>
                  <textarea 
                    value={newTaskDesc}
                    onChange={(e) => setNewTaskDesc(e.target.value)}
                    placeholder="Opsional" 
                    rows={4}
                    style={{ 
                      padding: '12px', 
                      borderRadius: '12px', 
                      border: '1px solid var(--card-border)', 
                      background: 'var(--input-bg)', 
                      color: 'var(--foreground)',
                      resize: 'none',
                      fontFamily: 'inherit'
                    }} 
                  />
                </div>
                <button 
                  type="submit"
                  disabled={isCreating || !newTaskName}
                  style={{ 
                    marginTop: '8px',
                    background: 'linear-gradient(135deg, var(--primary), #8b5cf6)', 
                    color: 'white', 
                    padding: '14px', 
                    borderRadius: '12px', 
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 10px 15px -3px rgba(99, 102, 241, 0.3)'
                  }}
                >
                  {isCreating ? <Loader2 className="animate-spin" size={20} /> : 'Simpan Tugas'}
                </button>
              </form>
            </div>

            <div style={{ 
              marginTop: '20px', 
              padding: '20px', 
              background: 'rgba(99, 102, 241, 0.05)', 
              borderRadius: '24px', 
              border: '1px solid rgba(99, 102, 241, 0.1)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <div style={{ color: 'var(--primary)' }}><AlertCircle size={20} /></div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                Gunakan deskripsi untuk detail lebih lanjut mengenai tugas Anda.
              </p>
            </div>
          </aside>
        </div>
          </div>
        </main>
      </div>
    </div>
  );
}
