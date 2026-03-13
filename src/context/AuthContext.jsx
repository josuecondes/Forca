import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null)
    const [profile, setProfile] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Check active sessions and sets the user
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null)
            if (session?.user) fetchProfile(session.user)
            else setLoading(false)
        })

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            const currentUser = session?.user ?? null
            setUser(currentUser)
            if (currentUser) {
                // Solo mostramos loading que bloquea UI si es el inicio de sesión
                if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
                    setLoading(true)
                }
                await fetchProfile(currentUser)
            } else {
                setProfile(null)
                setLoading(false)
            }
        })

        return () => subscription.unsubscribe()
    }, [])

    const fetchProfile = async (userObjOrId) => {
        try {
            console.log('--- Iniciando fetchProfile ---');
            const id = typeof userObjOrId === 'string' ? userObjOrId : userObjOrId?.id;
            const currentUserObj = typeof userObjOrId === 'object' ? userObjOrId : user;
            console.log('ID buscado:', id);

            if (!id) return;

            // Timeout de seguridad mas amplio para recuperación en segundo plano
            const timeoutPromise = new Promise((resolve) =>
                setTimeout(() => resolve({ error: new Error('Timeout Supabase') }), 8000)
            );

            const fetchPromise = supabase
                .from('usuarios')
                .select('*')
                .eq('id', id)
                .single();

            const { data, error } = await Promise.race([fetchPromise, timeoutPromise]);

            const cachedProfileStr = localStorage.getItem('user_profile_cache_' + id);

            if (data) {
                console.log('Perfil cargado:', data);
                localStorage.setItem('user_profile_cache_' + id, JSON.stringify(data));
                setProfile(data);
                return;
            }

            // Fallback a caché primero si es un error de red (no un usuario inexistente)
            const isNoRows = error?.code === 'PGRST116'; // Código de Supabase para "0 filas"

            if (!isNoRows && error) {
                console.warn('Fallo al obtener perfil (red/timeout). Error:', error);
                if (cachedProfileStr) {
                    console.log('Usando perfil en caché remoto debido a fallo temporal:', JSON.parse(cachedProfileStr));
                    setProfile(JSON.parse(cachedProfileStr));
                } else if (!profile) {
                    setProfile(null);
                }
                return;
            }

            // Si llegamos aquí y no hay data pero ES PGRST116 (0 filas), intentamos CREAR el perfil
            if (currentUserObj && isNoRows) {
                console.warn('Perfil no encontrado (0 filas). Creando perfil para:', id);
                const nombreMetadata = currentUserObj.user_metadata?.full_name ||
                    currentUserObj.user_metadata?.name ||
                    currentUserObj.email?.split('@')[0] ||
                    'Usuario';

                const isMailAdmin = currentUserObj.email === 'admin@gmail.com' || currentUserObj.email === 'josue@gmail.com';

                // Solo hacemos INSERT, si ya existe por alguna race condition, fallará de forma segura y no sobreescribirá el rol
                const { data: newProfile, error: insertError } = await supabase
                    .from('usuarios')
                    .insert({
                        id: id,
                        nombre: nombreMetadata,
                        email: currentUserObj.email,
                        rol: isMailAdmin ? 'admin' : 'cliente'
                    })
                    .select()
                    .single();

                if (!insertError && newProfile) {
                    console.log('Perfil creado exitosamente:', newProfile);
                    localStorage.setItem('user_profile_cache_' + id, JSON.stringify(newProfile));
                    setProfile(newProfile);
                } else {
                    // Si falla la insersión (quizá la red se cayó justo después del select), intentamos recuperar cache
                    if (cachedProfileStr) {
                        setProfile(JSON.parse(cachedProfileStr));
                    } else if (insertError?.code === '23505') { // 23505 = duplicate key
                        // Alguien más lo insertó justo a tiempo, intentamos leer de nuevo o usamos fallback
                        console.log('El perfil fue creado concurrentemente. Fallback a cache si existe.');
                    } else {
                        console.error('Error al crear perfil:', insertError);
                        setProfile(null);
                    }
                }
            } else if (cachedProfileStr) {
                console.log('Sin objeto usuario, usando perfil en caché remoto:', JSON.parse(cachedProfileStr));
                setProfile(JSON.parse(cachedProfileStr));
            } else {
                setProfile(null);
            }
        } catch (error) {
            console.error('Fallo en fetchProfile:', error?.message || error);
            const cachedId = typeof userObjOrId === 'string' ? userObjOrId : userObjOrId?.id;
            const fallbackCacheStr = cachedId ? localStorage.getItem('user_profile_cache_' + cachedId) : null;
            if (fallbackCacheStr) {
                console.log('Usando perfil en caché remoto debido a excepción general:', JSON.parse(fallbackCacheStr));
                setProfile(JSON.parse(fallbackCacheStr));
            } else if (!profile) {
                setProfile(null);
            }
        } finally {
            setLoading(false)
        }
    }

    const value = {
        signUp: (data) => supabase.auth.signUp(data),
        signIn: (data) => supabase.auth.signInWithPassword(data),
        signInWithGoogle: () => supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin
            }
        }),
        signOut: async () => {
            try {
                localStorage.removeItem('token');
                sessionStorage.clear();
                Object.keys(localStorage).forEach(key => {
                    if (key.startsWith('user_profile_cache_')) localStorage.removeItem(key);
                });
                await supabase.auth.signOut();
            } catch (e) {
                console.error("Error en signOut:", e);
            } finally {
                setProfile(null);
                setUser(null);
                // ir a login sustituyendo la entrada actual
                window.location.replace('/login');
            }
        },
        user,
        profile,
        loading
    }

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
