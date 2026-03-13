import { addDays, addHours, startOfDay, format } from 'date-fns'

export const generateMockData = () => {
    const clients = Array.from({ length: 10 }, (_, i) => ({
        id: crypto.randomUUID(),
        nombre: `Cliente Ejemplo ${i + 1}`,
        email: `cliente${i + 1}@evidentia.es`,
        rol: 'cliente',
        fecha_creacion: new Date().toISOString()
    }))

    const reservations = []
    const baseDate = startOfDay(new Date())

    clients.forEach((client, index) => {
        // 2-3 reservations per client
        const numRes = 2 + Math.floor(Math.random() * 2)
        for (let j = 0; j < numRes; j++) {
            const dayOffset = Math.floor(Math.random() * 14) - 7 // From -7 to +7 days
            const hourOffset = 9 + Math.floor(Math.random() * 10) // 9:00 to 18:00

            const date = addDays(baseDate, dayOffset)
            const startDate = addHours(date, hourOffset)
            const endDate = addHours(startDate, 1)

            reservations.push({
                id: reservations.length + 1,
                usuario_id: client.id,
                usuario_nombre: client.nombre,
                fecha: startDate,
                horaInicio: format(startDate, 'HH:00'),
                horaFin: format(endDate, 'HH:00'),
                estado: 'confirmada',
                notas: `Cita periódica para ${client.nombre}`
            })
        }
    })

    return { clients, reservations }
}
