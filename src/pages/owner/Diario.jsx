import React, { useState, useEffect } from 'react'
import { format, addDays, subDays } from 'date-fns'
import { es } from 'date-fns/locale'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { logRegistro } from '../../utils/registro'
import {
    ChevronLeft, ChevronRight, Check,
    MoreVertical, X, Loader2, Move, Ban, User2, Lock
} from 'lucide-react'
import { format as fmt } from 'date-fns'
import { ModalSesion, ModalMoverSesion, ModalBloqueo, ModalCancelConfirm, ModalDeleteConfirm } from '../../components/AdminModals'

function cn(...c) { return c.filter(Boolean).join(' ') }

// ── Força Light tokens ────────────────────────────────────────────────────────
const T = {
    page: '#eaecf1',
    card: { background: 'linear-gradient(145deg,#f6f8fc 0%,#eef1f6 100%)', border: '1px solid rgba(0,0,0,0.09)', boxShadow: '0 2px 12px rgba(0,0,0,0.07)' },
    inp: { background: '#e9ecf3', border: '1px solid rgba(0,0,0,0.12)', borderRadius: '14px', padding: '13px 16px', color: '#0d1117', fontSize: '14px', outline: 'none', width: '100%' },
    blue: '#2563eb',
    blueBg: 'rgba(37,99,235,0.09)',
    blueBorder: '1px solid rgba(37,99,235,0.28)',
    green: '#16a34a',
    greenBg: 'rgba(22,163,74,0.09)',
    red: '#dc2626',
    redBg: 'rgba(220,38,38,0.09)',
    amber: '#d97706',
    p1: '#0d1117',
    p2: '#5a6278',
    p3: '#8890a4',
}

const HORAS = []
for (let h = 9; h <= 20; h++) {
    HORAS.push(`${String(h).padStart(2, '0')}:00`)
    if (h < 20) HORAS.push(`${String(h).padStart(2, '0')}:30`)
}

const Diario = ({ onNavigate }) => {
    const { user } = useAuth()
    const [dia, setDia] = useState(new Date())
    const [sesiones, setSesiones] = useState([])
    const [bloqueos, setBloqueos] = useState([])
    const [clientes, setClientes] = useState([])
    const [loading, setLoading] = useState(true)
    const [modal, setModal] = useState(null)
    const [menuSesionId, setMenuSesionId] = useState(null)
    const [huecoActivo, setHuecoActivo] = useState(null)
    const [cancelConfirm, setCancelConfirm] = useState(null)
    const [deleteConfirm, setDeleteConfirm] = useState(null)

    const fechaStr = fmt(dia, 'yyyy-MM-dd')

    const fetchDia = async () => {
        setLoading(true)
        const [{ data: ses }, { data: bloq }] = await Promise.all([
            supabase.from('sesiones').select('*, clientes:usuarios!sesiones_cliente_id_fkey(nombre,email)').eq('fecha', fechaStr).order('hora_inicio'),
            supabase.from('bloqueos').select('*').eq('fecha', fechaStr)
        ])
        setSesiones(ses || [])
        setBloqueos(bloq || [])
        setLoading(false)
    }

    useEffect(() => {
        supabase.from('usuarios').select('id,nombre').eq('rol', 'cliente').order('nombre').then(({ data }) => setClientes(data || []))
    }, [])
    useEffect(() => { fetchDia() }, [fechaStr])

    const navDia = dir => setDia(p => dir > 0 ? addDays(p, 1) : subDays(p, 1))
    const horaEnBloqueo = h => bloqueos.some(b => b.tipo === 'dia_completo' || (b.hora_inicio && b.hora_fin && h >= b.hora_inicio && h < b.hora_fin))
    const sesionEnHora = h => sesiones.find(s => s.hora_inicio === h || (s.hora_inicio < h && s.hora_fin > h))

    const handleMarkRealizada = async s => {
        const nuevo = s.estado === 'realizada' ? 'programada' : 'realizada'
        await supabase.from('sesiones').update({ estado: nuevo, updated_at: new Date().toISOString() }).eq('id', s.id)
        await logRegistro({ accion: 'marcar_realizada', entidad: 'sesion', entidad_id: s.id, modulo_origen: 'diario', cliente_id: s.cliente_id, valor_anterior: { estado: s.estado }, valor_nuevo: { estado: nuevo }, autor_id: user?.id })
        fetchDia()
    }
    const handleCancel = async s => {
        await supabase.from('sesiones').update({ estado: 'cancelada', updated_at: new Date().toISOString() }).eq('id', s.id)
        await logRegistro({ accion: 'cancelar_sesion', entidad: 'sesion', entidad_id: s.id, modulo_origen: 'diario', cliente_id: s.cliente_id, valor_anterior: { estado: s.estado }, valor_nuevo: { estado: 'cancelada' }, autor_id: user?.id })
        setCancelConfirm(null); fetchDia()
    }
    const handleDelete = async s => {
        await supabase.from('sesiones').delete().eq('id', s.id)
        await logRegistro({ accion: 'eliminar_sesion', entidad: 'sesion', entidad_id: s.id, modulo_origen: 'diario', cliente_id: s.cliente_id, autor_id: user?.id })
        setDeleteConfirm(null); fetchDia()
    }
    const handleDesbloquear = async b => {
        await supabase.from('bloqueos').delete().eq('id', b.id)
        await logRegistro({ accion: 'eliminar_bloqueo', entidad: 'bloqueo', entidad_id: b.id, modulo_origen: 'diario', valor_anterior: b, autor_id: user?.id })
        fetchDia()
    }

    const huecoActual = HORAS.map(hora => ({
        hora,
        sesion: sesionEnHora(hora),
        bloqueado: horaEnBloqueo(hora),
        pasado: new Date(`${fechaStr}T${hora}`) < new Date()
    }))
    const esHoy = fechaStr === fmt(new Date(), 'yyyy-MM-dd')

    return (
        <div className="flex flex-col h-full" style={{ background: T.page }}>

            {/* Date nav */}
            <div className="flex items-center gap-3 px-4 py-3 shrink-0" style={{
                background: 'rgba(240,243,249,0.97)',
                backdropFilter: 'blur(12px)',
                borderBottom: '1px solid rgba(0,0,0,0.08)',
                boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
            }}>
                <button onClick={() => navDia(-1)}
                    className="p-3 rounded-2xl transition-all active:scale-95"
                    style={{ background: '#e9ecf3', border: '1px solid rgba(0,0,0,0.1)', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                    <ChevronLeft className="w-5 h-5" style={{ color: T.p2 }} />
                </button>
                <button onClick={() => setDia(new Date())} className="flex-1 text-center py-1">
                    <div className="flex items-center justify-center gap-2 mb-0.5">
                        <p className="font-black capitalize text-lg tracking-tight" style={{ color: T.p1 }}>
                            {format(dia, 'EEEE', { locale: es })}
                        </p>
                        {esHoy && (
                            <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full"
                                style={{ background: 'rgba(37,99,235,0.12)', color: T.blue, border: '1px solid rgba(37,99,235,0.22)' }}>
                                HOY
                            </span>
                        )}
                    </div>
                    <p className="text-sm font-medium" style={{ color: T.p3 }}>
                        {format(dia, "d 'de' MMMM yyyy", { locale: es })}
                    </p>
                </button>
                <button onClick={() => navDia(1)}
                    className="p-3 rounded-2xl transition-all active:scale-95"
                    style={{ background: '#e9ecf3', border: '1px solid rgba(0,0,0,0.1)', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                    <ChevronRight className="w-5 h-5" style={{ color: T.p2 }} />
                </button>
            </div>

            {/* Time slots */}
            <div className="flex-1 overflow-y-auto">
                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="w-7 h-7 animate-spin" style={{ color: T.blue }} />
                    </div>
                ) : (
                    <div>
                        {/* Full-day blocks */}
                        {bloqueos.filter(b => b.tipo === 'dia_completo').map(b => (
                            <div key={b.id} className="mx-4 mt-4 flex items-center gap-3 px-4 py-3.5 rounded-2xl" style={{
                                background: 'rgba(220,38,38,0.07)',
                                border: '1.5px solid rgba(220,38,38,0.2)',
                                boxShadow: '0 2px 12px rgba(220,38,38,0.06)'
                            }}>
                                <Lock className="w-5 h-5 shrink-0" style={{ color: T.red }} />
                                <p className="flex-1 font-bold" style={{ color: T.red }}>Día completo bloqueado</p>
                                <button onClick={() => handleDesbloquear(b)}
                                    className="px-4 py-2 rounded-xl font-black text-sm transition-all active:scale-95"
                                    style={{ background: 'rgba(220,38,38,0.12)', color: T.red, border: '1px solid rgba(220,38,38,0.25)' }}>
                                    Quitar
                                </button>
                            </div>
                        ))}

                        <div className="p-4 space-y-2">
                            {huecoActual.map(({ hora, sesion, bloqueado, pasado }) => {
                                if (sesion && sesion.hora_inicio !== hora) return null

                                if (sesion) {
                                    const isR = sesion.estado === 'realizada'
                                    const isC = sesion.estado === 'cancelada'
                                    const accentColor = isC ? '#94a3b8' : isR ? T.green : T.blue
                                    return (
                                        <div key={hora} className="rounded-2xl overflow-hidden" style={{
                                            background: isC
                                                ? 'linear-gradient(145deg,#f1f3f7 0%,#e8eaef 100%)'
                                                : 'linear-gradient(145deg,#f6f8fc 0%,#eef1f6 100%)',
                                            border: `1.5px solid ${isC ? 'rgba(0,0,0,0.07)' : isR ? 'rgba(22,163,74,0.25)' : 'rgba(37,99,235,0.2)'}`,
                                            boxShadow: isC ? 'none' : '0 3px 14px rgba(0,0,0,0.07)',
                                            opacity: isC ? 0.65 : 1
                                        }}>
                                            <div className="flex">
                                                {/* Left color bar */}
                                                <div className="w-1.5 shrink-0" style={{ background: accentColor }} />
                                                <div className="flex items-center gap-3 px-4 py-3.5 flex-1">
                                                    <div className="text-center shrink-0 w-11">
                                                        <p className="text-xs font-black" style={{ color: T.p1 }}>{sesion.hora_inicio}</p>
                                                        <p className="text-[10px] font-medium" style={{ color: T.p3 }}>{sesion.hora_fin}</p>
                                                    </div>
                                                    <div className="w-10 h-10 shrink-0 rounded-xl flex items-center justify-center font-black text-sm" style={{
                                                        background: isR ? 'rgba(22,163,74,0.12)' : 'rgba(37,99,235,0.1)',
                                                        border: `1.5px solid ${isR ? 'rgba(22,163,74,0.28)' : 'rgba(37,99,235,0.22)'}`,
                                                        color: isR ? T.green : T.blue
                                                    }}>
                                                        {sesion.clientes?.nombre?.charAt(0)?.toUpperCase() || '?'}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-black text-sm truncate" style={{ color: T.p1 }}>{sesion.clientes?.nombre}</p>
                                                        <div className="flex gap-1.5 items-center mt-0.5 flex-wrap">
                                                            <span className="text-[10px] font-black px-2 py-0.5 rounded-full" style={{
                                                                background: isR ? 'rgba(22,163,74,0.1)' : isC ? 'rgba(220,38,38,0.1)' : 'rgba(37,99,235,0.08)',
                                                                color: isR ? T.green : isC ? T.red : T.blue
                                                            }}>
                                                                {isC ? 'Cancelada' : isR ? 'Realizada' : 'Programada'}
                                                            </span>
                                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{
                                                                background: sesion.pago_estado === 'pagado' ? 'rgba(22,163,74,0.09)' : 'rgba(217,119,6,0.09)',
                                                                color: sesion.pago_estado === 'pagado' ? T.green : T.amber
                                                            }}>
                                                                {sesion.pago_estado === 'pagado' ? '✓ Pagada' : 'Pendiente'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    {!isC && (
                                                        <div className="flex items-center gap-1.5 shrink-0">
                                                            <button onClick={() => handleMarkRealizada(sesion)}
                                                                className="w-11 h-11 rounded-xl flex items-center justify-center transition-all active:scale-95"
                                                                style={isR ? {
                                                                    background: 'rgba(22,163,74,0.14)',
                                                                    border: '1.5px solid rgba(22,163,74,0.3)',
                                                                    color: T.green
                                                                } : {
                                                                    background: '#e9ecf3',
                                                                    border: '1px solid rgba(0,0,0,0.1)',
                                                                    color: T.p3
                                                                }}>
                                                                <Check className="w-4 h-4" />
                                                            </button>
                                                            <button onClick={() => setModal({ type: 'mover', payload: sesion })}
                                                                className="w-11 h-11 rounded-xl flex items-center justify-center transition-all active:scale-95"
                                                                style={{ background: '#e9ecf3', border: '1px solid rgba(0,0,0,0.1)', color: T.p3 }}>
                                                                <Move className="w-4 h-4" />
                                                            </button>
                                                            <button onClick={() => setCancelConfirm(sesion)}
                                                                className="w-11 h-11 rounded-xl flex items-center justify-center transition-all active:scale-95"
                                                                style={{ background: '#e9ecf3', border: '1px solid rgba(0,0,0,0.1)', color: T.p3 }}>
                                                                <Ban className="w-4 h-4" />
                                                            </button>
                                                            <div className="relative">
                                                                <button onClick={() => setMenuSesionId(menuSesionId === sesion.id ? null : sesion.id)}
                                                                    className="w-11 h-11 rounded-xl flex items-center justify-center transition-all"
                                                                    style={{ background: '#e9ecf3', border: '1px solid rgba(0,0,0,0.1)', color: T.p3 }}>
                                                                    <MoreVertical className="w-4 h-4" />
                                                                </button>
                                                                {menuSesionId === sesion.id && (
                                                                    <div className="absolute right-0 top-full mt-1 w-48 z-50 rounded-2xl overflow-hidden" style={{
                                                                        background: '#f4f6fa',
                                                                        border: '1px solid rgba(0,0,0,0.12)',
                                                                        boxShadow: '0 16px 48px rgba(0,0,0,0.16)'
                                                                    }}>
                                                                        <button onClick={() => { onNavigate?.('clientes', { clienteId: sesion.cliente_id }); setMenuSesionId(null) }}
                                                                            className="w-full flex items-center gap-3 px-4 py-3.5 text-sm font-bold transition-colors hover:bg-black/5"
                                                                            style={{ color: T.p1 }}>
                                                                            <User2 className="w-4 h-4" style={{ color: T.blue }} /> Ver cliente
                                                                        </button>
                                                                        <button onClick={() => { setDeleteConfirm(sesion); setMenuSesionId(null) }}
                                                                            className="w-full flex items-center gap-3 px-4 py-3.5 text-sm font-bold transition-colors hover:bg-red-500/8"
                                                                            style={{ color: T.red, borderTop: '1px solid rgba(0,0,0,0.07)' }}>
                                                                            <X className="w-4 h-4" /> Eliminar
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )
                                }

                                if (bloqueado) {
                                    const b = bloqueos.find(b => b.tipo !== 'dia_completo' && hora >= (b.hora_inicio || '') && hora < (b.hora_fin || ''))
                                    return (
                                        <div key={hora} className="flex items-center gap-3 px-4 py-3 rounded-2xl" style={{
                                            background: 'rgba(220,38,38,0.05)',
                                            border: '1px solid rgba(220,38,38,0.14)'
                                        }}>
                                            <span className="text-xs w-10 shrink-0 font-bold" style={{ color: T.p3 }}>{hora}</span>
                                            <Lock className="w-4 h-4 shrink-0" style={{ color: 'rgba(220,38,38,0.55)' }} />
                                            <p className="flex-1 text-xs font-bold" style={{ color: 'rgba(220,38,38,0.7)' }}>Bloqueado</p>
                                            {b && (
                                                <button onClick={() => handleDesbloquear(b)}
                                                    className="px-3.5 py-2 rounded-xl font-black text-xs transition-all active:scale-95"
                                                    style={{ background: 'rgba(220,38,38,0.1)', color: T.red, border: '1px solid rgba(220,38,38,0.2)' }}>
                                                    Quitar
                                                </button>
                                            )}
                                        </div>
                                    )
                                }

                                return (
                                    <div key={hora} className={cn('flex items-center gap-3 rounded-2xl', pasado ? 'opacity-30' : 'cursor-pointer')}>
                                        <span className="text-xs w-10 shrink-0 pl-1 font-bold" style={{ color: T.p3 }}>{hora}</span>
                                        {huecoActivo === hora ? (
                                            <div className="flex-1 flex gap-2">
                                                <button onClick={() => { setModal({ type: 'sesion', payload: { fecha: fechaStr, hora } }); setHuecoActivo(null) }}
                                                    className="flex-1 py-3 rounded-xl text-sm font-black transition-all active:scale-95"
                                                    style={{ background: 'rgba(37,99,235,0.1)', color: T.blue, border: '1px solid rgba(37,99,235,0.25)' }}>
                                                    + Sesión
                                                </button>
                                                <button onClick={() => { setModal({ type: 'bloqueo', payload: { fecha: fechaStr, hora } }); setHuecoActivo(null) }}
                                                    className="flex-1 py-3 rounded-xl text-sm font-black transition-all active:scale-95"
                                                    style={{ background: 'rgba(220,38,38,0.07)', color: T.red, border: '1px solid rgba(220,38,38,0.18)' }}>
                                                    <Lock className="w-3.5 h-3.5 inline mr-1" />Bloquear
                                                </button>
                                                <button onClick={() => setHuecoActivo(null)} className="p-2.5" style={{ color: T.p3 }}>
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ) : !pasado ? (
                                            <div className="flex-1 py-3 rounded-2xl transition-all hover:bg-black/4"
                                                style={{ border: '1px dashed rgba(0,0,0,0.1)' }}
                                                onClick={() => setHuecoActivo(hora)}>
                                                <p className="text-xs text-center font-medium" style={{ color: T.p3 }}>Libre — toca para añadir</p>
                                            </div>
                                        ) : (
                                            <div className="flex-1 py-3 rounded-2xl" style={{ border: '1px solid rgba(0,0,0,0.05)' }}>
                                                <p className="text-xs text-center" style={{ color: 'rgba(0,0,0,0.18)' }}>Pasado</p>
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}
            </div>

            {modal?.type === 'sesion' && <ModalSesion horaDia={modal.payload} clientes={clientes} onClose={() => setModal(null)} onSaved={fetchDia} />}
            {modal?.type === 'mover' && <ModalMoverSesion sesion={modal.payload} onClose={() => setModal(null)} onSaved={fetchDia} />}
            {modal?.type === 'bloqueo' && <ModalBloqueo fecha={modal.payload.fecha} horaDefault={modal.payload.hora} onClose={() => setModal(null)} onSaved={fetchDia} />}
            {cancelConfirm && <ModalCancelConfirm sesion={cancelConfirm} onConfirm={handleCancel} onCancel={() => setCancelConfirm(null)} />}
            {deleteConfirm && <ModalDeleteConfirm sesion={deleteConfirm} onConfirm={handleDelete} onCancel={() => setDeleteConfirm(null)} />}
            {menuSesionId && <div className="fixed inset-0 z-40" onClick={() => setMenuSesionId(null)} />}
        </div>
    )
}

export default Diario
