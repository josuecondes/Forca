import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import BottomNav from '../components/BottomNav'
import Calendario from './SharedCalendar'
import Reservas from './Reservas'
import Perfil from './Perfil'

const ClienteDashboard = () => {
    const { signOut } = useAuth()

    return (
        <div style={{
            height: '100dvh',
            width: '100%',
            background: '#eef0f5',
            display: 'flex',
            flexDirection: 'column',
            fontFamily: "'Montserrat', -apple-system, BlinkMacSystemFont, sans-serif",
            position: 'relative',
            overflow: 'hidden',
        }}>
            {/* Botón Salir Global */}
            <button
                onClick={signOut}
                style={{
                    position: 'absolute',
                    top: 'max(16px, env(safe-area-inset-top, 16px))',
                    right: 16,
                    zIndex: 100,
                    padding: '8px 16px',
                    background: '#2b47c9',
                    color: '#ffffff',
                    borderRadius: 12,
                    fontSize: 12,
                    fontWeight: 900,
                    border: '1px solid #1e34a6',
                    boxShadow: '0 4px 12px rgba(43,71,201,0.2)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                }}>
                SALIR
            </button>
            {/* Área de contenido con scroll */}
            <div style={{
                flex: 1,
                overflowY: 'auto',
                overflowX: 'hidden',
                paddingBottom: 'calc(72px + env(safe-area-inset-bottom))',
                paddingTop: 'env(safe-area-inset-top)',
            }}>
                <Routes>
                    <Route path="calendario" element={<Calendario />} />
                    <Route path="reservas"   element={<Reservas />} />
                    <Route path="perfil"     element={<Perfil />} />
                    <Route path="/"          element={<Navigate to="calendario" />} />
                </Routes>
            </div>

            <BottomNav />
        </div>
    )
}

export default ClienteDashboard
