import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Error: Faltan variables de entorno en .env.local')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

const clientes = [
    { nombre: 'Ana García', email: 'ana@example.com', rol: 'cliente' },
    { nombre: 'Carlos Rodríguez', email: 'carlos@example.com', rol: 'cliente' },
    { nombre: 'Lucía Fernández', email: 'lucia@example.com', rol: 'cliente' },
    { nombre: 'Marcos López', email: 'marcos@example.com', rol: 'cliente' },
    { nombre: 'Elena Martínez', email: 'elena@example.com', rol: 'cliente' },
    { nombre: 'David Sánchez', email: 'david@example.com', rol: 'cliente' },
    { nombre: 'Sofía Pérez', email: 'sofia@example.com', rol: 'cliente' },
    { nombre: 'Javier Ruiz', email: 'javier@example.com', rol: 'cliente' },
    { nombre: 'Paula Castro', email: 'paula@example.com', rol: 'cliente' },
    { nombre: 'Diego Gómez', email: 'diego@example.com', rol: 'cliente' }
]

async function seed() {
    console.log('🌱 Iniciando seeding de clientes y citas...')

    for (const cliente of clientes) {
        // 1. Insertar en la tabla 'usuarios' (simulado, ya que auth.users es interno)
        // Usamos un UUID generado aleatoriamente para las pruebas
        const tempId = crypto.randomUUID()

        const { error: userError } = await supabase
            .from('usuarios')
            .upsert([{
                id: tempId,
                nombre: cliente.nombre,
                email: cliente.email,
                rol: 'cliente'
            }])

        if (userError) {
            console.error(`Error insertando usuario ${cliente.nombre}:`, userError.message)
            continue
        }

        // 2. Insertar una cita para cada uno
        const fecha = new Date()
        fecha.setDate(fecha.getDate() + Math.floor(Math.random() * 5)) // Próximos 5 días

        const hora = `${9 + Math.floor(Math.random() * 8)}:00`.padStart(5, '0')
        const horaFin = `${parseInt(hora.split(':')[0]) + 1}:00`.padStart(5, '0')

        const { error: citaError } = await supabase
            .from('citas')
            .insert([{
                usuario_id: tempId,
                fecha: fecha.toISOString().split('T')[0],
                hora_inicio: hora,
                hora_fin: horaFin,
                estado: 'confirmada',
                notas: 'Cita generada automáticamente'
            }])

        if (citaError) {
            console.error(`Error insertando cita para ${cliente.nombre}:`, citaError.message)
        } else {
            console.log(`✅ Creado cliente ${cliente.nombre} con cita el ${fecha.toLocaleDateString()}`)
        }
    }

    console.log('✨ Seeding completado.')
}

seed()
