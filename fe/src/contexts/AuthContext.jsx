import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../services/supabase";
import { userApi } from "../services/userApi";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // State for modal
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState("login"); // "login" or "register"

  const [toast, setToast] = useState({ visible: false, message: "", type: "success" });

  const showToast = (message, type = "success") => {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast({ visible: false, message: "", type: "success" }), 3000);
  };

  const [userData, setUserData] = useState(null);

  // Lấy auth token từ session
  const getAuthToken = () => {
    return session?.access_token || null;
  };

  useEffect(() => {
    const fetchUserData = async (authUser) => {
      if (!authUser) {
        setUserData(null);
        return;
      }
      // Dùng BE API để lấy profile
      try {
        const token = session?.access_token;
        if (token) {
          const profile = await userApi.getMyProfile(token);
          setUserData(profile);
        }
      } catch (err) {
        console.warn('fetchUserData from BE error:', err);
        // Fallback: tạo userData từ authUser nếu chưa có trên BE
        setUserData({
          id: authUser.id,
          name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'Người dùng',
          email: authUser.email,
        });
      }
    };

    const ensureUserRecord = async (authUser) => {
      if (!authUser) return;
      // Thử lấy profile từ BE trước
      try {
        const token = session?.access_token;
        if (token) {
          const profile = await userApi.getMyProfile(token);
          setUserData(profile);
          return;
        }
      } catch (err) {
        // Chưa có trên BE, cần sync
      }
      
      // Fallback: dùng Supabase để tạo record (giữ sync với auth.users)
      const email = authUser.email || '';
      const name = authUser.user_metadata?.full_name || email.split('@')[0] || 'Người dùng';
      const { data: existing } = await supabase
        .from('lb_users')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();
      if (existing) {
        setUserData(existing);
        return;
      }
      const { data: newUser, error } = await supabase
        .from('lb_users')
        .insert([{ id: authUser.id, name, email }])
        .select()
        .single();
      if (error) {
        console.warn('create user record error:', error);
      } else {
        setUserData(newUser);
      }
    };

    // Lấy session hiện tại
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) ensureUserRecord(session.user);
      setLoading(false);
    });

    // Lắng nghe thay đổi trạng thái auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) ensureUserRecord(session.user);
      else setUserData(null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const openLoginModal = () => {
    setAuthModalMode("login");
    setIsAuthModalOpen(true);
  };

  const openRegisterModal = () => {
    setAuthModalMode("register");
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  const signOut = async () => {
    setUserData(null);
    await supabase.auth.signOut();
  };

  const updateProfile = async (data) => {
    try {
      const token = getAuthToken();
      if (!token) throw new Error('No auth token');
      
      const updatedProfile = await userApi.updateProfile(data, token);
      setUserData(updatedProfile);
      return { error: null };
    } catch (err) {
      console.warn('updateProfile via BE error:', err);
      return { error: err.message || 'Failed to update profile' };
    }
  };

  const resetPassword = async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/reset-password',
    });
    return { error };
  };

  const updatePassword = async (newPassword) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    return { error };
  };

  const value = {
    user,
    userData,
    session,
    loading,
    isAuthModalOpen,
    authModalMode,
    openLoginModal,
    openRegisterModal,
    closeAuthModal,
    setAuthModalMode,
    signOut,
    showToast,
    updateProfile,
    resetPassword,
    updatePassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
      
      {/* Toast Notification */}
      {toast.visible && (
        <div className={`fixed top-6 right-6 z-[9999] shadow-lg rounded-xl px-5 py-3 border-l-4 bg-white flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300 ${toast.type === 'error' ? 'border-red-500 text-red-700' : 'border-teal-500 text-teal-700'}`}>
          {toast.type === "success" ? (
            <svg className="w-6 h-6 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : (
             <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
          <span className="font-medium text-sm">{toast.message}</span>
        </div>
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
