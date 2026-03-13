import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !ANON_KEY) {
    console.error('Faltan variables de entorno.')
    process.exit(1)
}

const supabase = createClient(SUPABASE_URL, ANON_KEY)

const CLIENTES = [
    { nombre: 'Ana García', email: 'ana.garcia@test.com' },
    { nombre: 'Carlos Rodríguez', email: 'carlos.rodriguez@test.com' },
    { nombre: 'Elena Martínez', email: 'elena.martinez@test.com' },
    { nombre: 'David Sánchez', email: 'david.sanchez@test.com' },
    { nombre: 'Sofía Pérez', email: 'sofia.perez@test.com' },
    { nombre: 'Javier Ruiz', email: 'javier.ruiz@test.com' },
    { nombre: 'Paula Castro', email: 'paula.castro@test.com' },
    { nombre: 'Diego Gómez', email: 'diego.gomez@test.com' },
]

const PASSWORD = 'Evidentia123!'

// Horas disponibles en formato correcto 09:00..19:00
const HORAS = Array.from({ length: 11 }, (_, i) => `${String(i + 9).padStart(2, '0')}:00`)

function randomItem(arr) { return arr[Math.floor(Math.random() * arr.length)] }
function futureDate(daysAhead) {
    const d = new Date()
    d.setDate(d.getDate() + daysAhead)
    return d.toISOString().split('T')[0]
}

async function seed() {
    console.log('🌱 Iniciando seeding con Service Role Key...')
    const userIds = []

    // ── 1. Crear o recuperar usuarios de Auth ──────────────────────────────
    for (const c of CLIENTES) {
        // Intentar crear usuario en auth.users
        const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
            email: c.email,
            password: PASSWORD,
            email_confirm: true
        })

        let uid
        if (authErr) {
            if (authErr.message.includes('already been registered') || authErr.message.includes('already exists')) {
                // Buscar el usuario existente
                const { data: list } = await supabase.auth.admin.listUsers()
                const existing = list?.users?.find(u => u.email === c.email)
                if (existing) { uid = existing.id; console.log(`⚠️  Ya existe: ${c.email} (${uid})`) }
                else { console.error(`✗  No se pudo recuperar: ${c.email}`); continue }
            } else {
                console.error(`✗  Error creando ${c.email}:`, authErr.message)
                continue
            }
        } else {
            uid = authData.user.id
            console.log(`✓  Auth creado: ${c.email} (${uid})`)
        }

        userIds.push({ uid, ...c })

        // ── 2. Upsert en tabla usuarios ────────────────────────────────────
        const { error: dbErr } = await supabase.from('usuarios').upsert({
            id: uid,
            nombre: c.nombre,
            email: c.email,
            rol: 'cliente'
        })
        if (dbErr) console.error(`  ⚠ DB usuarios error para ${c.nombre}:`, dbErr.message)
        else console.log(`  ✓ Perfil en DB: ${c.nombre}`)
    }

    console.log(`\n📅 Creando citas para ${userIds.length} usuarios...`)

    // ── 3. Crear citas repartidas en los próximos 5 días ───────────────────
    // Para no solapar: llevamos registro de [fecha, hora] ocupados
    const ocupados = new Set()

    for (const { uid, nombre } of userIds) {
        // Cada usuario tiene entre 1 y 2 citas
        const numCitas = Math.random() > 0.4 ? 2 : 1
        let creados = 0
        let intentos = 0

        while (creados < numCitas && intentos < 20) {
            intentos++
            const dias = Math.floor(Math.random() * 7) + 1  // 1..7 días
            const fecha = futureDate(dias)
            const hora = randomItem(HORAS)
            const key = `${fecha}_${hora}`

            if (ocupados.has(key)) continue
            ocupados.add(key)

            const horaFin = `${String(parseInt(hora) + 1).padStart(2, '0')}:00`
            const { error } = await supabase.from('citas').insert({
                usuario_id: uid,
                fecha,
                hora_inicio: hora,
                hora_fin: horaFin,
                estado: 'confirmada',
                notas: `Cita generada para ${nombre}`
            })
            if (error) console.error(`  ⚠ Cita error (${nombre}):`, error.message)
            else { console.log(`  ✓ Cita: ${nombre} → ${fecha} ${hora}`); creados++ }
        }
    }

    console.log('\n✨ Seeding completado.')
    console.log(`\nUsuarios de prueba (contraseña: ${PASSWORD}):`)
    CLIENTES.forEach(c => console.log(`  ${c.email}`))
}

seed()
