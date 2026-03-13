import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function setCliente() {
    console.log("Actualizando josue@gmail.com a rol cliente...")
    const { data, error } = await supabase
        .from('usuarios')
        .update({ rol: 'cliente' })
        .eq('email', 'josue@gmail.com')

    if (error) {
        console.error("Error:", error)
    } else {
        console.log("Éxito. josue@gmail.com ahora es cliente.")
    }
}

setCliente()
