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
  User
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

interface Task {
  id: string;
  task_name: string;
  description: string;
  id_user: string;
  created_at: string;
  updated_at: string;
}

interface JWTPayload {
  id: string;
  exp: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    } catch (err) {
      console.error('Failed to decode token', err);
      localStorage.removeItem('auth_token');
      router.push('/');
    }
  }, [router]);

  useEffect(() => {
    if (token) {
      const delayDebounceFn = setTimeout(() => {
        fetchTasks(token, searchQuery);
      }, 500); // 500ms debounce

      return () => clearTimeout(delayDebounceFn);
    }
  }, [searchQuery, token]);

  const fetchTasks = async (tk: string, query?: string) => {
    setIsLoading(true);
    try {
      const endpoint = query 
        ? `/api/tasks/search?q=${encodeURIComponent(query)}`
        : '/api/tasks/my';
        
      const response = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${tk}` }
      });
      setTasks(response.data);
    } catch (err: any) {
      console.error('Failed to fetch tasks', err);
      setError(err.response?.data?.error || 'Gagal memuat tugas');
    } finally {
      setIsLoading(false);
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

    try {
      await axios.delete(`/api/tasks/${taskId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchTasks(token);
    } catch (err: any) {
      console.error('Failed to delete task', err);
      alert('Gagal menghapus tugas');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    router.push('/');
  };

  if (!token) return null;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)', color: 'var(--foreground)' }}>
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
          <Link href="/profile" style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px', 
            padding: '10px 16px', 
            borderRadius: '12px', 
            color: 'var(--text-muted)',
            fontWeight: 500,
            fontSize: '14px'
          }}>
            <User size={18} />
            <span>Profil</span>
          </Link>
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

      <main style={{ padding: '40px', maxWidth: '1000px', margin: '0 auto' }}>
        <header style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <h1 style={{ fontSize: '36px', fontWeight: 700, marginBottom: '8px' }}>Tugas Saya</h1>
            <p style={{ color: 'var(--text-muted)' }}>Pantau dan kelola target harian Anda di satu tempat</p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
             <div style={{ position: 'relative' }}>
                <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  placeholder="Cari tugas..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ 
                    padding: '12px 12px 12px 40px', 
                    borderRadius: '12px', 
                    border: '1px solid var(--card-border)', 
                    background: 'var(--card-bg)', 
                    color: 'var(--foreground)',
                    width: '240px',
                    outline: 'none',
                    transition: 'all 0.2s',
                    boxShadow: searchQuery ? '0 0 0 3px rgba(79, 70, 229, 0.1)' : 'none'
                  }} 
                />
             </div>
          </div>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '40px', alignItems: 'start' }}>
          {/* Main Task List */}
          <section>
            {isLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '100px 0' }}>
                <Loader2 className="animate-spin" size={40} color="var(--primary)" />
              </div>
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <AnimatePresence>
                  {tasks.map((task, idx) => (
                    <motion.div 
                      key={task.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      style={{ 
                        padding: '20px', 
                        background: 'var(--card-bg)', 
                        borderRadius: '20px', 
                        border: '1px solid var(--card-border)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '20px',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        cursor: 'pointer',
                        position: 'relative'
                      }}
                    >
                      <div style={{ color: 'var(--primary)' }}>
                        <Circle size={22} />
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
                          style={{ padding: '8px', borderRadius: '8px', color: '#ef4444' }}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
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
                <div style={{ display: 'flex', flex_direction: 'column', gap: '8px' }}>
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
      </main>
    </div>
  );
}
