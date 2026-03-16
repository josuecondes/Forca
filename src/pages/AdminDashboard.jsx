import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import {
    Menu, X, Calendar, BookOpen, Users, Settings, LogOut,
    List, DollarSign, ChevronRight, Zap
} from 'lucide-react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

import SharedCalendar from './SharedCalendar'
import Diario from './owner/Diario'
import OwnerClientes from './owner/OwnerClientes'
import Registro from './owner/Registro'
import Pagos from './owner/Pagos'
import OwnerConfiguracion from './owner/OwnerConfiguracion'

function cn(...inputs) { return twMerge(clsx(inputs)) }

const isIOS = () =>
    typeof window !== 'undefined' &&
    (/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.userAgent.includes('Mac') && 'ontouchend' in document))

// ── DESIGN TOKENS ─────────────────────────────────────────────────────────────
// Força Light palette — shared across all submodules via inline vars
export const FT = {
    pageBg: '#eaecf1',
    cardBg: 'linear-gradient(145deg, #f6f8fc 0%, #eef1f6 100%)',
    sidebarBg: '#141720',
    headerBg: 'rgba(240,243,249,0.97)',
    inputBg: '#f0f3f8',
    borderLight: '1px solid rgba(0,0,0,0.09)',
    borderCard: '1px solid rgba(0,0,0,0.1)',
    borderBlue: '1px solid rgba(37,99,235,0.35)',
    // Forza Blue
    blue: '#2563eb',
    blueBg: 'rgba(37,99,235,0.09)',
    blueBorder: 'rgba(37,99,235,0.28)',
    // Status
    green: '#16a34a',
    greenBg: 'rgba(22,163,74,0.09)',
    red: '#dc2626',
    redBg: 'rgba(220,38,38,0.09)',
    amber: '#d97706',
    amberBg: 'rgba(217,119,6,0.09)',
    purple: '#7c3aed',
    purpleBg: 'rgba(124,58,237,0.09)',
    // Text
    textPrimary: '#0d1117',
    textSec: '#5a6278',
    textMuted: '#8890a4',
    // Shadows
    shadowCard: '0 2px 14px rgba(0,0,0,0.07), 0 1px 3px rgba(0,0,0,0.05)',
    shadowModal: '0 24px 80px rgba(0,0,0,0.22)',
}

const AdminDashboard = () => {
    const { signOut, profile } = useAuth()
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [activeSection, setActiveSection] = useState('calendario')
    const [navContext, setNavContext] = useState(null)

    const iosPad = isIOS() ? { paddingTop: 'calc(3.5rem + env(safe-area-inset-top, 0px))' } : {}

    const navigate = (section, context = null) => {
        setActiveSection(section)
        setNavContext(context)
        setSidebarOpen(false)
    }

    const SECTION_LABELS = {
        calendario: 'Calendario',
        diario: 'Diario',
        clientes: 'Clientes',
        registro: 'Registro',
        pagos: 'Pagos',
        configuracion: 'Configuración'
    }

    const MODULE_NAV = [
        { id: 'calendario', label: 'Calendario', icon: Calendar },
        { id: 'diario', label: 'Diario', icon: List },
        { id: 'clientes', label: 'Clientes', icon: Users },
        { id: 'registro', label: 'Registro', icon: BookOpen },
        { id: 'pagos', label: 'Pagos', icon: DollarSign },
        { id: 'configuracion', label: 'Configuración', icon: Settings },
    ]

    return (
        <div className="h-[100dvh] w-full overflow-hidden font-sans" style={{ background: FT.pageBg }}>
            <div className="max-w-md mx-auto h-full relative">

                {/* OVERLAY */}
                {sidebarOpen && (
                    <div
                        className="fixed inset-0 z-40"
                        style={{ background: 'rgba(13,17,32,0.6)', backdropFilter: 'blur(4px)' }}
                        onClick={() => setSidebarOpen(false)}
                    />
                )}

                {/* ── SIDEBAR ─────────────────────────────────────────────── */}
                <aside className={cn(
                    'absolute top-0 left-0 h-full w-[280px] z-50 flex flex-col transition-transform duration-300 ease-out',
                    sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                )} style={{
                    background: FT.sidebarBg,
                    borderRight: '1px solid rgba(255,255,255,0.06)',
                    boxShadow: '12px 0 50px rgba(0,0,0,0.5)'
                }}>

                    {/* Logo strip */}
                    <div className="px-5 pt-5 pb-4 shrink-0 flex items-center justify-between" style={{
                        borderBottom: '1px solid rgba(255,255,255,0.06)',
                        ...iosPad
                    }}>
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{
                                background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                                boxShadow: '0 4px 14px rgba(37,99,235,0.4)'
                            }}>
                                <Zap className="w-4 h-4 text-white" />
                            </div>
                            <div>
                                <p className="text-[8px] font-black uppercase tracking-[0.2em]" style={{ color: 'rgba(255,255,255,0.38)' }}>Owner Panel</p>
                                <h2 className="text-lg font-black leading-none tracking-tight text-white">FORÇA</h2>
                            </div>
                        </div>
                        <button onClick={() => setSidebarOpen(false)}
                            className="p-2 rounded-xl"
                            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.09)' }}>
                            <X className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.55)' }} />
                        </button>
                    </div>

                    {/* Avatar */}
                    <div className="mx-4 my-4 p-4 rounded-2xl flex items-center gap-3 shrink-0" style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.08)'
                    }}>
                        <div className="w-11 h-11 rounded-xl flex items-center justify-center font-black text-base shrink-0 text-white" style={{
                            background: 'linear-gradient(135deg, rgba(37,99,235,0.3) 0%, rgba(29,78,216,0.2) 100%)',
                            border: '1.5px solid rgba(37,99,235,0.45)',
                            boxShadow: '0 0 16px rgba(37,99,235,0.25)'
                        }}>
                            {profile?.nombre?.charAt(0)?.toUpperCase() || 'A'}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-white font-bold text-sm truncate">{profile?.nombre || 'Admin'}</p>
                            <p className="text-[11px] truncate" style={{ color: 'rgba(255,255,255,0.38)' }}>{profile?.email}</p>
                        </div>
                    </div>

                    {/* Nav */}
                    <div className="px-3 flex-1 overflow-y-auto pb-4">
                        <p className="text-[9px] font-black uppercase tracking-[0.18em] mb-2 px-2" style={{ color: 'rgba(255,255,255,0.22)' }}>Módulos</p>
                        <nav className="space-y-1">
                            {MODULE_NAV.map(({ id, label, icon: Icon }) => {
                                const active = activeSection === id
                                return (
                                    <button key={id} onClick={() => navigate(id)}
                                        className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl text-sm font-bold transition-all text-left"
                                        style={active ? {
                                            background: 'linear-gradient(135deg, rgba(37,99,235,0.22) 0%, rgba(37,99,235,0.12) 100%)',
                                            border: '1px solid rgba(37,99,235,0.4)',
                                            color: '#93b4fc',
                                            boxShadow: '0 4px 20px rgba(37,99,235,0.18), inset 0 1px 0 rgba(37,99,235,0.2)'
                                        } : {
                                            background: 'transparent',
                                            border: '1px solid transparent',
                                            color: 'rgba(255,255,255,0.42)'
                                        }}>
                                        <Icon className="w-5 h-5 shrink-0" />
                                        <span className="flex-1 text-base">{label}</span>
                                        {active && <ChevronRight className="w-4 h-4 opacity-50 shrink-0" />}
                                    </button>
                                )
                            })}
                        </nav>
                    </div>

                    {/* Logout */}
                    <div className="px-3 py-4 shrink-0" style={{
                        borderTop: '1px solid rgba(255,255,255,0.06)',
                        paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))'
                    }}>
                        <button onClick={signOut}
                            className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl font-bold text-sm transition-all"
                            style={{
                                border: '1px solid rgba(220,38,38,0.22)',
                                background: 'rgba(220,38,38,0.07)',
                                color: '#f87171'
                            }}>
                            <LogOut className="w-5 h-5 shrink-0" />
                            <span className="text-base">Cerrar sesión</span>
                        </button>
                    </div>
                </aside>

                {/* ── MAIN CONTENT ─────────────────────────────────────────── */}
                <div className="flex flex-col h-[100dvh]">
                    {/* Header */}
                    <header className="flex items-center gap-3 px-4 py-3 shrink-0" style={{
                        background: FT.headerBg,
                        backdropFilter: 'blur(20px)',
                        borderBottom: '1px solid rgba(0,0,0,0.09)',
                        boxShadow: '0 2px 16px rgba(0,0,0,0.07)',
                        ...iosPad
                    }}>
                        <button onClick={() => setSidebarOpen(true)}
                            className="p-3 rounded-2xl transition-colors shrink-0"
                            style={{
                                background: 'rgba(37,99,235,0.08)',
                                border: '1px solid rgba(37,99,235,0.18)',
                            }}>
                            <Menu className="w-5 h-5" style={{ color: '#2563eb' }} />
                        </button>
                        <div className="flex-1">
                            <h1 className="font-black text-lg tracking-tight" style={{ color: FT.textPrimary }}>
                                {SECTION_LABELS[activeSection] || activeSection}
                            </h1>
                        </div>
                        <button onClick={signOut}
                            className="px-5 py-2.5 rounded-xl text-sm font-black transition-all"
                            style={{
                                background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                                color: '#fff',
                                border: '1px solid rgba(37,99,235,0.5)',
                                boxShadow: '0 4px 14px rgba(37,99,235,0.3)'
                            }}>
                            SALIR
                        </button>
                    </header>

                    {/* Content */}
                    <main className="flex-1 overflow-hidden flex flex-col">
                        {activeSection === 'calendario' && <SharedCalendar onNavigate={navigate} />}
                        {activeSection === 'diario' && <Diario onNavigate={navigate} />}
                        {activeSection === 'clientes' && (
                            <div className="flex-1 overflow-y-auto">
                                <OwnerClientes onNavigate={navigate} initialClienteId={navContext?.clienteId} />
                            </div>
                        )}
                        {activeSection === 'registro' && (
                            <div className="flex-1 overflow-y-auto"><Registro /></div>
                        )}
                        {activeSection === 'pagos' && (
                            <div className="flex-1 overflow-y-auto"><Pagos /></div>
                        )}
                        {activeSection === 'configuracion' && (
                            <div className="flex-1 overflow-y-auto"><OwnerConfiguracion /></div>
                        )}
                    </main>
                </div>
            </div>
        </div>
    )
}

export default AdminDashboard
