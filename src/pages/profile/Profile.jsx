import { useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../config/firebase';
import {
  User,
  Phone,
  MapPin,
  LogOut,
  ChevronRight,
  Settings,
  HelpCircle,
  ShieldCheck,
  Camera,
  Loader2,
} from 'lucide-react';

const Profile = () => {
  const { logout, user } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  // Fetch profile
  const { data: profile = {}, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const res = await api.get('/users/me');
      return res.data?.data?.user || {};
    },
  });

  // ── Firebase Storage photo upload ──────────────────────────────────────────
  const handlePhotoSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate: image only, max 5 MB
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select an image file.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image must be under 5 MB.');
      return;
    }

    setUploading(true);
    setUploadError('');

    try {
      const storageRef = ref(storage, `profile-photos/${user.uid}`);
      await uploadBytes(storageRef, file);
      const photoUrl = await getDownloadURL(storageRef);

      // Sync with backend
      await api.patch('/users/me', { photoUrl });

      // Refresh profile data
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    } catch (err) {
      console.error('[Profile] Photo upload failed:', err);
      setUploadError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
      // Reset input so same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const menuItems = [
    { icon: MapPin,      label: 'My Addresses' },
    { icon: Settings,    label: 'Settings' },
    { icon: ShieldCheck, label: 'Privacy & Security' },
    { icon: HelpCircle,  label: 'Help & Support' },
  ];

  return (
    <div className="flex flex-col bg-slate-50 min-h-screen">
      {/* Header Profile Area */}
      <div className="bg-white border-b border-slate-100 px-6 pt-12 pb-6 flex flex-col items-center">
        {/* Avatar with upload button */}
        <div className="relative mb-4">
          <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center border-4 border-white shadow-md overflow-hidden">
            {profile.photoUrl ? (
              <img
                src={profile.photoUrl}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-12 h-12 text-primary" />
            )}
          </div>

          {/* Camera button overlay */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="absolute bottom-0 right-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center shadow-lg border-2 border-white hover:bg-primary-dark transition-all disabled:opacity-60"
          >
            {uploading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Camera className="w-3.5 h-3.5" />
            )}
          </button>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePhotoSelect}
          />
        </div>

        {uploadError && (
          <p className="text-[11px] text-red-500 font-medium mb-2 text-center">{uploadError}</p>
        )}

        {isLoading ? (
          <div className="flex flex-col items-center gap-2 animate-pulse w-full">
            <div className="h-4 w-32 bg-slate-200 rounded" />
            <div className="h-3 w-24 bg-slate-100 rounded" />
          </div>
        ) : (
          <div className="text-center">
            <h2 className="text-lg font-bold text-slate-800">
              {profile.name || 'HandyGO Customer'}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1 justify-center">
              <Phone className="w-3 h-3 text-slate-400" />
              {profile.phone || 'N/A'}
            </p>
            {profile.email && (
              <p className="text-[11px] text-slate-400 mt-0.5">{profile.email}</p>
            )}
          </div>
        )}
      </div>

      {/* Account Settings Options */}
      <div className="px-6 py-6 space-y-4 flex-1">
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden divide-y divide-slate-50">
          {menuItems.map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex items-center justify-between p-4 hover:bg-slate-50 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-slate-100 text-slate-500 rounded-lg flex items-center justify-center">
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-sm font-semibold text-slate-700">{label}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </div>
          ))}
        </div>

        {/* Log Out Button */}
        <button
          onClick={logout}
          className="w-full bg-white border border-red-100 hover:bg-red-50 text-red-600 font-semibold text-sm py-4 rounded-2xl shadow-sm transition-all flex items-center justify-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          Log Out
        </button>
      </div>
    </div>
  );
};

export default Profile;
