import React, { useState, useEffect, useRef } from 'react'
import {
    format, addMonths, subMonths, startOfMonth, endOfMonth,
    startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth,
    isSameDay, addDays, subDays
} from 'date-fns'
import { es } from 'date-fns/locale'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import {
    ChevronLeft, ChevronRight, X, Edit2, Trash2,
    CheckCircle2, Loader2, Clock, AlertCircle, LogOut
} from 'lucide-react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs) { return twMerge(clsx(inputs)) }

// Horas de 9:00 a 20:00 en intervalos de 30 minutos
const HORAS = []
for (let h = 9; h <= 20; h++) {
    HORAS.push(`${String(h).padStart(2, '0')}:00`)
    if (h < 20) HORAS.push(`${String(h).padStart(2, '0')}:30`)
}

const HORAS_SELECTOR = ['Modificar hora:',
    ...HORAS.map(h => h)
]

const Calendario = () => {
    const { user, profile, signOut } = useAuth()
    const isAdmin = profile?.rol === 'admin'

    const [currentDate, setCurrentDate] = useState(new Date())
    const [view, setView] = useState('semanal')
    const [citas, setCitas] = useState([])
    const [isLoadingCitas, setIsLoadingCitas] = useState(true)
    const [bookingSuccess, setBookingSuccess] = useState(false)
    const [clientes, setClientes] = useState([])
    const [selectedClientId, setSelectedClientId] = useState('')

    // Modal de confirmación de nueva reserva
    const [selectedSlot, setSelectedSlot] = useState(null)
    const [showConfirmModal, setShowConfirmModal] = useState(false)
    const [bookingLoading, setBookingLoading] = useState(false)

    // Modal de detalle / modificar / anular
    const [selectedEvent, setSelectedEvent] = useState(null)
    const [showDetailModal, setShowDetailModal] = useState(false)

    // Modal modificar
    const [showModifyModal, setShowModifyModal] = useState(false)
    const [modFecha, setModFecha] = useState('')
    const [modHora, setModHora] = useState('')
    const [modLoading, setModLoading] = useState(false)

    // Modal cancelar
    const [showCancelModal, setShowCancelModal] = useState(false)
    const [cancelLoading, setCancelLoading] = useState(false)

    const [isBlockMode, setIsBlockMode] = useState(false)
    const [blockSelection, setBlockSelection] = useState([]) // Array de objetos { id, type, day, hora }
    const [blockLoading, setBlockLoading] = useState(false)
    const longPressTimer = useRef(null)
    const longPressFired = useRef(false)

    // Modo Mover Cita (Móvil)
    const [movingCita, setMovingCita] = useState(null)
    const longPressCitaTimer = useRef(null)
    const longPressCitaFired = useRef(false)

    const getItemId = (type, day, hora) => {
        if (type === 'slot') return `slot_${format(day, 'yyyy-MM-dd')}_${hora}`
        if (type === 'day') return `day_${format(day, 'yyyy-MM-dd')}`
        if (type === 'hour') return `hour_${hora}`
        return ''
    }

    const toggleSelection = (type, day, hora) => {
        const id = getItemId(type, day, hora)
        setBlockSelection(prev => {
            const exists = prev.find(item => item.id === id)
            if (exists) return prev.filter(item => item.id !== id)
            return [...prev, { id, type, day, hora }]
        })
    }

    const cancelBlockMode = () => {
        setIsBlockMode(false)
        setBlockSelection([])
        longPressFired.current = false
    }

    const isSelected = (type, day, hora) => {
        if (type === 'slot') {
            // Si el hueco está seleccionado explícitamente, o su día/hora lo están
            const selfSel = blockSelection.some(item => item.id === getItemId('slot', day, hora))
            const daySel = day && blockSelection.some(item => item.id === getItemId('day', day, null))
            const hourSel = hora && blockSelection.some(item => item.id === getItemId('hour', null, hora))
            return selfSel || daySel || hourSel
        }
        return blockSelection.some(item => item.id === getItemId(type, day, hora))
    }

    const handlePointerDown = (e, type, day, hora) => {
        if (!isAdmin) return
        if (isBlockMode) return // Si está en modo bloque, la selección se hace en onClick

        longPressFired.current = false
        if (longPressTimer.current) clearTimeout(longPressTimer.current)
        longPressTimer.current = setTimeout(() => {
            longPressFired.current = true
            setIsBlockMode(true)
            setBlockSelection([{ id: getItemId(type, day, hora), type, day, hora }])
            longPressTimer.current = null
            if (navigator.vibrate) navigator.vibrate(50)
        }, 800) // Reducido a 800ms, más ágil para móviles
    }

    const handlePointerUp = () => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current)
            longPressTimer.current = null
        }
    }

    // Helper para agrupar props de long-press adaptados a móvil
    const getLongPressProps = (type, day, hora) => ({
        onPointerDown: (e) => handlePointerDown(e, type, day, hora),
        onTouchStart: (e) => handlePointerDown(e, type, day, hora), // Fallback para móviles antiguos
        onPointerUp: handlePointerUp,
        onPointerLeave: handlePointerUp,
        onPointerCancel: handlePointerUp, // Vital en móviles: el navegador cancela el pointer si decide que es un scroll
        onTouchEnd: handlePointerUp,
        onTouchCancel: handlePointerUp,
        onContextMenu: (e) => { if (isAdmin) e.preventDefault(); },
        style: isAdmin ? { WebkitUserSelect: 'none', userSelect: 'none', WebkitTouchCallout: 'none' } : {}
    })

    const handleCitaPointerDown = (e, cita) => {
        const isMine = cita.usuario_id === user?.id
        if (!isAdmin && !isMine) return

        longPressCitaFired.current = false
        if (longPressCitaTimer.current) clearTimeout(longPressCitaTimer.current)
        longPressCitaTimer.current = setTimeout(() => {
            longPressCitaFired.current = true
            setMovingCita(cita)
            longPressCitaTimer.current = null
            if (navigator.vibrate) navigator.vibrate(50)
        }, 800)
    }

    const handleCitaPointerUp = () => {
        if (longPressCitaTimer.current) {
            clearTimeout(longPressCitaTimer.current)
            longPressCitaTimer.current = null
        }
    }

    const getAppointmentLongPressProps = (cita) => {
        const isMine = cita?.usuario_id === user?.id
        if (!isAdmin && !isMine) return {}
        return {
            onPointerDown: (e) => handleCitaPointerDown(e, cita),
            onTouchStart: (e) => handleCitaPointerDown(e, cita),
            onPointerUp: handleCitaPointerUp,
            onPointerLeave: handleCitaPointerUp,
            onPointerCancel: handleCitaPointerUp,
            onTouchEnd: handleCitaPointerUp,
            onTouchCancel: handleCitaPointerUp,
            onContextMenu: (e) => { e.preventDefault(); },
            style: { WebkitUserSelect: 'none', userSelect: 'none', WebkitTouchCallout: 'none', touchAction: 'none' }
        }
    }

    const handleRescheduleDirect = async (cita, targetDay, targetHora) => {
        setModLoading(true) // Reutilizamos este u otro estado si quisieras spinner, aunque la barra puede ser suficiente
        try {
            const targetDateStr = format(targetDay, 'yyyy-MM-dd')
            const [h, m] = targetHora.split(':').map(Number);
            const horaFin = `${String(h + 1).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

            await runSupabaseQuery(async () => {
                const { error } = await supabase.from('citas')
                    .update({ fecha: targetDateStr, hora_inicio: targetHora, hora_fin: horaFin })
                    .eq('id', cita.id)
                if (error) throw error
            })

            await fetchCitas()
            setBookingSuccess(true)
            setTimeout(() => setBookingSuccess(false), 4000)
            setMovingCita(null) // Por si venimos del modo mover
        } catch (err) {
            alert('Error al reprogramar: ' + err.message)
        } finally {
            setModLoading(false)
        }
    }

    const handleSlotClick = (e, day, hora, isBookable, isNotEnoughTime, isSelectableForBlock, isEditable, overlappingCita) => {
        if (longPressFired.current) { longPressFired.current = false; e.preventDefault(); return; }

        if (movingCita) {
            if (isBookable) {
                handleRescheduleDirect(movingCita, day, hora)
            }
            return;
        }

        if (isAdmin && isBlockMode) {
            if (isSelectableForBlock) toggleSelection('slot', day, hora)
        } else {
            if (isBookable) {
                openSlot(day, hora);
            } else if (isNotEnoughTime) {
                // Silently skip or add a subtle hint if needed, but remove alert as requested
            } else if (isEditable && overlappingCita) {
                if (longPressCitaFired.current) { longPressCitaFired.current = false; e.preventDefault(); return; }
                openEvent(overlappingCita);
            }
        }
    }

    const handleBlockConfirm = async (action = 'block') => {
        if (!isAdmin || blockSelection.length === 0) return
        setBlockLoading(true)
        try {
            if (action === 'block') {
                const insertPromises = []

                const getHoraFin30Mins = (hStr) => {
                    const [h, m] = hStr.split(':').map(Number)
                    let nextM = m + 30; let nextH = h;
                    if (nextM >= 60) { nextM = 0; nextH++; }
                    return `${String(nextH).padStart(2, '0')}:${String(nextM).padStart(2, '0')}`
                }

                blockSelection.forEach(({ type, day, hora }) => {
                    if (type === 'slot') {
                        const horaFin = getHoraFin30Mins(hora)
                        insertPromises.push({
                            usuario_id: user.id,
                            fecha: format(day, 'yyyy-MM-dd'),
                            hora_inicio: hora,
                            hora_fin: horaFin,
                            estado: 'confirmada'
                        })
                    } else if (type === 'day') {
                        HORAS.forEach(h => {
                            const horaFin = getHoraFin30Mins(h)
                            if (!getCitaEnHora(day, h) && !isPastSlot(day, h)) {
                                insertPromises.push({
                                    usuario_id: user.id,
                                    fecha: format(day, 'yyyy-MM-dd'),
                                    hora_inicio: h,
                                    hora_fin: horaFin,
                                    estado: 'confirmada'
                                })
                            }
                        })
                    } else if (type === 'hour') {
                        const start = startOfWeek(currentDate, { weekStartsOn: 1 })
                        const days = Array.from({ length: 6 }, (_, i) => addDays(start, i))
                        const horaFin = getHoraFin30Mins(hora)

                        days.forEach(d => {
                            if (!getCitaEnHora(d, hora) && !isPastSlot(d, hora)) {
                                insertPromises.push({
                                    usuario_id: user.id,
                                    fecha: format(d, 'yyyy-MM-dd'),
                                    hora_inicio: hora,
                                    hora_fin: horaFin,
                                    estado: 'confirmada'
                                })
                            }
                        })
                    }
                })

                if (insertPromises.length > 0) {
                    const uniquePromises = Array.from(new Set(insertPromises.map(a => JSON.stringify(a)))).map(a => JSON.parse(a))
                    await runSupabaseQuery(async () => {
                        const { error } = await supabase.from('citas').insert(uniquePromises)
                        if (error) throw error
                    })
                    await fetchCitas()
                }
            } else if (action === 'unblock') {
                const idsToDelete = []

                blockSelection.forEach(({ type, day, hora }) => {
                    const cita = getCitaEnHora(day, hora);
                    if (cita) idsToDelete.push(cita.id);
                })

                const uniqueIds = Array.from(new Set(idsToDelete));
                if (uniqueIds.length > 0) {
                    await runSupabaseQuery(async () => {
                        const { error } = await supabase.from('citas').delete().in('id', uniqueIds);
                        if (error) throw error;
                    });
                    await fetchCitas()
                }
            }

            setIsBlockMode(false)
            setBlockSelection([])
            setBookingSuccess(true)
            setTimeout(() => setBookingSuccess(false), 4000)
        } catch (err) {
            alert('Error al bloquear: ' + err.message)
        } finally {
            setBlockLoading(false)
        }
    }

    // ── Utilidad de Reconexión para prevenir "AbortError: Lock broken" de Supabase JS ──
    const runSupabaseQuery = async (queryFn, retries = 3) => {
        try {
            return await queryFn()
        } catch (err) {
            if (retries > 0 && (err.name === 'AbortError' || err.message?.includes('Lock') || err.message?.includes('Fetch'))) {
                await new Promise(r => setTimeout(r, 600)) // Espera 600ms antes de intentar de nuevo
                return runSupabaseQuery(queryFn, retries - 1)
            }
            throw err
        }
    }

    // ── Carga de citas ────────────────────────────────────────────────────
    const fetchCitas = async () => {
        setIsLoadingCitas(true)
        try {
            await runSupabaseQuery(async () => {
                const { data, error } = await supabase
                    .from('citas')
                    .select('*, usuarios(nombre)')
                    .eq('estado', 'confirmada')
                if (error) throw error
                setCitas(data.map(c => ({ ...c, fecha: new Date(c.fecha + 'T00:00:00') })))
            })
        } catch (err) {
            console.error('Error al cargar citas:', err.message)
        } finally {
            setIsLoadingCitas(false)
        }
    }

    useEffect(() => { fetchCitas() }, [currentDate])

    useEffect(() => {
        if (isAdmin) {
            supabase.from('usuarios').select('id, nombre, email').eq('rol', 'cliente').order('nombre')
                .then(({ data }) => setClientes(data || []))
        }
    }, [isAdmin])

    // ── Reservar ──────────────────────────────────────────────────────────
    const handleReservar = async () => {
        if (!user || !selectedSlot) return

        const targetUserId = isAdmin ? selectedClientId : user.id;
        if (isAdmin && !targetUserId) {
            alert('Por favor selecciona un cliente para la reserva.')
            return
        }

        setBookingLoading(true)
        try {
            const [h, m] = selectedSlot.hora.split(':').map(Number);
            const horaFin = `${String(h + 1).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

            await runSupabaseQuery(async () => {
                const { error } = await supabase.from('citas').insert([{
                    usuario_id: targetUserId,
                    fecha: format(selectedSlot.day, 'yyyy-MM-dd'),
                    hora_inicio: selectedSlot.hora,
                    hora_fin: horaFin,
                    estado: 'confirmada'
                }])
                if (error) throw error
            })

            await fetchCitas()
            setShowConfirmModal(false)
            setSelectedSlot(null)
            setBookingSuccess(true)
            setTimeout(() => setBookingSuccess(false), 4000)
        } catch (err) {
            alert('Error al reservar: ' + err.message)
        } finally {
            setBookingLoading(false)
        }
    }

    // ── Modificar ─────────────────────────────────────────────────────────
    const openModify = (cita = selectedEvent) => {
        setModFecha(format(cita.fecha, 'yyyy-MM-dd'))
        setModHora(cita.hora_inicio)
        setShowDetailModal(false)
        setShowModifyModal(true)
    }

    const handleModificar = async () => {
        if (!modFecha || !modHora || !selectedEvent) return
        setModLoading(true)
        try {
            const [h, m] = modHora.split(':').map(Number);
            const horaFin = `${String(h + 1).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

            await runSupabaseQuery(async () => {
                const { error } = await supabase.from('citas')
                    .update({ fecha: modFecha, hora_inicio: modHora, hora_fin: horaFin })
                    .eq('id', selectedEvent.id)
                if (error) throw error
            })

            await fetchCitas()
            setShowModifyModal(false)
            setSelectedEvent(null)
            setBookingSuccess(true)
            setTimeout(() => setBookingSuccess(false), 4000)
        } catch (err) {
            alert('Error al modificar: ' + err.message)
        } finally {
            setModLoading(false)
        }
    }

    // ── Cancelar ──────────────────────────────────────────────────────────
    const openCancel = () => {
        setShowDetailModal(false)
        setShowCancelModal(true)
    }

    const handleCancelar = async () => {
        if (!selectedEvent) return
        setCancelLoading(true)
        try {
            await runSupabaseQuery(async () => {
                const { error } = await supabase.from('citas').delete().eq('id', selectedEvent.id)
                if (error) throw error
            })
            await fetchCitas()
            setShowCancelModal(false)
            setSelectedEvent(null)
        } catch (err) {
            alert('Error al cancelar: ' + err.message)
        } finally {
            setCancelLoading(false)
        }
    }

    const nav = (dir) => {
        const delta = dir === 1 ? 1 : -1;
        if (view === 'mensual') {
            setCurrentDate(d => addMonths(d, delta))
        } else if (view === 'semanal') {
            setCurrentDate(d => addDays(d, 7 * delta))
        } else {
            // Navegación diaria: Si saltamos a un domingo, añadimos un día más al salto
            setCurrentDate(d => {
                let nextDay = addDays(d, delta);
                if (nextDay.getDay() === 0) { // 0 es Domingo
                    nextDay = addDays(nextDay, delta);
                }
                return nextDay;
            })
        }
    }

    const isPastSlot = (day, hora) => {
        const now = new Date()
        const [h, m] = hora.split(':').map(Number)
        const slotDate = new Date(day)
        slotDate.setHours(h, m, 0, 0)
        return slotDate < now
    }

    const isSlotBookable = (day, hora) => {
        if (hora === '19:30') return false
        if (getCitaEnHora(day, hora)) return false

        // Al ser sesiones de 1 hora, la siguiente franja de 30 min también debe estar libre
        const [h, m] = hora.split(':').map(Number)
        let nextM = m + 30
        let nextH = h
        if (nextM >= 60) {
            nextM = 0
            nextH++
        }
        const nextHora = `${String(nextH).padStart(2, '0')}:${String(nextM).padStart(2, '0')}`

        // Si no existe la siguiente franja en nuestro horario o está ocupada, no es reservable
        if (!HORAS.includes(nextHora)) return false
        if (getCitaEnHora(day, nextHora)) return false

        return true
    }

    const openSlot = (day, hora) => {
        if (isPastSlot(day, hora)) return
        if (!isSlotBookable(day, hora)) return
        setSelectedSlot({ day, hora })
        setShowConfirmModal(true)
    }
    const openEvent = (cita) => { setSelectedEvent(cita); setShowDetailModal(true) }

    const getCitaEnHora = (day, hora) => {
        const [h, m] = hora.split(':').map(Number);
        const t = h * 60 + m;
        return citas.find(c => {
            if (!isSameDay(c.fecha, day)) return false;
            const [sh, sm] = c.hora_inicio.split(':').map(Number);
            const [eh, em] = c.hora_fin.split(':').map(Number);
            const startT = sh * 60 + sm;
            const endT = eh * 60 + em;
            return t >= startT && t < endT;
        });
    }


    // Etiqueta de la vista activa para la fecha
    const getViewLabel = () => {
        if (view === 'diaria') return format(currentDate, "d 'de' MMMM yyyy", { locale: es }).toUpperCase()
        if (view === 'semanal') {
            const start = startOfWeek(currentDate, { weekStartsOn: 1 })
            return `${format(start, 'd MMM', { locale: es })} – ${format(addDays(start, 6), 'd MMM yyyy', { locale: es })}`.toUpperCase()
        }
        return format(currentDate, 'MMMM yyyy', { locale: es }).toUpperCase()
    }

    const renderMonthly = () => {
        const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 })
        const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 })

        // Include all 7 days (Mon–Sun)
        const days = eachDayOfInterval({ start, end })

        return (
            <div style={{ background: '#ffffff', color: '#2b47c9' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid #e2e6f0' }}>
                    {['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'].map((d, i) => (
                        <div key={d} style={{
                            padding: '10px 0', textAlign: 'center', fontSize: 9, fontWeight: 800,
                            color: '#2b47c9', textTransform: 'uppercase', letterSpacing: '0.06em',
                            borderRight: i < 6 ? '1px solid #e2e6f0' : 'none',
                        }}>{d}</div>
                    ))}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
                    {days.map((day, i) => {
                        const today = isSameDay(day, new Date())
                        const dayCitas = citas.filter(c => isSameDay(c.fecha, day))
                        const isThisMonth = isSameMonth(day, currentDate)
                        return (
                            <div key={i}
                                onClick={() => { if (isAdmin) { setCurrentDate(day); setView('diaria'); } }}
                                style={{
                                    minHeight: 70, padding: 6,
                                    borderRight: (i % 7) < 6 ? '1px solid #e2e6f0' : 'none',
                                    borderBottom: i < days.length - 7 ? '1px solid #e2e6f0' : 'none',
                                    opacity: isThisMonth ? 1 : 0.3,
                                    cursor: isAdmin ? 'pointer' : 'default',
                                    background: '#ffffff',
                                }}>
                                <span style={{
                                    fontSize: 11, fontWeight: 800,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    width: 22, height: 22, borderRadius: '50%',
                                    background: today ? '#2b47c9' : 'transparent',
                                    color: today ? '#ffffff' : '#2b47c9',
                                }}>{format(day, 'd')}</span>
                                <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    {dayCitas
                                        .filter(c => isAdmin ? c.usuario_id !== user?.id : c.usuario_id === user?.id)
                                        .map(c => {
                                            const isMine = c.usuario_id === user?.id
                                            return (
                                                <div key={c.id}
                                                    style={{
                                                        borderRadius: 6, width: '100%',
                                                        background: '#2b47c9',
                                                        boxShadow: '0 1px 4px rgba(43,71,201,0.3)',
                                                        padding: isAdmin ? '1px 3px' : '3px 2px',
                                                        display: 'flex', flexDirection: isAdmin ? 'row' : 'column',
                                                        alignItems: 'center', justifyContent: 'center',
                                                        cursor: 'pointer',
                                                    }}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (movingCita) { if (movingCita.id === c.id) setMovingCita(null); return; }
                                                        openEvent(c)
                                                    }}
                                                    {...getAppointmentLongPressProps(c)}>
                                                    {isAdmin ? (
                                                        <span style={{ fontSize: 7, fontWeight: 800, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                            {c.usuarios?.nombre || 'Cliente'}
                                                        </span>
                                                    ) : (
                                                        <>
                                                            <span style={{ fontSize: 9, fontWeight: 800, color: '#fff', lineHeight: 1 }}>{c.hora_inicio}</span>
                                                            <span style={{ fontSize: 9, fontWeight: 800, color: '#fff', lineHeight: 1 }}>{c.hora_fin}</span>
                                                        </>
                                                    )}
                                                </div>
                                            )
                                        })}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        )
    }


    const renderWeekly = () => {
        const start = startOfWeek(currentDate, { weekStartsOn: 1 })
        const days = Array.from({ length: 7 }, (_, i) => addDays(start, i)) // 7 días (Lunes a Domingo)
        // Abreviaciones de días para el header
        const dayAbbrs = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM']
        return (
            <div style={{ background: '#ffffff', overflowX: 'auto' }}>
                <div style={{ minWidth: 0, overflowY: 'hidden' }}>
                    {/* CABECERA - HORA + días */}
                    <div style={{ display: 'flex', borderBottom: '1px solid #e2e6f0', background: '#ffffff', position: 'sticky', top: 0, zIndex: 20 }}>
                        {/* Columna HORA */}
                        <div style={{ width: 44, flexShrink: 0, padding: '10px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRight: '1px solid #e2e6f0' }}>
                            <span style={{ fontSize: 9, fontWeight: 800, color: '#2b47c9', textTransform: 'uppercase', letterSpacing: '0.05em' }}>HORA</span>
                        </div>
                        {/* Columnas días */}
                        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: `repeat(${days.length}, 1fr)` }}>
                            {days.map((day, i) => {
                                const isToday = isSameDay(day, new Date())
                                return (
                                    <div key={i}
                                        style={{ padding: '8px 2px', textAlign: 'center', borderLeft: i > 0 ? '1px solid #e2e6f0' : 'none', cursor: (isAdmin && isBlockMode) ? 'pointer' : 'default' }}
                                        onClick={() => { if (longPressFired.current) { longPressFired.current = false; return; } if (isAdmin && isBlockMode) toggleSelection('day', day, null); }}
                                        {...getLongPressProps('day', day, null)}>
                                        <p style={{ fontSize: 9, fontWeight: 800, color: '#2b47c9', textTransform: 'uppercase', marginBottom: 4 }}>{dayAbbrs[i]}</p>
                                        <div style={{
                                            fontSize: 12, fontWeight: 800, margin: '0 auto',
                                            width: isToday ? 24 : 'auto', height: isToday ? 24 : 'auto',
                                            borderRadius: isToday ? '50%' : 0,
                                            border: isToday ? '2px solid #2b47c9' : 'none',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            color: '#2b47c9',
                                        }}>
                                            {format(day, 'd')}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* CUERPO CALENDARIO */}
                    {HORAS.map(hora => (
                        <div key={hora} style={{ display: 'flex', borderBottom: '1px solid #e2e6f0', height: 40 }}>
                            {/* Celda de hora */}
                            <div style={{
                                width: 44, flexShrink: 0, display: 'flex', alignItems: 'flex-start',
                                justifyContent: 'center', paddingTop: 4, borderRight: '1px solid #e2e6f0',
                                background: isSelected('hour', null, hora) ? '#fef9c3' : '#ffffff',
                                cursor: (isAdmin && isBlockMode) ? 'pointer' : 'default',
                            }}
                                onClick={() => { if (longPressFired.current) { longPressFired.current = false; return; } if (isAdmin && isBlockMode) toggleSelection('hour', null, hora); }}
                                {...getLongPressProps('hour', null, hora)}>
                                <span style={{ fontSize: 9, fontWeight: 700, color: '#2b47c9' }}>{hora}</span>
                            </div>
                            {/* Celdas de cada día */}
                            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: `repeat(${days.length}, 1fr)` }}>
                                {days.map((day, i) => {
                                    const overlappingCita = getCitaEnHora(day, hora)
                                    const isStart = overlappingCita && overlappingCita.hora_inicio === hora
                                    const isPast = isPastSlot(day, hora)
                                    const isBookable = !overlappingCita && !isPast && isSlotBookable(day, hora)
                                    const isMine = overlappingCita?.usuario_id === user?.id
                                    const isEditable = overlappingCita && (isMine || isAdmin)
                                    const isAdminBlock = isAdmin && isMine
                                    const isSlotEmpty = !overlappingCita && !isPast
                                    const isNotEnoughTime = isSlotEmpty && !isBookable
                                    const isSelectableForBlock = (isAdmin && isBlockMode && (!overlappingCita || isPast)) || (isSlotEmpty && !isBlockMode)
                                    const isSelectedSlot = isSelected('slot', day, hora)

                                    return (
                                        <div key={i}
                                            style={{
                                                position: 'relative',
                                                borderLeft: i > 0 ? '1px solid #e2e6f0' : 'none',
                                                background: isSelectedSlot ? '#fef9c3'
                                                    : isPast && !overlappingCita ? '#f5f6fa'
                                                    : '#ffffff',
                                                cursor: isBookable ? 'pointer' : 'default',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            }}
                                            onClick={(e) => {
                                                if (isAdmin && isBlockMode) {
                                                    if (!overlappingCita || isPast) toggleSelection('slot', day, hora)
                                                    return
                                                }
                                                handleSlotClick(e, day, hora, isBookable, isNotEnoughTime, isSelectableForBlock, isEditable, overlappingCita)
                                            }}
                                            {...(isSelectableForBlock || (isAdmin && isBlockMode && (!overlappingCita || isPast)) ? getLongPressProps('slot', day, hora) : {})}>

                                            {/* Bloque de sesión — estilo FORÇA: azul marino redondeado */}
                                            {isStart && isEditable && !isAdminBlock && (
                                                <div
                                                    {...getAppointmentLongPressProps(overlappingCita)}
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        if (longPressCitaFired.current) { longPressCitaFired.current = false; e.preventDefault(); return }
                                                        if (isAdmin && isBlockMode) { if (isPastSlot(day, hora)) toggleSelection('slot', day, hora); return }
                                                        if (movingCita) { if (movingCita.id === overlappingCita.id) setMovingCita(null); return }
                                                        openEvent(overlappingCita)
                                                    }}
                                                    style={{
                                                        position: 'absolute',
                                                        top: 3, left: 2, right: 2,
                                                        height: 'calc(200% - 7px)',
                                                        borderRadius: 10,
                                                        background: movingCita?.id === overlappingCita.id
                                                            ? '#ef4444'
                                                            : '#2b47c9',
                                                        boxShadow: movingCita?.id === overlappingCita.id
                                                            ? '0 2px 8px rgba(239,68,68,0.4)'
                                                            : '0 2px 6px rgba(43,71,201,0.3)',
                                                        zIndex: 15,
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        ...getAppointmentLongPressProps(overlappingCita).style,
                                                    }}>
                                                    {isAdmin && (
                                                        <span style={{ fontSize: 8, fontWeight: 800, color: '#fff', textAlign: 'center', padding: '0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                            {overlappingCita.usuarios?.nombre || 'Cliente'}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    const renderDaily = () => (
        <div style={{ background: '#ffffff' }}>
            {/* CABECERA DÍA */}
            <div style={{ display: 'flex', borderBottom: '1px solid #e2e6f0', background: '#ffffff' }}>
                <div style={{ width: 44, flexShrink: 0, padding: '10px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRight: '1px solid #e2e6f0' }}>
                    <span style={{ fontSize: 9, fontWeight: 800, color: '#2b47c9', textTransform: 'uppercase' }}>HORA</span>
                </div>
                <div
                    style={{ flex: 1, padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: (isAdmin && isBlockMode) ? 'pointer' : 'default' }}
                    onClick={() => { if (longPressFired.current) { longPressFired.current = false; return; } if (isAdmin && isBlockMode) toggleSelection('day', currentDate, null); }}
                    {...getLongPressProps('day', currentDate, null)}>
                    <p style={{ fontSize: 13, fontWeight: 800, color: '#2b47c9', textTransform: 'uppercase', margin: 0 }}>
                        {format(currentDate, 'EEEE d', { locale: es }).toUpperCase()}
                    </p>
                </div>
            </div>

            {/* CUERPO DEL CALENDARIO DIARIO */}
            {HORAS.map(hora => {
                const overlappingCita = getCitaEnHora(currentDate, hora)
                const isStart = overlappingCita && overlappingCita.hora_inicio === hora
                const isPast = isPastSlot(currentDate, hora)
                const isMine = overlappingCita?.usuario_id === user?.id
                const isEditable = overlappingCita && (isMine || isAdmin)
                const isAdminBlock = isAdmin && isMine

                return (
                    <div key={hora} style={{ display: 'flex', borderBottom: '1px solid #e2e6f0', height: 40 }}>
                        <div style={{
                            width: 44, flexShrink: 0, display: 'flex', alignItems: 'flex-start',
                            justifyContent: 'center', paddingTop: 4, borderRight: '1px solid #e2e6f0',
                            background: isSelected('hour', null, hora) ? '#fef9c3' : '#ffffff',
                            cursor: (isAdmin && isBlockMode) ? 'pointer' : 'default',
                        }}
                            onClick={() => { if (longPressFired.current) { longPressFired.current = false; return; } if (isAdmin && isBlockMode) toggleSelection('hour', null, hora); }}
                            {...getLongPressProps('hour', null, hora)}>
                            <span style={{ fontSize: 9, fontWeight: 700, color: '#2b47c9' }}>{hora}</span>
                        </div>
                        <div style={{ flex: 1, position: 'relative', padding: 0 }}>
                            {!overlappingCita || !isEditable || isAdminBlock ? (
                                (() => {
                                    const isBookable = !isPast && !overlappingCita && isSlotBookable(currentDate, hora)
                                    const isSlotEmpty = !overlappingCita && !isPast;
                                    const isNotEnoughTime = isSlotEmpty && !isBookable;
                                    const isSelectableForBlock = (isAdmin && isBlockMode && (!overlappingCita || isPast)) || (isSlotEmpty && !isBlockMode);

                                    return (
                                        <div onClick={(e) => {
                                            if (isAdmin && isBlockMode) {
                                                if (!overlappingCita || isPast) { toggleSelection('slot', currentDate, hora); }
                                                return;
                                            }
                                            handleSlotClick(e, currentDate, hora, isBookable, isNotEnoughTime, isSelectableForBlock, isEditable, overlappingCita);
                                        }}
                                            {...(isSelectableForBlock || (isAdmin && isBlockMode && (!overlappingCita || isPast)) ? getLongPressProps('slot', currentDate, hora) : {})}
                                            style={{
                                                width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                background: isSelected('slot', currentDate, hora) ? '#fef9c3'
                                                    : isPast && !overlappingCita ? '#f5f6fa'
                                                    : '#ffffff',
                                                cursor: isBookable ? 'pointer' : 'default',
                                            }}>
                                        </div>
                                    )
                                })()
                            ) : isStart && isEditable && !isAdminBlock && (
                                <div
                                    {...getAppointmentLongPressProps(overlappingCita)}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (longPressCitaFired.current) { longPressCitaFired.current = false; e.preventDefault(); return; }
                                        if (isAdmin && isBlockMode) { if (isPastSlot(currentDate, hora)) toggleSelection('slot', currentDate, hora); return; }
                                        if (movingCita) { if (movingCita.id === overlappingCita.id) setMovingCita(null); return; }
                                        openEvent(overlappingCita);
                                    }}
                                    style={{
                                        position: 'absolute',
                                        top: 3, left: 4, right: 4,
                                        height: 'calc(200% - 7px)',
                                        borderRadius: 10,
                                        background: movingCita?.id === overlappingCita.id ? '#ef4444' : '#2b47c9',
                                        boxShadow: '0 2px 6px rgba(43,71,201,0.3)',
                                        zIndex: 15, cursor: 'pointer',
                                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                        ...getAppointmentLongPressProps(overlappingCita).style,
                                    }}>
                                    {isAdmin ? (
                                        <span style={{ fontSize: 10, fontWeight: 800, color: '#fff' }}>
                                            {overlappingCita.usuarios?.nombre || 'Cliente'}
                                        </span>
                                    ) : isMine ? (
                                        <>
                                            <span style={{ fontSize: 11, fontWeight: 800, color: '#fff', lineHeight: 1 }}>{overlappingCita.hora_inicio}</span>
                                            <span style={{ fontSize: 11, fontWeight: 800, color: '#fff', lineHeight: 1 }}>{overlappingCita.hora_fin}</span>
                                        </>
                                    ) : null}
                                </div>
                            )}
                        </div>
                    </div >
                )
            })}
        </div >
    )


    const minDate = format(addDays(new Date(), 1), 'yyyy-MM-dd')

    return (
        <div style={{
            padding: '0',
            background: '#eef0f5',
            minHeight: '100%',
            fontFamily: "'Montserrat', sans-serif",
        }}>

            {/* Toast éxito */}
            {bookingSuccess && (
                <div style={{
                    position: 'fixed', bottom: 88, left: 16, right: 16, zIndex: 90,
                    background: '#2b47c9', color: '#fff', padding: '14px 20px',
                    borderRadius: 16, boxShadow: '0 4px 20px rgba(43,71,201,0.4)',
                    display: 'flex', alignItems: 'center', gap: 10,
                }}>
                    <CheckCircle2 size={18} />
                    <p style={{ fontSize: 14, fontWeight: 800, margin: 0 }}>¡Cita guardada correctamente!</p>
                </div>
            )}

            {/* ── HEADER FORÇA ── */}
            {!isAdmin && (
                <div style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    paddingTop: 24, paddingBottom: 8,
                }}>
                    {/* Fila FORÇA con icono */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 14, color: '#2b47c9' }}>✦</span>
                        <h1 style={{
                            fontSize: 28, fontWeight: 900, fontStyle: 'italic',
                            color: '#2b47c9', margin: 0, letterSpacing: '-0.02em',
                        }}>FORÇA</h1>
                    </div>
                    {/* BIENVENIDO */}
                    <p style={{
                        fontSize: 10, fontWeight: 700, letterSpacing: '0.25em',
                        color: '#6b7a99', textTransform: 'uppercase', margin: '4px 0 2px',
                    }}>BIENVENIDO</p>
                    {/* Nombre usuario - JOS en gris, UE en azul (o nombre completo en azul) */}
                    <h2 style={{ margin: 0 }}>
                        <span style={{ fontSize: 28, fontWeight: 900, color: '#b8bfd4', letterSpacing: '-0.02em' }}>
                            {(profile?.nombre || 'USUARIO').toUpperCase().slice(0, 3)}
                        </span>
                        <span style={{ fontSize: 28, fontWeight: 900, color: '#2b47c9', letterSpacing: '-0.02em' }}>
                            {(profile?.nombre || 'USUARIO').toUpperCase().slice(3)}
                        </span>
                    </h2>
                </div>
            )}

            {/* ── TABS MENSUAL / SEMANAL / DIARIA ── */}
            <div style={{
                display: 'flex', gap: 0,
                margin: '16px 16px 12px',
                background: '#dde0ea',
                borderRadius: 24,
                padding: 3,
            }}>
                {[
                    { v: 'mensual', label: 'MENSUAL' },
                    { v: 'semanal', label: 'SEMANAL' },
                    { v: 'diaria', label: 'DIARIA' },
                ].map(({ v, label }) => (
                    <button
                        key={v}
                        onClick={() => setView(v)}
                        style={{
                            flex: 1,
                            padding: '9px 0',
                            borderRadius: 21,
                            fontWeight: 800,
                            fontSize: 11,
                            letterSpacing: '0.08em',
                            border: view === v ? '1.5px solid #2b47c9' : '1.5px solid transparent',
                            background: view === v ? '#ffffff' : 'transparent',
                            color: view === v ? '#2b47c9' : '#8a96b8',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                        }}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {/* ── NAVEGADOR DE FECHA ── */}
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '4px 16px 12px',
            }}>
                <button
                    onClick={() => nav(-1)}
                    style={{
                        width: 36, height: 36, borderRadius: '50%',
                        background: '#dde0ea', border: 'none', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#2b47c9',
                    }}>
                    <ChevronLeft size={20} strokeWidth={2.5} />
                </button>
                <h2 style={{
                    fontSize: 17, fontWeight: 900, color: '#2b47c9',
                    margin: 0, letterSpacing: '-0.01em',
                }}>
                    {getViewLabel()}
                </h2>
                <button
                    onClick={() => nav(1)}
                    style={{
                        width: 36, height: 36, borderRadius: '50%',
                        background: '#dde0ea', border: 'none', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#2b47c9',
                    }}>
                    <ChevronRight size={20} strokeWidth={2.5} />
                </button>
            </div>

            {/* ── CUERPO DEL CALENDARIO ── */}
            <div style={{
                margin: '0 16px',
                background: '#ffffff',
                borderRadius: 16,
                overflow: 'hidden',
                boxShadow: '0 2px 16px rgba(30,50,120,0.08)',
                border: '1px solid #e2e6f0',
            }}>
                {isLoadingCitas ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
                        <Loader2 size={28} className="animate-spin" style={{ color: '#2b47c9' }} />
                    </div>
                ) : (
                    <div>
                        {view === 'mensual' && renderMonthly()}
                        {view === 'semanal' && renderWeekly()}
                        {view === 'diaria' && renderDaily()}
                    </div>
                )}
            </div>

            {/* ── MENÚ DE OPCIÓN RÁPIDA (EN FLUJO NORMAL, JUSTO DEBAJO) ── */}
            {movingCita && (
                <div className="mt-4 bg-[#111318] rounded-2xl border border-red-500/30 p-5 shadow-2xl animate-in slide-in-from-top-2 duration-300">
                    <div className="max-w-lg mx-auto flex flex-col gap-3">
                        <div className="flex flex-col">
                            <span className="text-red-500 font-black text-xs tracking-widest uppercase flex items-center gap-2"><div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>Opción rápida</span>
                            <span className="text-white text-xs mt-0.5">
                                Toca un hueco libre para reprogramarla o elige una acción:
                            </span>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => {
                                    setSelectedEvent(movingCita);
                                    openModify(movingCita);
                                    setMovingCita(null);
                                }}
                                className="flex-1 px-2 py-3 bg-white text-black hover:bg-white/90 rounded-xl font-black text-xs transition-colors text-center truncate"
                            >
                                MODIFICAR
                            </button>
                            <button
                                onClick={() => {
                                    setSelectedEvent(movingCita);
                                    openCancel();
                                    setMovingCita(null);
                                }}
                                className="flex-1 px-2 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-black text-xs transition-colors border border-red-500/50 text-center truncate"
                            >
                                ANULAR
                            </button>
                            <button
                                onClick={() => setMovingCita(null)}
                                className="flex-1 px-2 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-black text-xs transition-colors border border-transparent text-center truncate"
                            >
                                CANCELAR
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── BARRA MODO BLOQUEO (EN FLUJO NORMAL, JUSTO DEBAJO) ── */}
            {isBlockMode && isAdmin && (
                <div className="mt-4 bg-[#111318] border border-[#f97316]/30 p-5 rounded-2xl shadow-2xl animate-in slide-in-from-top-2 duration-300">
                    <div className="max-w-md mx-auto flex items-center justify-between gap-4">
                        <div className="flex flex-col">
                            <span className="text-[#f97316] font-black text-xs tracking-widest uppercase">Modo Selecc.</span>
                            <span className="text-white font-bold text-sm">
                                {blockSelection.length} {blockSelection.length === 1 ? 'elemento' : 'elementos'}
                            </span>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={cancelBlockMode}
                                className="px-3 py-3 rounded-xl font-black text-xs text-white/50 bg-white/5 hover:bg-white/10 transition-colors"
                            >
                                CANCELAR
                            </button>
                            <button
                                onClick={() => handleBlockConfirm('unblock')}
                                disabled={blockLoading || blockSelection.length === 0}
                                className="px-4 py-3 rounded-xl font-black text-xs text-white transition-all bg-[#4b5563] hover:bg-[#6b7280] disabled:opacity-50"
                            >
                                {blockLoading ? <Loader2 className="w-4 h-4 text-white animate-spin mx-auto" /> : 'DESBLOQUEAR'}
                            </button>
                            <button
                                onClick={() => handleBlockConfirm('block')}
                                disabled={blockLoading || blockSelection.length === 0}
                                className="px-4 py-3 rounded-xl font-black text-xs text-white transition-all shadow-lg shadow-red-500/20 disabled:opacity-50 flex items-center gap-2"
                                style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' }}
                            >
                                {blockLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'BLOQUEAR'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── MODAL: CONFIRMAR RESERVA ──────────────────────────────────── */}
            {showConfirmModal && selectedSlot && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[70] flex items-center justify-center p-6">
                    <div className="bg-[#111318] border border-[#22c55e]/30 w-full max-w-xs rounded-3xl p-7 shadow-2xl text-center"
                        style={{ boxShadow: '0 0 40px rgba(0,0,0,0.8), 0 0 20px rgba(34,197,94,0.1)' }}>
                        <div className="w-14 h-14 bg-[#22c55e]/15 rounded-full flex items-center justify-center mx-auto mb-5 border border-[#22c55e]/30"
                            style={{ boxShadow: '0 0 15px rgba(34,197,94,0.3)' }}>
                            <CheckCircle2 className="w-7 h-7 text-[#22c55e]" />
                        </div>
                        <h3 className="text-xl font-black text-white mb-1">Confirmar reserva</h3>
                        <p className="text-white/50 text-sm mb-1 capitalize">
                            {format(selectedSlot.day, 'EEEE d MMMM', { locale: es })}
                        </p>
                        <p className="text-[#22c55e] font-black text-lg mb-6">{selectedSlot.hora}</p>

                        {isAdmin && (
                            <div className="mb-6 text-left w-full mx-auto">
                                <label className="block text-[10px] font-black text-white/50 uppercase tracking-widest mb-1.5 ml-1">Para el cliente:</label>
                                <select
                                    className="w-full bg-[#1c202a] border border-white/10 rounded-2xl px-4 py-3 text-sm text-white font-bold focus:border-[#22c55e] outline-none transition-all appearance-none cursor-pointer"
                                    value={selectedClientId}
                                    onChange={(e) => setSelectedClientId(e.target.value)}
                                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23ffffff50'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundPosition: 'right 1rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.2em 1.2em' }}
                                >
                                    <option value="" disabled>Seleccionar...</option>
                                    {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre || c.email}</option>)}
                                </select>
                            </div>
                        )}
                        <div className="flex gap-3">
                            <button
                                onClick={handleReservar}
                                disabled={bookingLoading}
                                className="flex-1 py-3.5 bg-[#14532d] border border-[#22c55e]/40 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 disabled:opacity-60"
                                style={{ boxShadow: '0 0 15px rgba(34,197,94,0.2)' }}
                            >
                                {bookingLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Reservar'}
                            </button>
                            <button
                                onClick={() => { setShowConfirmModal(false); setSelectedSlot(null) }}
                                className="flex-1 py-3.5 bg-white/5 text-white/50 rounded-2xl font-black text-sm hover:bg-white/10 transition-colors"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}


            {/* ── MODAL: DETALLE CITA ───────────────────────────────────────── */}
            {showDetailModal && selectedEvent && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[70] flex items-center justify-center p-6">
                    <div className="bg-[#111318] border border-[#22c55e]/30 w-full max-w-xs rounded-3xl p-7 shadow-2xl text-center"
                        style={{ boxShadow: '0 0 40px rgba(0,0,0,0.8), 0 0 20px rgba(34,197,94,0.1)' }}>

                        <div className="w-14 h-14 bg-[#22c55e]/15 rounded-full flex items-center justify-center mx-auto mb-5 border border-[#22c55e]/30"
                            style={{ boxShadow: '0 0 15px rgba(34,197,94,0.3)' }}>
                            <CheckCircle2 className="w-7 h-7 text-[#22c55e]" />
                        </div>

                        <h3 className="text-xl font-black text-white mb-1">Detalle de Cita</h3>
                        <p className="text-white/50 text-sm mb-1 capitalize">
                            {format(selectedEvent.fecha, 'EEEE d MMMM', { locale: es })}
                        </p>
                        <p className="text-[#22c55e] font-black text-lg mb-6">
                            {selectedEvent.hora_inicio} - {selectedEvent.hora_fin}
                        </p>

                        {isAdmin && (
                            <p className="text-white/80 font-bold mb-6 truncate px-2 text-sm">
                                Cliente: {selectedEvent.usuarios?.nombre || selectedEvent.usuarios?.email || 'Desconocido'}
                            </p>
                        )}

                        <div className="flex flex-col gap-3 mb-3">
                            <button
                                onClick={() => openModify(selectedEvent)}
                                className="w-full py-4 bg-[#f97316]/10 border border-[#f97316]/30 text-[#f97316] rounded-2xl font-black text-base hover:bg-[#f97316]/20 transition-colors"
                            >
                                Modificar
                            </button>
                            <button
                                onClick={() => openCancel()}
                                className="w-full py-4 bg-red-500/10 border border-red-500/30 text-red-500 rounded-2xl font-black text-base hover:bg-red-500/20 transition-colors"
                            >
                                Anular
                            </button>
                        </div>
                        <button
                            onClick={() => setShowDetailModal(false)}
                            className="w-full py-4 bg-white/5 border border-white/5 text-white/50 rounded-2xl font-black text-base hover:bg-white/10 transition-colors"
                        >
                            Cerrar ventana
                        </button>
                    </div>
                </div>
            )}


            {/* ── MODAL: MODIFICAR ─────────────────────────────────────────── */}
            {showModifyModal && selectedEvent && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[80] flex items-center justify-center p-4">
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
                                    value={modFecha}
                                    onChange={e => setModFecha(e.target.value)}
                                    className="w-full bg-white/5 border border-[#f97316]/30 rounded-2xl px-4 py-3 text-white font-bold focus:border-[#f97316] outline-none transition-all"
                                    style={{ colorScheme: 'dark' }}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-[#22c55e]/70 uppercase tracking-widest mb-2">Nueva Hora</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {HORAS.map(h => {
                                        const isOccupied = citas.some(c =>
                                            c.id !== selectedEvent.id &&
                                            format(c.fecha, 'yyyy-MM-dd') === modFecha &&
                                            c.hora_inicio === h
                                        )
                                        return (
                                            <button
                                                key={h}
                                                disabled={isOccupied}
                                                onClick={() => setModHora(h)}
                                                className={cn(
                                                    "py-3 rounded-2xl text-sm font-bold transition-all",
                                                    modHora === h
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
                            disabled={!modFecha || !modHora || modLoading}
                            className="w-full py-4 bg-[#14532d] border border-[#22c55e]/40 text-white rounded-2xl font-black text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                            style={{ boxShadow: '0 0 15px rgba(34,197,94,0.2)' }}
                        >
                            {modLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirmar nueva hora'}
                        </button>
                    </div>
                </div>
            )}


            {/* ── MODAL: ANULAR ─────────────────────────────────────────────── */}
            {showCancelModal && selectedEvent && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[80] flex items-center justify-center p-6">
                    <div className="bg-[#111318] border border-red-500/20 w-full max-w-xs rounded-3xl p-8 shadow-2xl text-center">
                        <div className="w-16 h-16 bg-red-500/10 text-red-400 rounded-full flex items-center justify-center mx-auto mb-5 border border-red-500/20">
                            <AlertCircle className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-black text-white mb-2">¿Cancelar cita?</h3>
                        <p className="text-white/40 text-sm mb-2 leading-relaxed">
                            El {format(selectedEvent.fecha, 'd MMMM', { locale: es })} a las {selectedEvent.hora_inicio}
                        </p>
                        <p className="text-white/20 text-xs mb-8">Esta acción no se puede deshacer.</p>
                        <div className="flex gap-3">
                            <button
                                onClick={handleCancelar}
                                disabled={cancelLoading}
                                className="flex-1 py-4 bg-red-500 text-white rounded-2xl font-black text-sm shadow-lg flex items-center justify-center gap-2 disabled:opacity-60"
                            >
                                {cancelLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sí, cancelar'}
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

export default Calendario
