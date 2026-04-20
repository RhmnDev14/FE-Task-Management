'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  User, 
  Mail, 
  Calendar, 
  Shield, 
  ArrowLeft, 
  LogOut, 
  Edit,
  Camera,
  Loader2,
  Lock,
  ArrowRight,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import Link from 'next/link';
import LoadingSpinner from '../components/LoadingSpinner';
import ProgressBar from '../components/ProgressBar';

interface UserProfile {
  id: string;
  username: string;
  email: string;
  avatar_url?: string;
  role_name?: string;
  created_at: string;
  updated_at: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passError, setPassError] = useState<string | null>(null);
  const [passSuccess, setPassSuccess] = useState<string | null>(null);
  const [isSubmittingPass, setIsSubmittingPass] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editUsername, setEditUsername] = useState('');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [displayAvatarUrl, setDisplayAvatarUrl] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      router.push('/');
      return;
    }

    const fetchProfile = async () => {
      try {
        const response = await axios.get('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const userData = response.data;
        setProfile(userData);
        
        // Fetch presigned view URL if avatar exists
        if (userData.avatar_url) {
          try {
            // Extract filename if it's a full URL
            const fileName = userData.avatar_url.includes('/') 
              ? userData.avatar_url.split('/').pop() 
              : userData.avatar_url;
              
            const viewRes = await axios.get(`/api/s3/view/${fileName}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            setDisplayAvatarUrl(viewRes.data.url);
          } catch (viewErr) {
            console.error('Failed to fetch avatar view URL', viewErr);
            // Fallback to original avatar field if view API fails
            if (userData.avatar_url.startsWith('http')) {
              setDisplayAvatarUrl(userData.avatar_url);
            }
          }
        }
      } catch (err: any) {
        console.error('Failed to fetch profile', err);
        if (err.response?.status === 401) {
          localStorage.removeItem('auth_token');
          router.push('/');
        } else {
          setError('Gagal memuat profil');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    router.push('/');
  };

  const handleCameraClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Tolong pilih file gambar');
      return;
    }

    setIsUploading(true);
    const token = localStorage.getItem('auth_token');

    try {
      // 1. Get presigned URL
      const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
      const presignedRes = await axios.post('/api/s3/presigned-url', {
        file_name: fileName
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const { upload_url } = presignedRes.data;

      // 2. Upload file to S3/MinIO
      await axios.put(upload_url, file, {
        headers: {
          'Content-Type': file.type
        }
      });

      // 3. Update user profile with just the file name
      // This allows the view API to handle URL generation
      const updateRes = await axios.put('/api/auth/me', {
        avatar_url: fileName
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const updatedProfile = updateRes.data;
      setProfile(updatedProfile);
      
      // 4. Fetch the new view URL immediately
      try {
        const viewRes = await axios.get(`/api/s3/view/${fileName}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setDisplayAvatarUrl(viewRes.data.url);
      } catch (viewErr) {
        console.error('Failed to fetch new avatar view URL', viewErr);
        // Fallback to the direct URL if possible
        setDisplayAvatarUrl(upload_url.split('?')[0]);
      }
      
      alert('Avatar berhasil diperbarui!');
    } catch (err) {
      console.error('Failed to upload avatar', err);
      alert('Gagal mengupload avatar');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };
  const handleUpdateProfile = async () => {
    if (!editUsername || editUsername === profile?.username) {
      setIsEditing(false);
      return;
    }

    setIsUpdatingProfile(true);
    const token = localStorage.getItem('auth_token');

    try {
      const response = await axios.put('/api/auth/me', {
        username: editUsername
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setProfile(response.data);
      setIsEditing(false);
    } catch (err: any) {
      console.error('Failed to update profile', err);
      alert(err.response?.data?.error || 'Gagal memperbarui profil');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError(null);
    setPassSuccess(null);

    if (newPassword !== confirmPassword) {
      setPassError('Password baru dan konfirmasi tidak cocok');
      return;
    }

    if (newPassword.length < 6) {
      setPassError('Password baru minimal 6 karakter');
      return;
    }

    setIsSubmittingPass(true);
    const token = localStorage.getItem('auth_token');

    try {
      await axios.put('/api/auth/change-password', {
        current_password: currentPassword,
        new_password: newPassword
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setPassSuccess('Password berhasil diperbarui!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setIsChangingPassword(false);
        setPassSuccess(null);
      }, 2000);
    } catch (err: any) {
      console.error('Failed to change password', err);
      const msg = err.response?.data?.error || 'Gagal memperbarui password';
      setPassError(msg);
    } finally {
      setIsSubmittingPass(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner variant="fullpage" message="Memuat profil..." />;
  }

  if (error || !profile) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--background)', flexDirection: 'column', gap: '16px' }}>
        <div style={{ 
          padding: '16px', 
          background: 'rgba(239, 68, 68, 0.1)', 
          borderRadius: '16px', 
          color: '#ef4444' 
        }}>
          <AlertCircle size={32} />
        </div>
        <p style={{ color: '#b91c1c', fontWeight: 600 }}>{error || 'Profil tidak ditemukan'}</p>
        <Link href="/dashboard" style={{ 
          color: 'var(--primary)', 
          fontWeight: 500, 
          fontSize: '14px', 
          marginTop: '8px'
        }}>
          ← Kembali ke Dashboard
        </Link>
      </div>
    );
  }

  const isBusy = isUploading || isUpdatingProfile || isSubmittingPass;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)', padding: '40px' }}>
      <ProgressBar show={isBusy} />
      <main style={{ maxWidth: '800px', margin: '0 auto' }}>
        {/* Hidden File Input */}
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          style={{ display: 'none' }} 
          accept="image/*"
        />

        {/* Header Navigation */}
        <div style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link href="/dashboard" style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px', 
            color: 'var(--text-muted)', 
            fontWeight: 500,
            fontSize: '14px',
            padding: '8px 12px',
            borderRadius: '12px',
            transition: 'all 0.2s',
            background: 'white',
            border: '1px solid var(--card-border)'
          }}>
            <ArrowLeft size={18} />
            Kembali ke Dashboard
          </Link>
          <button 
            onClick={handleLogout}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              background: 'rgba(239, 68, 68, 0.1)', 
              color: '#b91c1c', 
              padding: '10px 16px', 
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: 600
            }}
          >
            <LogOut size={18} />
            Keluar
          </button>
        </div>

        {/* Profile Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ 
            background: 'white', 
            borderRadius: '32px', 
            overflow: 'hidden', 
            border: '1px solid var(--card-border)',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.05)'
          }}
        >
          {/* Cover Area */}
          <div style={{ height: '160px', background: 'linear-gradient(135deg, var(--primary), #8b5cf6)', position: 'relative' }}>
            <div style={{ 
              position: 'absolute', 
              bottom: '-60px', 
              left: '40px', 
              width: '120px', 
              height: '120px', 
              borderRadius: '32px', 
              background: 'white', 
              padding: '6px',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
            }}>
              <div style={{ 
                width: '100%', 
                height: '100%', 
                borderRadius: '26px', 
                background: '#f1f5f9', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: 'var(--primary)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                {isUploading ? (
                  <Loader2 className="animate-spin" size={32} />
                ) : (
                  <img 
                    src={displayAvatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.username)}&background=4f46e5&color=fff&size=256`} 
                    alt="Avatar" 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                  />
                )}
                
                <button 
                  onClick={handleCameraClick}
                  disabled={isUploading}
                  style={{ 
                    position: 'absolute', 
                    bottom: '-4px', 
                    right: '-4px', 
                    background: 'white', 
                    padding: '8px', 
                    borderRadius: '10px', 
                    border: '1px solid #e2e8f0',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    zIndex: 10
                  }}
                >
                  <Camera size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div style={{ padding: '80px 40px 40px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px' }}>
              <div style={{ flex: 1 }}>
                {isEditing ? (
                  <input 
                    type="text" 
                    value={editUsername} 
                    onChange={(e) => setEditUsername(e.target.value)} 
                    placeholder="Username"
                    autoFocus
                    style={{ 
                      fontSize: '28px', 
                      fontWeight: 700, 
                      marginBottom: '8px', 
                      border: 'none', 
                      borderBottom: '2px solid var(--primary)', 
                      outline: 'none',
                      width: '100%',
                      background: 'transparent'
                    }} 
                  />
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                    <h1 style={{ fontSize: '28px', fontWeight: 700 }}>{profile.username}</h1>
                    {profile.role_name && (
                      <span style={{ 
                        padding: '4px 10px', 
                        background: 'rgba(79, 70, 229, 0.1)', 
                        color: 'var(--primary)', 
                        borderRadius: '20px', 
                        fontSize: '12px', 
                        fontWeight: 600,
                        marginTop: '4px'
                      }}>
                        {profile.role_name}
                      </span>
                    )}
                  </div>
                )}
                <p style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px' }}>
                  <Mail size={14} />
                  {profile.email}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {isEditing ? (
                  <>
                    <button 
                      onClick={() => setIsEditing(false)}
                      disabled={isUpdatingProfile}
                      style={{ 
                        background: '#f1f5f9', 
                        color: 'var(--text-muted)', 
                        padding: '10px 16px', 
                        borderRadius: '12px', 
                        fontWeight: 600, 
                        fontSize: '14px'
                      }}
                    >
                      Batal
                    </button>
                    <button 
                      onClick={handleUpdateProfile}
                      disabled={isUpdatingProfile}
                      style={{ 
                        background: 'var(--primary)', 
                        color: 'white', 
                        padding: '10px 20px', 
                        borderRadius: '12px', 
                        fontWeight: 600, 
                        fontSize: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      {isUpdatingProfile ? <Loader2 className="animate-spin" size={16} /> : 'Simpan'}
                    </button>
                  </>
                ) : (
                  <button 
                    onClick={() => {
                      setEditUsername(profile.username);
                      setIsEditing(true);
                    }}
                    style={{ 
                      background: 'var(--primary)', 
                      color: 'white', 
                      padding: '10px 20px', 
                      borderRadius: '12px', 
                      fontWeight: 600, 
                      fontSize: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <Edit size={16} />
                    Edit Profil
                  </button>
                )}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
              <div style={{ 
                padding: '24px', 
                background: '#f8fafc', 
                borderRadius: '24px', 
                border: '1px solid #e2e8f0'
              }}>
                <div style={{ color: 'var(--primary)', marginBottom: '16px' }}><Shield size={20} /></div>
                <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>User ID</h3>
                <p style={{ fontSize: '14px', fontWeight: 600, wordBreak: 'break-all', fontFamily: 'monospace' }}>{profile.id}</p>
              </div>

              <div style={{ 
                padding: '24px', 
                background: '#f8fafc', 
                borderRadius: '24px', 
                border: '1px solid #e2e8f0'
              }}>
                <div style={{ color: 'var(--primary)', marginBottom: '16px' }}><Calendar size={20} /></div>
                <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>Member Sejak</h3>
                <p style={{ fontSize: '14px', fontWeight: 600 }}>{new Date(profile.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              </div>
            </div>

            {/* Quick Actions */}
            <div style={{ marginTop: '40px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>Keamanan</h3>
              <div style={{ background: '#f8fafc', borderRadius: '24px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                <div 
                  onClick={() => setIsChangingPassword(!isChangingPassword)}
                  style={{ 
                    padding: '16px 24px', 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    borderBottom: isChangingPassword ? '1px solid #e2e8f0' : '1px solid #e2e8f0',
                    cursor: 'pointer',
                    background: isChangingPassword ? '#f1f5f9' : 'transparent',
                    transition: 'all 0.2s'
                  }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ padding: '8px', background: 'white', borderRadius: '10px', color: isChangingPassword ? 'var(--primary)' : 'var(--text-muted)' }}>
                      <Lock size={16} />
                    </div>
                    <div>
                      <span style={{ fontSize: '14px', fontWeight: 500, display: 'block' }}>Ganti Password</span>
                      {isChangingPassword && <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Amankan akun anda dengan password baru</span>}
                    </div>
                  </div>
                  <motion.div
                    animate={{ rotate: isChangingPassword ? 90 : 0 }}
                  >
                    <ArrowRight size={16} color="#cbd5e1" />
                  </motion.div>
                </div>

                <AnimatePresence>
                  {isChangingPassword && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      style={{ overflow: 'hidden' }}
                    >
                      <form onSubmit={handleChangePassword} style={{ padding: '24px' }}>
                        <div style={{ display: 'grid', gap: '16px' }}>
                          <div>
                            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px', display: 'block' }}>Password Saat Ini</label>
                            <input 
                              type="password" 
                              required
                              value={currentPassword}
                              onChange={(e) => setCurrentPassword(e.target.value)}
                              placeholder="••••••••"
                              style={{ 
                                width: '100%', 
                                padding: '12px 16px', 
                                borderRadius: '12px', 
                                border: '1px solid #e2e8f0',
                                fontSize: '14px'
                              }} 
                            />
                          </div>
                          <div>
                            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px', display: 'block' }}>Password Baru</label>
                            <input 
                              type="password" 
                              required
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              placeholder="••••••••"
                              style={{ 
                                width: '100%', 
                                padding: '12px 16px', 
                                borderRadius: '12px', 
                                border: '1px solid #e2e8f0',
                                fontSize: '14px'
                              }} 
                            />
                          </div>
                          <div>
                            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px', display: 'block' }}>Konfirmasi Password Baru</label>
                            <input 
                              type="password" 
                              required
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              placeholder="••••••••"
                              style={{ 
                                width: '100%', 
                                padding: '12px 16px', 
                                borderRadius: '12px', 
                                border: '1px solid #e2e8f0',
                                fontSize: '14px'
                              }} 
                            />
                          </div>

                          {passError && (
                            <div style={{ color: '#ef4444', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <AlertCircle size={14} />
                              {passError}
                            </div>
                          )}

                          {passSuccess && (
                            <div style={{ color: '#10b981', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <Sparkles size={14} />
                              {passSuccess}
                            </div>
                          )}

                          <button 
                            type="submit"
                            disabled={isSubmittingPass}
                            style={{ 
                              background: 'var(--primary)', 
                              color: 'white', 
                              padding: '12px', 
                              borderRadius: '12px', 
                              fontWeight: 600,
                              fontSize: '14px',
                              marginTop: '8px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '8px'
                            }}
                          >
                            {isSubmittingPass ? <Loader2 className="animate-spin" size={18} /> : 'Update Password'}
                          </button>
                        </div>
                      </form>
                    </motion.div>
                  )}
                </AnimatePresence>
                <div style={{ 
                  padding: '16px 24px', 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  cursor: 'pointer'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ padding: '8px', background: 'white', borderRadius: '10px', color: 'var(--text-muted)' }}><Shield size={16} /></div>
                    <span style={{ fontSize: '14px', fontWeight: 500 }}>Autentikasi Dua Faktor</span>
                  </div>
                  <ArrowRight size={16} color="#cbd5e1" />
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
