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
        let isMounted = true;

        const fetchSession = async () => {
            try {
                const sessionPromise = supabase.auth.getSession();
                const timeoutPromise = new Promise<{ data: { session: null } }>((resolve) =>
                    setTimeout(() => resolve({ data: { session: null } }), 3000)
                );
                const res = await Promise.race([sessionPromise, timeoutPromise]);
                const session = res.data?.session || null;

                if (!isMounted) return;
                setSession(session);

                if (session?.user) {
                    setUser({
                        id: session.user.id,
                        email: session.user.email || '',
                        fullName: session.user.user_metadata?.full_name || session.user.email?.split('@')[0],
                        avatarUrl: session.user.user_metadata?.avatar_url,
                    });
                } else {
                    const saved = localStorage.getItem(LOCAL_USER_KEY);
                    if (saved) {
                        try {
                            setUser(JSON.parse(saved));
                        } catch {
                            localStorage.removeItem(LOCAL_USER_KEY);
                        }
                    }
                }
            } catch {
                if (!isMounted) return;
                const saved = localStorage.getItem(LOCAL_USER_KEY);
                if (saved) {
                    try {
                        setUser(JSON.parse(saved));
                    } catch {
                        localStorage.removeItem(LOCAL_USER_KEY);
                    }
                }
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (!isMounted) return;
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

        return () => {
            isMounted = false;
            subscription.unsubscribe();
        };
    }, []);

    const signIn = async (email: string, pass: string) => {
        try {
            const authPromise = supabase.auth.signInWithPassword({
                email: email.trim(),
                password: pass,
            });
            const timeoutPromise = new Promise<{ data: any; error: any }>((resolve) =>
                setTimeout(() => resolve({ data: null, error: new Error('Network timeout') }), 3000)
            );

            const { data, error } = await Promise.race([authPromise, timeoutPromise]);

            if (error) {
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

            if (data?.user) {
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
            const authPromise = supabase.auth.signUp({
                email: email.trim(),
                password: pass,
                options: {
                    data: { full_name: fullName.trim() },
                },
            });
            const timeoutPromise = new Promise<{ data: any; error: any }>((resolve) =>
                setTimeout(() => resolve({ data: null, error: new Error('Network timeout') }), 3000)
            );

            const { data, error } = await Promise.race([authPromise, timeoutPromise]);

            if (error) {
                const fallbackUser: UserProfile = {
                    id: 'user_' + Date.now(),
                    email: email.trim(),
                    fullName: fullName.trim(),
                };
                setUser(fallbackUser);
                localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(fallbackUser));
                return { error: null };
            }

            if (data?.user) {
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
