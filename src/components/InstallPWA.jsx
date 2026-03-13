import React, { useState, useEffect } from 'react'
import { Download, X, Share } from 'lucide-react'

const InstallPWA = () => {
    const [supportsPWA, setSupportsPWA] = useState(false)
    const [promptInstall, setPromptInstall] = useState(null)
    const [isIOS, setIsIOS] = useState(false)
    const [isStandalone, setIsStandalone] = useState(false)
    const [isDismissed, setIsDismissed] = useState(false)

    useEffect(() => {
        // Detect if already installed/standalone
        const mqStandAlone = '(display-mode: standalone)'
        if (navigator.standalone || window.matchMedia(mqStandAlone).matches) {
            setIsStandalone(true)
            return
        }

        // Check if dismissed before
        if (localStorage.getItem('pwa_prompt_dismissed') === 'true') {
            setIsDismissed(true)
        }

        // Handle Android install prompt
        const handler = e => {
            e.preventDefault()
            setSupportsPWA(true)
            setPromptInstall(e)
        }
        window.addEventListener('beforeinstallprompt', handler)

        // Detect iOS
        const userAgent = window.navigator.userAgent.toLowerCase()
        const isIosDevice = /iphone|ipad|ipod/.test(userAgent)
        const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone

        if (isIosDevice && !isStandaloneMode) {
            setIsIOS(true)
        }

        return () => window.removeEventListener('beforeinstallprompt', handler)
    }, [])

    const handleInstall = async () => {
        if (!promptInstall) return
        promptInstall.prompt()
        const { outcome } = await promptInstall.userChoice
        if (outcome === 'accepted') {
            setIsStandalone(true)
        }
    }

    const handleDismiss = () => {
        setIsDismissed(true)
        localStorage.setItem('pwa_prompt_dismissed', 'true')
    }

    // Do not show if installed, dismissed, or neither supported OS detected
    if (isStandalone || isDismissed || (!supportsPWA && !isIOS)) {
        return null
    }

    return (
        <div className="fixed bottom-0 left-0 right-0 z-[100] p-4 pb-8 sm:pb-4 animate-in slide-in-from-bottom-full">
            <div className="bg-[#111318]/95 backdrop-blur-xl border border-[#22c55e]/30 p-5 rounded-3xl shadow-[0_0_40px_rgba(0,0,0,0.8)] max-w-sm mx-auto flex flex-col gap-3">

                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center shrink-0"
                            style={{ boxShadow: '0 0 15px rgba(34,197,94,0.1)' }}>
                            <img src="/evidentia-logo.png" alt="Icon" className="w-8 h-8 object-contain drop-shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                        </div>
                        <div>
                            <h4 className="text-white font-black text-sm">Instala Evidentia</h4>
                            {isIOS ? (
                                <p className="text-white/50 text-xs mt-0.5 leading-tight">Pulsa compartir <Share className="inline w-3 h-3 mx-0.5" /> y luego <br /> <strong className="text-white/80">Añadir a pantalla de inicio</strong>.</p>
                            ) : (
                                <p className="text-white/50 text-xs mt-0.5 leading-tight">Acceso directo y experiencia nativa sin distracciones.</p>
                            )}
                        </div>
                    </div>
                    <button onClick={handleDismiss} className="p-1.5 bg-white/5 rounded-full hover:bg-white/10 text-white/40 transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {!isIOS && (
                    <button
                        onClick={handleInstall}
                        className="w-full mt-2 bg-[#22c55e] text-white font-bold py-3 rounded-xl text-sm flex items-center justify-center gap-2 hover:bg-[#16a34a] transition-all"
                        style={{ boxShadow: '0 0 20px rgba(34,197,94,0.3)' }}
                    >
                        <Download className="w-4 h-4" /> Instalar App
                    </button>
                )}
            </div>
        </div>
    )
}

export default InstallPWA
