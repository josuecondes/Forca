import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import InstallPWA from '../components/InstallPWA'
import { Eye, EyeOff, Headset } from 'lucide-react'

/* ─── Patrón de fondo: rombos/triángulos sutiles como la imagen ─── */
const bgStyle = {
    minHeight: '100dvh',
    background: '#d0d4de',
    backgroundImage: `
        linear-gradient(135deg, #c8ccd8 25%, transparent 25%),
        linear-gradient(225deg, #c8ccd8 25%, transparent 25%),
        linear-gradient(45deg,  #c8ccd8 25%, transparent 25%),
        linear-gradient(315deg, #c8ccd8 25%, #d0d4de 25%)
    `,
    backgroundSize: '20px 20px',
    backgroundPosition: '10px 0, 10px 0, 0 0, 0 0',
    fontFamily: "'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 24px',
    position: 'relative',
    overflow: 'hidden',
}

const Login = () => {
    const [isRegistering, setIsRegistering] = useState(false)
    const [nombre, setNombre] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const { signIn, signUp, signInWithGoogle } = useAuth()
    const navigate = useNavigate()

    React.useEffect(() => {
        window.history.pushState(null, null, window.location.href)
        const handlePopState = () => {
            window.history.pushState(null, null, window.location.href)
            const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone
            if (isStandalone) window.close()
        }
        window.addEventListener('popstate', handlePopState)
        return () => window.removeEventListener('popstate', handlePopState)
    }, [])

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError('')
        try {
            if (isRegistering) {
                const { error: signUpError } = await signUp({
                    email,
                    password,
                    options: { data: { full_name: nombre } }
                })
                if (signUpError) throw signUpError
                alert('Registro completado con éxito. Ahora puedes iniciar sesión.')
                setIsRegistering(false)
                setNombre('')
                setPassword('')
            } else {
                const { error: loginError } = await signIn({ email, password })
                if (loginError) throw loginError
                navigate('/home')
            }
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div style={bgStyle}>

            {/* ── Cabecera ── */}
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                marginBottom: 20,
                gap: 4,
            }}>
                {/* BIENVENIDO */}
                <p style={{
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: '0.35em',
                    textTransform: 'uppercase',
                    color: '#6b7a99',
                    margin: 0,
                }}>
                    BIENVENIDO
                </p>

                {/* FORÇA */}
                <h1 style={{
                    fontSize: 52,
                    fontWeight: 900,
                    fontStyle: 'italic',
                    color: '#2b47c9',
                    margin: 0,
                    lineHeight: 1.05,
                    letterSpacing: '-0.02em',
                    fontFamily: "'Montserrat', sans-serif",
                }}>
                    FORÇA
                </h1>

                {/* Línea azul debajo del título */}
                <div style={{
                    width: 40,
                    height: 3,
                    background: '#2b47c9',
                    borderRadius: 2,
                    marginTop: 4,
                }} />
            </div>

            {/* ── Card ── */}
            <div style={{
                width: '100%',
                maxWidth: 320,
                background: 'rgba(230, 234, 242, 0.88)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                borderRadius: 28,
                padding: '28px 24px 28px',
                boxShadow: '0 8px 32px rgba(30, 50, 120, 0.13), 0 2px 8px rgba(30, 50, 120, 0.08)',
                border: '1px solid rgba(255,255,255,0.6)',
                display: 'flex',
                flexDirection: 'column',
                gap: 20,
            }}>

                {/* Título tarjeta */}
                <h2 style={{
                    fontSize: 22,
                    fontWeight: 800,
                    color: '#2b47c9',
                    margin: 0,
                    textAlign: 'center',
                }}>
                    {isRegistering ? 'Crear cuenta' : 'Iniciar Sesión'}
                </h2>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                    {/* Nombre (solo registro) */}
                    {isRegistering && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <label style={labelStyle}>Nombre completo</label>
                            <input
                                type="text"
                                required
                                placeholder="Tu nombre completo"
                                value={nombre}
                                onChange={e => setNombre(e.target.value)}
                                style={inputStyle}
                                onFocus={e => Object.assign(e.target.style, inputFocusStyle)}
                                onBlur={e => Object.assign(e.target.style, inputBlurStyle)}
                            />
                        </div>
                    )}

                    {/* Email */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <label style={labelStyle}>Usuario o Correo</label>
                        <input
                            type="email"
                            required
                            autoComplete="off"
                            placeholder="Introduce tu usuario"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="login-input"
                            style={inputStyle}
                            onFocus={e => Object.assign(e.target.style, inputFocusStyle)}
                            onBlur={e => Object.assign(e.target.style, inputBlurStyle)}
                        />
                    </div>

                    {/* Contraseña */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <label style={labelStyle}>Contraseña</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                required
                                placeholder="••••••••"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                style={{ ...inputStyle, paddingRight: 44 }}
                                autoComplete="current-password"
                                className="login-input"
                                onFocus={e => { e.target.style.borderColor = '#2b47c9'; e.target.style.boxShadow = '0 0 0 3px rgba(43,71,201,0.12)' }}
                                onBlur={e => { e.target.style.borderColor = '#d0d4de'; e.target.style.boxShadow = 'none' }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{
                                    position: 'absolute',
                                    right: 12,
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: '#8a96b8',
                                    padding: 0,
                                    display: 'flex',
                                    alignItems: 'center',
                                }}>
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>

                        {/* ¿Olvidaste tu contraseña? */}
                        {!isRegistering && (
                            <div style={{ textAlign: 'right' }}>
                                <Link to="/forgot-password" style={{
                                    fontSize: 12,
                                    color: '#2b47c9',
                                    fontWeight: 600,
                                    textDecoration: 'none',
                                }}>
                                    ¿Olvidaste tu contraseña?
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Error */}
                    {error && (
                        <p style={{
                            background: '#fef2f2',
                            color: '#dc2626',
                            border: '1px solid #fecaca',
                            borderRadius: 12,
                            padding: '10px 14px',
                            fontSize: 13,
                            margin: 0,
                            textAlign: 'center',
                        }}>
                            {error}
                        </p>
                    )}

                    {/* Botón ENTRAR */}
                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            background: loading ? '#4a63d8' : '#2b47c9',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: 14,
                            padding: '17px 0',
                            fontWeight: 800,
                            fontSize: 15,
                            letterSpacing: '0.12em',
                            textTransform: 'uppercase',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            width: '100%',
                            boxShadow: '0 4px 16px rgba(43,71,201,0.35)',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 10,
                            marginTop: 4,
                        }}
                        onMouseEnter={e => { if (!loading) { e.currentTarget.style.background = '#1e38b8'; e.currentTarget.style.boxShadow = '0 6px 22px rgba(43,71,201,0.45)'; e.currentTarget.style.transform = 'translateY(-1px)' } }}
                        onMouseLeave={e => { if (!loading) { e.currentTarget.style.background = '#2b47c9'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(43,71,201,0.35)'; e.currentTarget.style.transform = 'translateY(0)' } }}
                    >
                        {loading
                            ? <div style={{ width: 20, height: 20, border: '2.5px solid rgba(255,255,255,0.3)', borderTop: '2.5px solid white', borderRadius: '50%', animation: 'loginSpin 0.7s linear infinite' }} />
                            : 'ENTRAR'
                        }
                    </button>
                </form>

                {/* Botón Google — se muestra sutil solo en modo login */}
                {!isRegistering && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ flex: 1, height: 1, background: 'rgba(43,71,201,0.15)' }} />
                            <span style={{ fontSize: 10, fontWeight: 700, color: '#8a96b8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>o</span>
                            <div style={{ flex: 1, height: 1, background: 'rgba(43,71,201,0.15)' }} />
                        </div>
                        <button
                            type="button"
                            onClick={() => signInWithGoogle()}
                            style={{
                                background: 'rgba(255,255,255,0.7)',
                                border: '1px solid rgba(43,71,201,0.2)',
                                borderRadius: 12,
                                padding: '13px 0',
                                color: '#2b47c9',
                                fontWeight: 700,
                                fontSize: 14,
                                cursor: 'pointer',
                                width: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 10,
                                transition: 'all 0.2s',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.95)' }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.7)' }}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            Google
                        </button>
                    </div>
                )}
            </div>

            {/* ── Enlace Registro / Login ── */}
            <button
                type="button"
                onClick={() => { setIsRegistering(!isRegistering); setError('') }}
                style={{
                    marginTop: 20,
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 14,
                    color: '#4a5568',
                    fontFamily: "'Montserrat', sans-serif",
                    fontWeight: 500,
                }}
            >
                {isRegistering
                    ? <>¿Ya tienes cuenta? <span style={{ color: '#2b47c9', fontWeight: 800, textDecoration: 'underline', textUnderlineOffset: 3 }}>Inicia sesión</span></>
                    : <>¿No tienes cuenta? <span style={{ color: '#2b47c9', fontWeight: 800, textDecoration: 'underline', textUnderlineOffset: 3 }}>Regístrate aquí</span></>
                }
            </button>

            {/* ── Soporte Técnico ── */}
            <div style={{
                marginTop: 20,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                color: '#8a96b8',
                opacity: 0.8,
            }}>
                <Headset size={14} />
                <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    Soporte Técnico
                </span>
            </div>

            <InstallPWA />

            <style>{`
                @keyframes loginSpin {
                    to { transform: rotate(360deg); }
                }
                .login-input::placeholder {
                    color: #a0aec0;
                    font-style: italic;
                }
                .login-input:-webkit-autofill,
                .login-input:-webkit-autofill:hover,
                .login-input:-webkit-autofill:focus {
                    -webkit-box-shadow: 0 0 0px 1000px #ffffff inset !important;
                    -webkit-text-fill-color: #2b2f4a !important;
                    border-color: #d0d4de !important;
                }
            `}</style>
        </div>
    )
}

/* ── Estilos compartidos ── */
const labelStyle = {
    fontSize: 13,
    fontWeight: 700,
    color: '#3a4a6b',
    marginBottom: 2,
}

const inputStyle = {
    width: '100%',
    background: '#ffffff',
    border: '1.5px solid #d0d4de',
    borderRadius: 12,
    padding: '13px 14px',
    fontSize: 15,
    color: '#2b2f4a',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    fontFamily: "'Montserrat', sans-serif",
}

const inputFocusStyle = {
    borderColor: '#2b47c9',
    boxShadow: '0 0 0 3px rgba(43,71,201,0.12)',
}

const inputBlurStyle = {
    borderColor: '#d0d4de',
    boxShadow: 'none',
}

export default Login
