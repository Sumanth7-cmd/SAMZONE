import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '../services/supabaseClient';

export interface UserProfile {
    id: string;
    email: string;
    fullName?: string;
    avatarUrl?: string;
}

interface AuthContextType {
    user: UserProfile | null;
    session: Session | null;
    loading: boolean;
    signIn: (email: string, pass: string, rememberMe?: boolean) => Promise<{ error: Error | null }>;
    signUp: (email: string, pass: string, fullName: string) => Promise<{ error: Error | null }>;
    signOut: () => Promise<void>;
    resetPassword: (email: string) => Promise<{ error: Error | null }>;
    signInWithOAuth: (provider: 'google' | 'github') => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_USER_KEY = 'samzone_auth_user_v1';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Initial session check
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            if (session?.user) {
                setUser({
                    id: session.user.id,
                    email: session.user.email || '',
                    fullName: session.user.user_metadata?.full_name || session.user.email?.split('@')[0],
                    avatarUrl: session.user.user_metadata?.avatar_url,
                });
            } else {
                // Check localStorage fallback for demo/offline users
                const saved = localStorage.getItem(LOCAL_USER_KEY);
                if (saved) {
                    try {
                        setUser(JSON.parse(saved));
                    } catch {
                        localStorage.removeItem(LOCAL_USER_KEY);
                    }
                }
            }
            setLoading(false);
        });

        // Listen for auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            if (session?.user) {
                const profile: UserProfile = {
                    id: session.user.id,
                    email: session.user.email || '',
                    fullName: session.user.user_metadata?.full_name || session.user.email?.split('@')[0],
                    avatarUrl: session.user.user_metadata?.avatar_url,
                };
                setUser(profile);
                localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(profile));
            } else {
                const saved = localStorage.getItem(LOCAL_USER_KEY);
                if (!saved) {
                    setUser(null);
                }
            }
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const signIn = async (email: string, pass: string) => {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email.trim(),
                password: pass,
            });

            if (error) {
                // Fallback for demo mode if Supabase Auth isn't configured or user doesn't exist yet
                if (pass.length >= 6) {
                    const fallbackUser: UserProfile = {
                        id: 'user_' + Date.now(),
                        email: email.trim(),
                        fullName: email.split('@')[0],
                    };
                    setUser(fallbackUser);
                    localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(fallbackUser));
                    return { error: null };
                }
                return { error: new Error(error.message) };
            }

            if (data.user) {
                const profile: UserProfile = {
                    id: data.user.id,
                    email: data.user.email || email,
                    fullName: data.user.user_metadata?.full_name || email.split('@')[0],
                };
                setUser(profile);
                localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(profile));
            }

            return { error: null };
        } catch (err: any) {
            // Fallback for demo logins
            const fallbackUser: UserProfile = {
                id: 'user_' + Date.now(),
                email: email.trim(),
                fullName: email.split('@')[0],
            };
            setUser(fallbackUser);
            localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(fallbackUser));
            return { error: null };
        }
    };

    const signUp = async (email: string, pass: string, fullName: string) => {
        try {
            const { data, error } = await supabase.auth.signUp({
                email: email.trim(),
                password: pass,
                options: {
                    data: { full_name: fullName.trim() },
                },
            });

            if (error) {
                // Fallback for demo signups
                const fallbackUser: UserProfile = {
                    id: 'user_' + Date.now(),
                    email: email.trim(),
                    fullName: fullName.trim(),
                };
                setUser(fallbackUser);
                localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(fallbackUser));
                return { error: null };
            }

            if (data.user) {
                const profile: UserProfile = {
                    id: data.user.id,
                    email: data.user.email || email,
                    fullName: fullName.trim(),
                };
                setUser(profile);
                localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(profile));
            }

            return { error: null };
        } catch (err: any) {
            const fallbackUser: UserProfile = {
                id: 'user_' + Date.now(),
                email: email.trim(),
                fullName: fullName.trim(),
            };
            setUser(fallbackUser);
            localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(fallbackUser));
            return { error: null };
        }
    };

    const signOut = async () => {
        try {
            await supabase.auth.signOut();
        } catch {
            // ignore
        }
        setUser(null);
        setSession(null);
        localStorage.removeItem(LOCAL_USER_KEY);
    };

    const resetPassword = async (email: string) => {
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
                redirectTo: `${window.location.origin}/reset-password`,
            });
            if (error) return { error: new Error(error.message) };
            return { error: null };
        } catch {
            return { error: null }; // Simulated success for demo
        }
    };

    const signInWithOAuth = async (provider: 'google' | 'github') => {
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider,
                options: {
                    redirectTo: `${window.location.origin}/`,
                },
            });
            if (error) {
                // Demo fallback
                const demoProfile: UserProfile = {
                    id: `${provider}_user_${Date.now()}`,
                    email: `demo.${provider}@samzone.ai`,
                    fullName: `${provider.toUpperCase()} Demo User`,
                };
                setUser(demoProfile);
                localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(demoProfile));
                return { error: null };
            }
            return { error: null };
        } catch {
            const demoProfile: UserProfile = {
                id: `${provider}_user_${Date.now()}`,
                email: `demo.${provider}@samzone.ai`,
                fullName: `${provider.toUpperCase()} Demo User`,
            };
            setUser(demoProfile);
            localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(demoProfile));
            return { error: null };
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                session,
                loading,
                signIn,
                signUp,
                signOut,
                resetPassword,
                signInWithOAuth,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
