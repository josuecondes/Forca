import React from 'react'
import { NavLink } from 'react-router-dom'
import { Calendar, BookOpen, User } from 'lucide-react'

const BottomNav = () => {
    return (
        <nav style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            background: '#ffffff',
            borderTop: '1px solid #e2e6f0',
            display: 'flex',
            justifyContent: 'space-around',
            alignItems: 'center',
            paddingTop: 8,
            paddingBottom: 'calc(10px + env(safe-area-inset-bottom))',
            zIndex: 100,
            boxShadow: '0 -2px 16px rgba(30,50,120,0.08)',
        }}>
            <NavLink
                to="/cliente/calendario"
                style={{ textDecoration: 'none' }}
            >
                {({ isActive }) => (
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 4,
                    }}>
                        <div style={{
                            width: 46,
                            height: 34,
                            borderRadius: 10,
                            backgroundColor: isActive ? '#2b47c9' : 'transparent',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'background 0.2s',
                        }}>
                            <Calendar
                                size={22}
                                color={isActive ? '#ffffff' : '#8a96b8'}
                                strokeWidth={2}
                            />
                        </div>
                        <span style={{
                            fontSize: 10,
                            fontWeight: 700,
                            letterSpacing: '0.06em',
                            textTransform: 'uppercase',
                            color: isActive ? '#2b47c9' : '#8a96b8',
                            fontFamily: "'Montserrat', sans-serif",
                        }}>
                            Calendario
                        </span>
                    </div>
                )}
            </NavLink>

            <NavLink
                to="/cliente/reservas"
                style={{ textDecoration: 'none' }}
            >
                {({ isActive }) => (
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 4,
                    }}>
                        <div style={{
                            width: 46,
                            height: 34,
                            borderRadius: 10,
                            backgroundColor: isActive ? '#2b47c9' : 'transparent',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'background 0.2s',
                        }}>
                            <BookOpen
                                size={22}
                                color={isActive ? '#ffffff' : '#8a96b8'}
                                strokeWidth={2}
                            />
                        </div>
                        <span style={{
                            fontSize: 10,
                            fontWeight: 700,
                            letterSpacing: '0.06em',
                            textTransform: 'uppercase',
                            color: isActive ? '#2b47c9' : '#8a96b8',
                            fontFamily: "'Montserrat', sans-serif",
                        }}>
                            Reservas
                        </span>
                    </div>
                )}
            </NavLink>

            <NavLink
                to="/cliente/perfil"
                style={{ textDecoration: 'none' }}
            >
                {({ isActive }) => (
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 4,
                    }}>
                        <div style={{
                            width: 46,
                            height: 34,
                            borderRadius: 10,
                            backgroundColor: isActive ? '#2b47c9' : 'transparent',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'background 0.2s',
                        }}>
                            <User
                                size={22}
                                color={isActive ? '#ffffff' : '#8a96b8'}
                                strokeWidth={2}
                            />
                        </div>
                        <span style={{
                            fontSize: 10,
                            fontWeight: 700,
                            letterSpacing: '0.06em',
                            textTransform: 'uppercase',
                            color: isActive ? '#2b47c9' : '#8a96b8',
                            fontFamily: "'Montserrat', sans-serif",
                        }}>
                            Perfil
                        </span>
                    </div>
                )}
            </NavLink>
        </nav>
    )
}

export default BottomNav
