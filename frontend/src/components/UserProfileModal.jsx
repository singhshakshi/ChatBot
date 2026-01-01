import React, { useState, useRef } from 'react';
import { X, Camera, Save, User, Mail, AtSign, Smile } from 'lucide-react';
import { authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function UserProfileModal({ isOpen, onClose }) {
    const { user, updateUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef(null);

    const [formData, setFormData] = useState({
        username: user?.username || '',
        preferred_name: user?.preferred_name || '',
        bio: user?.bio || '',
        avatar_url: user?.avatar_url || ''
    });

    const [previewImage, setPreviewImage] = useState(user?.avatar_url || null);

    if (!isOpen) return null;

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewImage(reader.result);
                setFormData(prev => ({ ...prev, avatar_url: reader.result })); // Storing as base64 for simplicity in this demo
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await authAPI.updateProfile(formData);
            updateUser(response.data.user);
            onClose();
        } catch (error) {
            console.error("Failed to update profile", error);
            alert(error.response?.data?.message || "Failed to update profile");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100">

                {/* Header */}
                <div className="relative h-32 bg-gradient-to-r from-pink-300 to-violet-400 dark:from-gray-800 dark:to-gray-700">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/30 text-white rounded-full transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Profile Image - Overlapping Header */}
                <div className="relative px-6 -mt-16 flex justify-center">
                    <div className="relative group">
                        <div className="w-32 h-32 rounded-full border-4 border-white dark:border-gray-900 bg-white dark:bg-gray-800 shadow-lg overflow-hidden flex items-center justify-center">
                            {previewImage ? (
                                <img src={previewImage} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-4xl font-bold text-gray-400 dark:text-gray-600">
                                    {user?.username?.charAt(0).toUpperCase()}
                                </span>
                            )}
                        </div>

                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="absolute bottom-0 right-0 p-2.5 bg-violet-500 hover:bg-violet-600 text-white rounded-full shadow-lg transition-colors border-2 border-white dark:border-gray-900"
                        >
                            <Camera size={18} />
                        </button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handleImageChange}
                        />
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="text-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Edit Profile</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Update your personal details</p>
                    </div>

                    <div className="space-y-4">

                        {/* Preferred Name */}
                        <div className="relative group">
                            <div className="absolute top-3 left-3 text-gray-400 dark:text-gray-500 group-focus-within:text-violet-500 dark:group-focus-within:text-cyan-400 transition-colors">
                                <Smile size={18} />
                            </div>
                            <input
                                type="text"
                                name="preferred_name"
                                value={formData.preferred_name}
                                onChange={handleChange}
                                placeholder="What should we call you?"
                                className="w-full pl-10 p-3 bg-gray-50 dark:bg-gray-800 border-none rounded-xl focus:ring-2 focus:ring-violet-200 dark:focus:ring-cyan-900 text-gray-800 dark:text-gray-100 placeholder-gray-400 transition-all font-medium"
                            />
                        </div>

                        {/* Username */}
                        <div className="relative group">
                            <div className="absolute top-3 left-3 text-gray-400 dark:text-gray-500 group-focus-within:text-violet-500 dark:group-focus-within:text-cyan-400 transition-colors">
                                <AtSign size={18} />
                            </div>
                            <input
                                type="text"
                                name="username"
                                value={formData.username}
                                onChange={handleChange}
                                placeholder="Username"
                                required
                                className="w-full pl-10 p-3 bg-gray-50 dark:bg-gray-800 border-none rounded-xl focus:ring-2 focus:ring-violet-200 dark:focus:ring-cyan-900 text-gray-800 dark:text-gray-100 placeholder-gray-400 transition-all font-medium"
                            />
                        </div>

                        {/* Email (Read Only) */}
                        <div className="relative">
                            <div className="absolute top-3 left-3 text-gray-400 dark:text-gray-500">
                                <Mail size={18} />
                            </div>
                            <input
                                type="email"
                                value={user?.email || ''}
                                readOnly
                                className="w-full pl-10 p-3 bg-gray-100 dark:bg-gray-800/50 border-none rounded-xl text-gray-500 dark:text-gray-500 cursor-not-allowed font-medium"
                            />
                        </div>

                        {/* Bio */}
                        <div>
                            <textarea
                                name="bio"
                                value={formData.bio}
                                onChange={handleChange}
                                placeholder="Tell us a bit about yourself..."
                                rows={3}
                                className="w-full p-3 bg-gray-50 dark:bg-gray-800 border-none rounded-xl focus:ring-2 focus:ring-violet-200 dark:focus:ring-cyan-900 text-gray-800 dark:text-gray-100 placeholder-gray-400 transition-all font-medium resize-none"
                            />
                        </div>

                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex items-center justify-center space-x-2 p-3.5 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white font-bold shadow-lg shadow-violet-200 dark:shadow-none transition-all transform active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <Save size={18} />
                                    <span>Save Changes</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>

            </div>
        </div>
    );
}
