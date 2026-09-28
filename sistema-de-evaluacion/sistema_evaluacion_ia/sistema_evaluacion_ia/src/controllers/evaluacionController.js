import { pool } from "../config/database.js"

const crearEvaluacion = async (req, res) => {
    try {
        const {
            titulo,
            descripcion,
            fecha,
            tipo
        } = req.body

        if (!titulo || !descripcion || !fecha || !tipo) {
            return res.status(400).json({
                mensaje: "Faltan campos obligatorios"
            })
        }

        const [resultado] = await pool.query(
            `
            INSERT INTO evaluacion (
                titulo,
                descripcion,
                fecha,
                tipo
            )
            VALUES (?, ?, ?, ?)
            `,
            [
                titulo,
                descripcion,
                fecha,
                tipo
            ]
        )

        return res.status(201).json({
            mensaje: "Evaluación creada correctamente",
            id_evaluacion: resultado.insertId
        })

    } catch (error) {
        console.error(error)

        return res.status(500).json({
            mensaje: "Error interno del servidor"
        })
    }
}

const agregarPreguntaAEvaluacion = async (req, res) => {
    try {
        const { id, idConsigna } = req.params

        // Verificar que la evaluación exista
        const [evaluaciones] = await pool.query(
            `
            SELECT id_evaluacion
            FROM evaluacion
            WHERE id_evaluacion = ?
            `,
            [id]
        )

        if (evaluaciones.length === 0) {
            return res.status(404).json({
                mensaje: "Evaluación no encontrada"
            })
        }

        // Verificar que la pregunta exista
        const [consignas] = await pool.query(
            `
            SELECT id_consigna
            FROM consigna
            WHERE id_consigna = ?
            `,
            [idConsigna]
        )

        if (consignas.length === 0) {
            return res.status(404).json({
                mensaje: "Pregunta no encontrada"
            })
        }
         
        const [cantidadPreguntas] = await pool.query(
    `
    SELECT COUNT(*) AS cantidad
    FROM evaluacion_consigna
    WHERE evaluacion_id_evaluacion = ?
    `,
    [id]
)

    if (cantidadPreguntas[0].cantidad >= 50) {
     return res.status(400).json({
        mensaje: "La evaluación ya tiene el máximo de 50 preguntas"
    })
    }
    
    // Verificar que la pregunta no esté ya asociada
        const [asociacionExistente] = await pool.query(
            `
            SELECT *
            FROM evaluacion_consigna
            WHERE evaluacion_id_evaluacion = ?
            AND consigna_id_consigna = ?
            `,
            [id, idConsigna]
        )

        if (asociacionExistente.length > 0) {
            return res.status(409).json({
                mensaje: "La pregunta ya está asociada a esta evaluación"
            })
        }

        // Asociar pregunta con evaluación
        await pool.query(
            `
            INSERT INTO evaluacion_consigna (
                evaluacion_id_evaluacion,
                consigna_id_consigna
            )
            VALUES (?, ?)
            `,
            [id, idConsigna]
        )

        return res.status(201).json({
            mensaje: "Pregunta agregada a la evaluación correctamente"
        })

    } catch (error) {
        console.error(error)

        return res.status(500).json({
            mensaje: "Error interno del servidor"
        })
    }
}

const obtenerPreguntasDeEvaluacion = async (req, res) => {
    try {
        const { id } = req.params

        // Verificar que la evaluación exista
        const [evaluaciones] = await pool.query(
            `
            SELECT id_evaluacion
            FROM evaluacion
            WHERE id_evaluacion = ?
            `,
            [id]
        )

        if (evaluaciones.length === 0) {
            return res.status(404).json({
                mensaje: "Evaluación no encontrada"
            })
        }

        // Obtener las preguntas asociadas
        const [preguntas] = await pool.query(
            `
            SELECT
                c.id_consigna,
                c.consigna,
                c.respuesta_correcta
            FROM evaluacion_consigna ec
            INNER JOIN consigna c
                ON c.id_consigna = ec.consigna_id_consigna
            WHERE ec.evaluacion_id_evaluacion = ?
            ORDER BY c.id_consigna
            `,
            [id]
        )

        return res.status(200).json({
            preguntas
        })

    } catch (error) {
        console.error(error)

        return res.status(500).json({
            mensaje: "Error interno del servidor"
        })
    }
}

const eliminarPreguntaDeEvaluacion = async (req, res) => {
    try {
        const { id, idConsigna } = req.params

        const [resultado] = await pool.query(
            `
            DELETE FROM evaluacion_consigna
            WHERE evaluacion_id_evaluacion = ?
            AND consigna_id_consigna = ?
            `,
            [id, idConsigna]
        )

        if (resultado.affectedRows === 0) {
            return res.status(404).json({
                mensaje: "La pregunta no está asociada a esta evaluación"
            })
        }

        return res.status(200).json({
            mensaje: "Pregunta eliminada de la evaluación correctamente"
        })

    } catch (error) {
        console.error(error)

        return res.status(500).json({
            mensaje: "Error interno del servidor"
        })
    }
}

export {
    crearEvaluacion,
    agregarPreguntaAEvaluacion,
    obtenerPreguntasDeEvaluacion,
    eliminarPreguntaDeEvaluacion
}