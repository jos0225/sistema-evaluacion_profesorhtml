import { pool } from "../config/database.js"

const obtenerConsignas = async (req, res) => {
    try {
        const [consignas] = await pool.query(
            `
            SELECT
                id_consigna,
                consigna,
                respuesta_correcta
            FROM consigna
            ORDER BY id_consigna
            `
        )

        return res.status(200).json({
            consignas
        })

    } catch (error) {
        console.error(error)

        return res.status(500).json({
            mensaje: "Error interno del servidor"
        })
    }
}


const crearConsigna = async (req, res) => {
    try {
        const { consigna, respuesta_correcta } = req.body

        if (!consigna || !respuesta_correcta) {
            return res.status(400).json({
                mensaje: "Faltan campos obligatorios"
            })
        }

        const [resultado] = await pool.query(
            `
            INSERT INTO consigna (
                consigna,
                respuesta_correcta
            )
            VALUES (?, ?)
            `,
            [consigna, respuesta_correcta]
        )

        return res.status(201).json({
            mensaje: "Pregunta creada correctamente",
            id_consigna: resultado.insertId
        })

    } catch (error) {
        console.error(error)

        return res.status(500).json({
            mensaje: "Error interno del servidor"
        })
    }
}

const obtenerConsignaPorId = async (req, res) => {
    try {
        const { id } = req.params

        const [consignas] = await pool.query(
            `
            SELECT
                id_consigna,
                consigna,
                respuesta_correcta
            FROM consigna
            WHERE id_consigna = ?
            `,
            [id]
        )

        if (consignas.length === 0) {
            return res.status(404).json({
                mensaje: "Pregunta no encontrada"
            })
        }

        return res.status(200).json({
            consigna: consignas[0]
        })

    } catch (error) {
        console.error(error)

        return res.status(500).json({
            mensaje: "Error interno del servidor"
        })
    }
}

const actualizarConsigna = async (req, res) => {
    try {
        const { id } = req.params
        const { consigna, respuesta_correcta } = req.body

        if (!consigna || !respuesta_correcta) {
            return res.status(400).json({
                mensaje: "Faltan campos obligatorios"
            })
        }

        const [resultado] = await pool.query(
            `
            UPDATE consigna
            SET
                consigna = ?,
                respuesta_correcta = ?
            WHERE id_consigna = ?
            `,
            [consigna, respuesta_correcta, id]
        )

        if (resultado.affectedRows === 0) {
            return res.status(404).json({
                mensaje: "Pregunta no encontrada"
            })
        }

        return res.status(200).json({
            mensaje: "Pregunta actualizada correctamente"
        })

    } catch (error) {
        console.error(error)

        return res.status(500).json({
            mensaje: "Error interno del servidor"
        })
    }
}

const eliminarConsigna = async (req, res) => {
    try {
        const { id } = req.params

        const [resultado] = await pool.query(
            `
            DELETE FROM consigna
            WHERE id_consigna = ?
            `,
            [id]
        )

        if (resultado.affectedRows === 0) {
            return res.status(404).json({
                mensaje: "Pregunta no encontrada"
            })
        }

        return res.status(200).json({
            mensaje: "Pregunta eliminada correctamente"
        })

    } catch (error) {
        console.error(error)

        return res.status(500).json({
            mensaje: "Error interno del servidor"
        })
    }
}

export {
    obtenerConsignas,
    obtenerConsignaPorId,
    crearConsigna,
    actualizarConsigna,
    eliminarConsigna
}