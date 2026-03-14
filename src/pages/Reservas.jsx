import React, { useState, useEffect } from 'react'
import { format, isFuture, addDays } from 'date-fns'
import { es } from 'date-fns/locale'
import { Calendar, Clock, X, AlertCircle, CheckCircle2, ChevronRight, Plus, BookOpen, Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs) { return twMerge(clsx(inputs)) }

// ── Horas disponibles para reprogramar ─────────────────────────────────────
const HORAS = Array.from({ length: 11 }, (_, i) => `${String(i + 9).padStart(2, '0')}:00`)

const Reservas = () => {
    const { user } = useAuth()
    const [activeTab, setActiveTab] = useState('proximas')
    const [citas, setCitas] = useState([])
    const [loading, setLoading] = useState(true)

    // Modales
    const [showCancelModal, setShowCancelModal] = useState(false)
    const [showModifyModal, setShowModifyModal] = useState(false)
    const [showDetailModal, setShowDetailModal] = useState(false)
    const [selectedCita, setSelectedCita] = useState(null)
    const [actionLoading, setActionLoading] = useState(false)
    const [successMsg, setSuccessMsg] = useState('')

    // Para modificación
    const [newFecha, setNewFecha] = useState('')
    const [newHora, setNewHora] = useState('')

    const fetchCitas = async () => {
        if (!user) return
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('sesiones')
                .select('*')
                .neq('estado', 'cancelada')
                .order('fecha', { ascending: true })
                .order('hora_inicio', { ascending: true })

            if (error) throw error
            setCitas(data.map(c => ({ ...c, fecha: new Date(c.fecha + 'T00:00:00') })))
        } catch (err) {
            console.error('Error cargando citas:', err.message)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { fetchCitas() }, [user])

    // ── Filtrar ────────────────────────────────────────────────────────────
    const now = new Date()
    const todayStr = format(now, 'yyyy-MM-dd')
    const currentHourStr = format(now, 'HH:mm') // Formato "14:30"

    const isPastAppointment = (cita) => {
        const citaDateStr = format(cita.fecha, 'yyyy-MM-dd')
        if (citaDateStr < todayStr) return true
        if (citaDateStr === todayStr && cita.hora_inicio <= currentHourStr) return true
        return false
    }

    const proximas = citas.filter(c => c.cliente_id === user?.id && !isPastAppointment(c))
    const pasadas = citas.filter(c => c.cliente_id === user?.id && isPastAppointment(c))
    const filtradas = activeTab === 'proximas' ? proximas : pasadas

    // ── Cancelar ───────────────────────────────────────────────────────────
    const handleCancelar = async () => {
        if (!selectedCita) return
        setActionLoading(true)
        try {
            const { error } = await supabase.from('sesiones').update({ estado: 'cancelada' }).eq('id', selectedCita.id)
            if (error) throw error
            setShowCancelModal(false)
            setSelectedCita(null)
            showSuccess('Cita cancelada correctamente.')
            await fetchCitas()
        } catch (err) {
            alert('Error al cancelar: ' + err.message)
        } finally {
            setActionLoading(false)
        }
    }

    // ── Modificar ──────────────────────────────────────────────────────────
    const handleModificar = async () => {
        if (!selectedCita || !newFecha || !newHora) return
        setActionLoading(true)
        try {
            const horaFin = `${String(parseInt(newHora.split(':')[0]) + 1).padStart(2, '0')}:00`
            const { error } = await supabase
                .from('sesiones')
                .update({ fecha: newFecha, hora_inicio: newHora, hora_fin: horaFin })
                .eq('id', selectedCita.id)
            if (error) throw error
            setShowModifyModal(false)
            setSelectedCita(null)
            showSuccess('Cita reprogramada correctamente.')
            await fetchCitas()
        } catch (err) {
            alert('Error al modificar: ' + err.message)
        } finally {
            setActionLoading(false)
        }
    }

    const showSuccess = (msg) => {
        setSuccessMsg(msg)
        setTimeout(() => setSuccessMsg(''), 4000)
    }

    const openDetail = (cita) => { setSelectedCita(cita); setShowDetailModal(true) }
    const openModify = (cita) => {
        setSelectedCita(cita)
        setNewFecha(format(cita.fecha, 'yyyy-MM-dd'))
        setNewHora(cita.hora_inicio)
        setShowModifyModal(true)
        setShowDetailModal(false)
    }
    const openCancel = (cita) => { setSelectedCita(cita); setShowCancelModal(true); setShowDetailModal(false) }

    const minDate = format(addDays(new Date(), 1), 'yyyy-MM-dd')

    return (
        <div className="p-6">
            {/* Toast de éxito */}
            {successMsg && (
                <div className="fixed top-6 left-4 right-4 z-50 bg-[#22c55e] text-white px-5 py-4 rounded-2xl shadow-xl flex items-center gap-3 animate-in slide-in-from-top-4"
                    style={{ boxShadow: '0 0 30px rgba(34,197,94,0.6)' }}>
                    <CheckCircle2 className="w-5 h-5 shrink-0" />
                    <p className="text-sm font-bold">{successMsg}</p>
                </div>
            )}

            <header className="mb-8">
                <h1 className="text-3xl font-black text-gradient-neon mb-1">Mis Reservas</h1>
                <p className="text-white/40 text-sm font-medium">Gestiona tu historial y próximas citas.</p>
            </header>

            {/* Tabs */}
            <div className="flex bg-white/5 p-1 rounded-2xl border border-white/8 mb-8">
                {[
                    { key: 'proximas', label: `Próximas (${proximas.length})` },
                    { key: 'pasadas', label: `Historial (${pasadas.length})` },
                ].map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={cn(
                            "flex-1 py-3 text-sm font-bold rounded-xl transition-all",
                            activeTab === tab.key
                                ? "bg-[#f97316] text-white"
                                : "text-white/40 hover:text-white/70"
                        )}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Lista */}
            <div className="space-y-4">
                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="w-8 h-8 text-[#f97316] animate-spin" />
                    </div>
                ) : filtradas.length > 0 ? (
                    filtradas.map((cita) => {
                        const esPasada = activeTab === 'pasadas'
                        return (
                            <button
                                key={cita.id}
                                onClick={() => openDetail(cita)}
                                className={cn(
                                    "w-full bg-white/5 p-5 rounded-[24px] border flex items-center justify-between group hover:bg-white/8 transition-all text-left",
                                    esPasada ? "border-white/5" : "border-[#f97316]/20 hover:border-[#f97316]/40"
                                )}
                                style={!esPasada ? { boxShadow: '0 0 10px rgba(249,115,22,0.06)' } : {}}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={cn(
                                        "w-12 h-12 rounded-2xl flex items-center justify-center transition-colors",
                                        esPasada
                                            ? "bg-white/5 text-white/25"
                                            : "bg-[#f97316]/15 text-[#f97316] group-hover:bg-[#f97316] group-hover:text-white"
                                    )}
                                        style={!esPasada ? { boxShadow: '0 0 8px rgba(249,115,22,0.2)' } : {}}>
                                        <Calendar className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className={cn("font-bold capitalize", esPasada ? "text-white/30" : "text-white")}>
                                            {format(cita.fecha, 'EEEE d MMMM', { locale: es })}
                                        </p>
                                        <div className="flex items-center gap-3 mt-1">
                                            <div className="flex items-center gap-1 text-[10px] text-white/35 font-bold uppercase tracking-wider">
                                                <Clock className="w-3 h-3" />
                                                {cita.hora_inicio} – {cita.hora_fin}
                                            </div>
                                            <span className={cn(
                                                "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider",
                                                esPasada
                                                    ? "bg-white/5 text-white/25"
                                                    : "bg-[#22c55e]/15 text-[#22c55e]"
                                            )}>
                                                {esPasada ? 'Completada' : 'Confirmada'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <ChevronRight className={cn(
                                    "w-5 h-5 transition-all",
                                    esPasada ? "text-white/15" : "text-[#f97316]/50 group-hover:text-[#f97316] group-hover:translate-x-1"
                                )} />
                            </button>
                        )
                    })
                ) : (
                    <div className="text-center py-20">
                        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/8">
                            <BookOpen className="w-8 h-8 text-white/15" />
                        </div>
                        <p className="text-white/35 font-medium">No hay reservas aquí.</p>
                        {activeTab === 'proximas' && (
                            <p className="text-white/20 text-sm mt-1">Ve al Calendario para reservar una hora.</p>
                        )}
                    </div>
                )}
            </div>

            {/* ─── MODAL DETALLE ─────────────────────────────────────────────── */}
            {showDetailModal && selectedCita && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-[#111318] border border-white/10 w-full max-w-sm rounded-[32px] p-8 shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-2xl font-black text-gradient-neon">Detalle de Cita</h3>
                                <p className="text-white/40 text-sm mt-1 capitalize">
                                    {format(selectedCita.fecha, 'EEEE d MMMM yyyy', { locale: es })}
                                </p>
                            </div>
                            <button onClick={() => setShowDetailModal(false)} className="p-2 bg-white/8 rounded-full hover:bg-white/15 transition-colors">
                                <X className="w-4 h-4 text-white/50" />
                            </button>
                        </div>

                        <div className="bg-white/5 border border-[#22c55e]/20 rounded-2xl p-4 space-y-3 mb-6">
                            <div className="flex justify-between text-sm">
                                <span className="text-white/40 font-medium">Hora de inicio</span>
                                <span className="font-bold text-[#22c55e]">{selectedCita.hora_inicio}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-white/40 font-medium">Hora de fin</span>
                                <span className="font-bold text-[#22c55e]">{selectedCita.hora_fin}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-white/40 font-medium">Estado</span>
                                <span className="font-bold text-[#f97316] capitalize">{selectedCita.estado}</span>
                            </div>
                            {selectedCita.notas && (
                                <div className="pt-2 border-t border-white/5">
                                    <p className="text-white/30 text-xs font-medium mb-1">Notas</p>
                                    <p className="text-sm text-white/60">{selectedCita.notas}</p>
                                </div>
                            )}
                        </div>

                        {isFuture(selectedCita.fecha) ? (
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => openModify(selectedCita)}
                                    className="py-4 bg-[#f97316]/15 border border-[#f97316]/30 text-[#f97316] rounded-2xl font-bold text-sm hover:bg-[#f97316]/25 transition-colors"
                                >
                                    Modificar
                                </button>
                                <button
                                    onClick={() => openCancel(selectedCita)}
                                    className="py-4 bg-red-500/10 text-red-400 rounded-2xl font-bold text-sm hover:bg-red-500/20 transition-colors border border-red-500/20"
                                >
                                    Cancelar
                                </button>
                            </div>
                        ) : (
                            <p className="text-center text-white/20 text-xs font-bold uppercase tracking-widest">Cita finalizada</p>
                        )}
                    </div>
                </div>
            )}

            {/* ─── MODAL MODIFICAR ───────────────────────────────────────────── */}
            {showModifyModal && selectedCita && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-[#111318] border border-white/10 w-full max-w-sm rounded-[32px] p-8 shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-black text-white">Reprogramar</h3>
                            <button onClick={() => setShowModifyModal(false)} className="p-2 bg-white/8 rounded-full hover:bg-white/15 transition-colors">
                                <X className="w-4 h-4 text-white/50" />
                            </button>
                        </div>

                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="block text-xs font-black text-[#f97316]/70 uppercase tracking-widest mb-2">Nueva Fecha</label>
                                <input
                                    type="date"
                                    min={minDate}
                                    value={newFecha}
                                    onChange={e => setNewFecha(e.target.value)}
                                    className="w-full bg-white/5 border border-[#f97316]/30 rounded-2xl px-4 py-3 text-white font-bold focus:border-[#f97316] outline-none transition-all"
                                    style={{ colorScheme: 'dark' }}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-[#22c55e]/70 uppercase tracking-widest mb-2">Nueva Hora</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {HORAS.map(h => {
                                        const isOccupied = citas.some(c =>
                                            c.id !== selectedCita.id &&
                                            format(c.fecha, 'yyyy-MM-dd') === newFecha &&
                                            c.hora_inicio === h
                                        )
                                        return (
                                            <button
                                                key={h}
                                                disabled={isOccupied}
                                                onClick={() => setNewHora(h)}
                                                className={cn(
                                                    "py-3 rounded-2xl text-sm font-bold transition-all",
                                                    newHora === h
                                                        ? "bg-[#22c55e] text-white"
                                                        : isOccupied
                                                            ? "bg-black/40 text-white/10 border border-white/5 cursor-not-allowed"
                                                            : "bg-white/5 text-white/50 hover:bg-white/10 border border-white/8"
                                                )}
                                            >
                                                {h}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleModificar}
                            disabled={!newFecha || !newHora || actionLoading}
                            className="w-full py-4 bg-[#14532d] border border-[#22c55e]/40 text-white rounded-2xl font-black text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                            style={{ boxShadow: '0 0 15px rgba(34,197,94,0.2)' }}
                        >
                            {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirmar nueva hora'}
                        </button>
                    </div>
                </div>
            )}

            {/* ─── MODAL CANCELAR ────────────────────────────────────────────── */}
            {showCancelModal && selectedCita && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-6">
                    <div className="bg-[#111318] border border-red-500/20 w-full max-w-xs rounded-3xl p-8 shadow-2xl text-center">
                        <div className="w-16 h-16 bg-red-500/10 text-red-400 rounded-full flex items-center justify-center mx-auto mb-5 border border-red-500/20">
                            <AlertCircle className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-black text-white mb-2">¿Cancelar cita?</h3>
                        <p className="text-white/40 text-sm mb-2 leading-relaxed">
                            El {format(selectedCita.fecha, 'd MMMM', { locale: es })} a las {selectedCita.hora_inicio}
                        </p>
                        <p className="text-white/20 text-xs mb-8">Esta acción no se puede deshacer.</p>
                        <div className="flex gap-3">
                            <button
                                onClick={handleCancelar}
                                disabled={actionLoading}
                                className="flex-1 py-4 bg-red-500 text-white rounded-2xl font-black text-sm shadow-lg flex items-center justify-center gap-2 disabled:opacity-60"
                            >
                                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sí, cancelar'}
                            </button>
                            <button
                                onClick={() => setShowCancelModal(false)}
                                className="flex-1 py-4 bg-white/5 text-white/50 rounded-2xl font-black text-sm hover:bg-white/10 transition-colors"
                            >
                                Volver
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Reservas
