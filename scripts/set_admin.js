import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function setAdmin() {
    console.log("Actualizando admin@gmail.com a rol admin...")
    const { data, error } = await supabase
        .from('usuarios')
        .update({ rol: 'admin' })
        .eq('email', 'admin@gmail.com')

    if (error) {
        console.error("Error:", error)
    } else {
        console.log("Éxito. Usuarios actualizados para admin@gmail.com")
    }

    console.log("Actualizando josue@gmail.com a rol admin...")
    const { data: d2, error: e2 } = await supabase
        .from('usuarios')
        .update({ rol: 'admin' })
        .eq('email', 'josue@gmail.com')

    if (e2) {
        console.error("Error:", e2)
    } else {
        console.log("Éxito. Usuarios actualizados para josue@gmail.com")
    }
}

setAdmin()
