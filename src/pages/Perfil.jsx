import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { LogOut, User, Edit3, Check, X, Shield, Bell, ChevronRight, Loader2, CheckCircle2 } from 'lucide-react'

const Perfil = () => {
    const { profile, signOut, user } = useAuth()
    const [editingNombre, setEditingNombre] = useState(false)
    const [nombre, setNombre] = useState(profile?.nombre || '')
    const [saving, setSaving] = useState(false)
    const [successMsg, setSuccessMsg] = useState('')

    const handleSaveNombre = async () => {
        if (!nombre.trim() || nombre === profile?.nombre) { setEditingNombre(false); return }
        setSaving(true)
        try {
            const { error } = await supabase
                .from('usuarios')
                .update({ nombre: nombre.trim() })
                .eq('id', user.id)
            if (error) throw error
            showSuccess('Nombre actualizado.')
            setEditingNombre(false)
        } catch (err) {
            alert('Error al guardar: ' + err.message)
        } finally {
            setSaving(false)
        }
    }

    const showSuccess = (msg) => {
        setSuccessMsg(msg)
        setTimeout(() => setSuccessMsg(''), 3500)
    }

    const getInitials = (name) => {
        if (!name) return '?'
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    }

    return (
        <div className="p-6 text-white">
            {/* Toast */}
            {successMsg && (
                <div className="fixed top-6 left-4 right-4 z-50 bg-[#22c55e] text-white px-5 py-4 rounded-2xl shadow-xl flex items-center gap-3"
                    style={{ boxShadow: '0 0 30px rgba(34,197,94,0.6)' }}>
                    <CheckCircle2 className="w-5 h-5 shrink-0" />
                    <p className="text-sm font-bold">{successMsg}</p>
                </div>
            )}

            {/* Avatar */}
            <header className="mb-8 text-center">
                <div className="relative inline-block mb-4">
                    {/* Anillo de glow */}
                    <div className="absolute -inset-1 rounded-[36px] opacity-70"
                        style={{ background: 'linear-gradient(135deg, #22c55e, #f97316)', filter: 'blur(8px)' }} />
                    <div className="relative w-24 h-24 bg-[#111318] rounded-[32px] flex items-center justify-center border-2 border-white/10">
                        {profile?.nombre ? (
                            <span className="text-3xl font-black text-gradient-neon">{getInitials(profile.nombre)}</span>
                        ) : (
                            <User className="w-12 h-12 text-[#22c55e]" />
                        )}
                    </div>
                    {/* Indicador online */}
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#22c55e] rounded-full border-2 border-[#0f1210]"
                        style={{ boxShadow: '0 0 8px rgba(34,197,94,0.8)' }} />
                </div>

                {/* Nombre editable */}
                <div className="flex items-center justify-center gap-2 mt-2">
                    {editingNombre ? (
                        <div className="flex items-center gap-2">
                            <input
                                autoFocus
                                value={nombre}
                                onChange={e => setNombre(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') handleSaveNombre(); if (e.key === 'Escape') setEditingNombre(false) }}
                                className="text-xl font-black text-white text-center border-b-2 border-[#f97316] outline-none bg-transparent w-44"
                            />
                            <button onClick={handleSaveNombre} disabled={saving} className="text-[#22c55e]">
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                            </button>
                            <button onClick={() => { setEditingNombre(false); setNombre(profile?.nombre || '') }} className="text-white/40">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        <>
                            <h1 className="text-2xl font-black text-white">{profile?.nombre || 'Mi Perfil'}</h1>
                            <button onClick={() => setEditingNombre(true)} className="text-white/30 hover:text-[#f97316] transition-colors">
                                <Edit3 className="w-4 h-4" />
                            </button>
                        </>
                    )}
                </div>
                <p className="text-white/40 text-sm font-medium mt-1">{profile?.email || user?.email}</p>
                <div className="inline-block mt-3 px-4 py-1.5 rounded-full text-[10px] font-black text-white uppercase tracking-widest"
                    style={{ background: 'linear-gradient(90deg, #14532d, #22c55e)', boxShadow: '0 0 12px rgba(34,197,94,0.4)' }}>
                    {profile?.rol || 'Cliente'}
                </div>
            </header>

            {/* Opciones */}
            <div className="space-y-4">
                <div className="bg-white/5 border border-white/8 rounded-[24px] overflow-hidden"
                    style={{ backdropFilter: 'blur(10px)' }}>
                    <div className="px-5 py-3 border-b border-white/5">
                        <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">Mi cuenta</p>
                    </div>
                    <button
                        className="w-full flex items-center justify-between p-5 hover:bg-white/5 transition-colors"
                        onClick={() => setEditingNombre(true)}
                    >
                        <div className="flex items-center gap-4">
                            <div className="p-2 bg-[#f97316]/15 text-[#f97316] rounded-xl">
                                <Edit3 className="w-5 h-5" />
                            </div>
                            <span className="font-bold text-white/85">Editar nombre</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-white/25" />
                    </button>
                    <div className="h-px bg-white/5 mx-5" />
                    <button className="w-full flex items-center justify-between p-5 hover:bg-white/5 transition-colors">
                        <div className="flex items-center gap-4">
                            <div className="p-2 bg-[#22c55e]/15 text-[#22c55e] rounded-xl">
                                <Bell className="w-5 h-5" />
                            </div>
                            <div>
                                <span className="font-bold text-white/85 block">Notificaciones</span>
                                <span className="text-xs text-white/30">Próximamente</span>
                            </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-white/25" />
                    </button>
                    <div className="h-px bg-white/5 mx-5" />
                    <button className="w-full flex items-center justify-between p-5 hover:bg-white/5 transition-colors">
                        <div className="flex items-center gap-4">
                            <div className="p-2 bg-[#f97316]/15 text-[#f97316] rounded-xl">
                                <Shield className="w-5 h-5" />
                            </div>
                            <div>
                                <span className="font-bold text-white/85 block">Privacidad</span>
                                <span className="text-xs text-white/30">Próximamente</span>
                            </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-white/25" />
                    </button>
                </div>

                <button
                    onClick={signOut}
                    className="w-full flex items-center justify-center gap-3 py-5 bg-red-500/10 text-red-400 rounded-[24px] font-black text-sm uppercase tracking-widest hover:bg-red-500/20 transition-colors border border-red-500/20"
                >
                    <LogOut className="w-5 h-5" />
                    Cerrar sesión
                </button>
            </div>

            <div className="mt-12 text-center">
                <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Evidentia v1.0.0</p>
            </div>
        </div>
    )
}

export default Perfil
