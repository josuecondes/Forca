import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import BottomNav from '../components/BottomNav'
import Calendario from './Calendario'
import Reservas from './Reservas'
import Perfil from './Perfil'

const ClienteDashboard = () => {
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
