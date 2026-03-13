import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { User, Mail, Lock, UserPlus, Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase'

const Register = () => {
    const [nombre, setNombre] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const { signUp } = useAuth()
    const navigate = useNavigate()

    const handleRegister = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError('')
        try {
            const { data: { user }, error: signUpError } = await signUp({ email, password })
            if (signUpError) throw signUpError

            const { error: profileError } = await supabase
                .from('usuarios')
                .insert([{ id: user.id, nombre, email, rol: 'cliente' }])

            if (profileError) throw profileError

            navigate('/cliente')
        } catch (err) {
            setError('Error al registrarse: ' + err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="relative min-h-[100dvh] flex flex-col items-center justify-center p-6 bg-gradient-animated font-sans overflow-hidden">

            {/* Corner rays */}
            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <filter id="rgG"><feGaussianBlur stdDeviation="10" /></filter>
                        <filter id="rgO"><feGaussianBlur stdDeviation="10" /></filter>
                    </defs>
                    <line x1="-20" y1="130" x2="130" y2="-20" stroke="#22c55e" strokeWidth="16" strokeLinecap="round" filter="url(#rgG)" opacity="0.35" />
                    <line x1="-20" y1="130" x2="130" y2="-20" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" opacity="0.55" />
                    <line x1="calc(100% + 20px)" y1="130" x2="calc(100% - 130px)" y2="-20" stroke="#f97316" strokeWidth="16" strokeLinecap="round" filter="url(#rgO)" opacity="0.35" />
                    <line x1="calc(100% + 20px)" y1="130" x2="calc(100% - 130px)" y2="-20" stroke="#fb923c" strokeWidth="2.5" strokeLinecap="round" opacity="0.55" />
                    <line x1="-20" y1="calc(100% - 130px)" x2="130" y2="calc(100% + 20px)" stroke="#f97316" strokeWidth="16" strokeLinecap="round" filter="url(#rgO)" opacity="0.35" />
                    <line x1="-20" y1="calc(100% - 130px)" x2="130" y2="calc(100% + 20px)" stroke="#fb923c" strokeWidth="2.5" strokeLinecap="round" opacity="0.55" />
                    <line x1="calc(100% + 20px)" y1="calc(100% - 130px)" x2="calc(100% - 130px)" y2="calc(100% + 20px)" stroke="#22c55e" strokeWidth="16" strokeLinecap="round" filter="url(#rgG)" opacity="0.35" />
                    <line x1="calc(100% + 20px)" y1="calc(100% - 130px)" x2="calc(100% - 130px)" y2="calc(100% + 20px)" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" opacity="0.55" />
                </svg>
            </div>

            <div className="relative z-10 w-full max-w-sm">
                {/* Header */}
                <div className="text-center mb-8">
                    <img src="/evidentia-logo.png" alt="Evidentia Logo" className="h-16 mx-auto mb-4 logo-animated" />
                    <h1 className="text-2xl font-black text-gradient-neon">Crear cuenta</h1>
                    <p className="text-white/40 mt-1 text-sm">Únete a Evidentia hoy mismo.</p>
                </div>

                {/* Card */}
                <div className="bg-white/5 border border-white/10 p-8 rounded-3xl backdrop-blur-sm"
                    style={{ boxShadow: '0 0 40px rgba(0,0,0,0.4)' }}>
                    <form onSubmit={handleRegister} className="space-y-5">
                        {/* Nombre */}
                        <div>
                            <label className="block text-xs font-black text-[#f97316]/70 uppercase tracking-widest mb-2">Nombre</label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-[#f97316]/50 w-4 h-4" />
                                <input
                                    type="text"
                                    required
                                    placeholder="Tu nombre completo"
                                    className="input-neon-orange w-full pl-11 pr-4 py-3"
                                    value={nombre}
                                    onChange={(e) => setNombre(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-xs font-black text-[#f97316]/70 uppercase tracking-widest mb-2">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#f97316]/50 w-4 h-4" />
                                <input
                                    type="email"
                                    required
                                    placeholder="tu@email.com"
                                    className="input-neon-orange w-full pl-11 pr-4 py-3"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Contraseña */}
                        <div>
                            <label className="block text-xs font-black text-[#f97316]/70 uppercase tracking-widest mb-2">Contraseña</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#f97316]/50 w-4 h-4" />
                                <input
                                    type="password"
                                    required
                                    placeholder="Mínimo 6 caracteres"
                                    className="input-neon-orange w-full pl-11 pr-4 py-3"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        {error && (
                            <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2">{error}</p>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="button-neon-green w-full py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <UserPlus className="w-5 h-5" />}
                            {loading ? 'Registrando...' : 'Crear cuenta'}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <span className="text-white/30 text-sm">¿Ya tienes cuenta? </span>
                        <Link to="/login" className="text-[#f97316] font-semibold text-sm hover:text-[#fb923c] transition-colors">
                            Iniciar sesión
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Register
