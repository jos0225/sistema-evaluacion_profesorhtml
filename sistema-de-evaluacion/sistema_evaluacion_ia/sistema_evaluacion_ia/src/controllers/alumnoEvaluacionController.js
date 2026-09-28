import { pool } from "../config/database.js"
import fs from "fs/promises"

const obtenerMiPerfil = async (req, res) => {
    try {
        const idLogin = req.user.id

        const [usuarios] = await pool.query(
            `
            SELECT
                l.id_login,
                l.usuario,
                l.rol,
                l.alumno_cedula_alumno,
                a.cedula_alumno,
                a.nombre,
                a.apellido,
                a.correo
            FROM login l
            INNER JOIN alumno a
                ON a.cedula_alumno = l.alumno_cedula_alumno
            WHERE l.id_login = ?
            AND l.rol = 'alumno'
            `,
            [idLogin]
        )

        if (usuarios.length === 0) {
            return res.status(404).json({
                mensaje: "No se encontró el alumno"
            })
        }

        return res.status(200).json({
            alumno: usuarios[0]
        })

    } catch (error) {
        console.error(error)

        return res.status(500).json({
            mensaje: "Error interno del servidor"
        })
    }
}

const obtenerEvaluaciones = async (req, res) => {
    try {
        const idLogin = req.user.id

        const [evaluaciones] = await pool.query(
            `
            SELECT DISTINCT
                e.id_evaluacion,
                e.titulo,
                e.descripcion,
                e.fecha,
                e.tipo
            FROM evaluacion e
            INNER JOIN evaluacion_consigna ec
                ON ec.evaluacion_id_evaluacion = e.id_evaluacion
            INNER JOIN login l
                ON l.id_login = ?
            WHERE l.rol = 'alumno'
            ORDER BY e.fecha
            `,
            [idLogin]
        )

        return res.status(200).json({
            evaluaciones
        })

    } catch (error) {
        console.error(error)

        return res.status(500).json({
            mensaje: "Error interno del servidor"
        })
    }
}

const iniciarEvaluacion = async (req, res) => {
    try {
        const idLogin = req.user.id
        const { id } = req.params

        // Buscar al alumno autenticado
        const [alumnos] = await pool.query(
            `
            SELECT
                a.cedula_alumno,
                a.nombre,
                a.apellido
            FROM login l
            INNER JOIN alumno a
                ON a.cedula_alumno = l.alumno_cedula_alumno
            WHERE l.id_login = ?
            AND l.rol = 'alumno'
            `,
            [idLogin]
        )

        if (alumnos.length === 0) {
            return res.status(404).json({
                mensaje: "No se encontró el alumno"
            })
        }

        const alumno = alumnos[0]

        // Buscar la evaluación
        const [evaluaciones] = await pool.query(
            `
            SELECT
                id_evaluacion,
                titulo,
                descripcion,
                fecha,
                tipo
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

        const evaluacion = evaluaciones[0]

        // Comprobar si el alumno ya inició esta evaluación
        const [asignacionesExistentes] = await pool.query(
            `
            SELECT
                id_asignacion,
                consigna_id_consigna,
                estado
            FROM alumno_consigna
            WHERE alumno_cedula_alumno = ?
            AND evaluacion_id_evaluacion = ?
            `,
            [alumno.cedula_alumno, id]
        )

        // Si ya existe, devolver las mismas preguntas
        if (asignacionesExistentes.length > 0) {

            const [preguntasAsignadas] = await pool.query(
                `
                SELECT
                    ac.id_asignacion,
                    ac.consigna_id_consigna,
                    ac.estado,
                    c.consigna
                FROM alumno_consigna ac
                INNER JOIN consigna c
                    ON c.id_consigna = ac.consigna_id_consigna
                WHERE ac.alumno_cedula_alumno = ?
                AND ac.evaluacion_id_evaluacion = ?
                ORDER BY ac.id_asignacion
                `,
                [alumno.cedula_alumno, id]
            )

            return res.status(200).json({
                mensaje: "La evaluación ya fue iniciada",
                preguntas_asignadas: preguntasAsignadas
            })
        }

        // Obtener 20 preguntas aleatorias de la evaluación
        const [preguntas] = await pool.query(
            `
            SELECT
                consigna_id_consigna
            FROM evaluacion_consigna
            WHERE evaluacion_id_evaluacion = ?
            ORDER BY RAND()
            LIMIT 20
            `,
            [id]
        )

        // Verificar que haya al menos 20 preguntas
        if (preguntas.length < 20) {
            return res.status(400).json({
                mensaje: "La evaluación no tiene suficientes preguntas",
                preguntas_disponibles: preguntas.length,
                preguntas_necesarias: 20
            })
        }

        // Crear conexión para realizar la transacción
        const connection = await pool.getConnection()

        try {
            await connection.beginTransaction()

            // Guardar las 20 preguntas seleccionadas
            for (const pregunta of preguntas) {
                await connection.query(
                    `
                    INSERT INTO alumno_consigna (
                        estado,
                        consigna_id_consigna,
                        alumno_cedula_alumno,
                        evaluacion_id_evaluacion
                    )
                    VALUES (?, ?, ?, ?)
                    `,
                    [
                        "pendiente",
                        pregunta.consigna_id_consigna,
                        alumno.cedula_alumno,
                        id
                    ]
                )
            }

            // Registrar que el alumno inició la evaluación
            await connection.query(
                `
                INSERT INTO alumno_evaluacion (
                    alumno_cedula_alumno,
                    evaluacion_id_evaluacion,
                    estado,
                    fecha_inicio
                )
                VALUES (?, ?, ?, NOW())
                `,
                [
                    alumno.cedula_alumno,
                    id,
                    "en_progreso"
                ]
            )

            await connection.commit()

        } catch (error) {
            await connection.rollback()
            throw error

        } finally {
            connection.release()
        }

        // Obtener las preguntas asignadas con su texto
        const [preguntasAsignadas] = await pool.query(
            `
            SELECT
                ac.id_asignacion,
                ac.estado,
                ac.consigna_id_consigna,
                c.consigna
            FROM alumno_consigna ac
            INNER JOIN consigna c
                ON c.id_consigna = ac.consigna_id_consigna
            WHERE ac.alumno_cedula_alumno = ?
            AND ac.evaluacion_id_evaluacion = ?
            ORDER BY ac.id_asignacion
            `,
            [alumno.cedula_alumno, id]
        )

        return res.status(201).json({
            mensaje: "Evaluación iniciada correctamente",
            alumno,
            evaluacion,
            preguntas_asignadas: preguntasAsignadas
        })

    } catch (error) {
        console.error(error)

        return res.status(500).json({
            mensaje: "Error interno del servidor"
        })
    }
}

const guardarRespuesta = async (req, res) => {
    try {
        const idLogin = req.user.id
        const { id } = req.params
        const { respuesta } = req.body

        // Verificar que se haya enviado una respuesta
        if (!respuesta) {
            return res.status(400).json({
                mensaje: "La respuesta es obligatoria"
            })
        }

        // Buscar al alumno autenticado
        const [alumnos] = await pool.query(
            `
            SELECT
                a.cedula_alumno
            FROM login l
            INNER JOIN alumno a
                ON a.cedula_alumno = l.alumno_cedula_alumno
            WHERE l.id_login = ?
            AND l.rol = 'alumno'
            `,
            [idLogin]
        )

        if (alumnos.length === 0) {
            return res.status(404).json({
                mensaje: "No se encontró el alumno"
            })
        }

        const alumno = alumnos[0]

        // Buscar la asignación y comprobar que pertenece al alumno
        const [asignaciones] = await pool.query(
            `
            SELECT
                ac.id_asignacion,
                ac.evaluacion_id_evaluacion,
                ac.estado
            FROM alumno_consigna ac
            WHERE ac.id_asignacion = ?
            AND ac.alumno_cedula_alumno = ?
            `,
            [id, alumno.cedula_alumno]
        )

        if (asignaciones.length === 0) {
            return res.status(404).json({
                mensaje: "No se encontró la pregunta asignada al alumno"
            })
        }

        const asignacion = asignaciones[0]

        // Comprobar que la evaluación del alumno exista
        const [evaluacionesAlumno] = await pool.query(
            `
            SELECT estado
            FROM alumno_evaluacion
            WHERE alumno_cedula_alumno = ?
            AND evaluacion_id_evaluacion = ?
            `,
            [
                alumno.cedula_alumno,
                asignacion.evaluacion_id_evaluacion
            ]
        )

        if (evaluacionesAlumno.length === 0) {
            return res.status(404).json({
                mensaje: "No se encontró el registro de la evaluación"
            })
        }

        // No permitir respuestas después de finalizar
        if (evaluacionesAlumno[0].estado === "finalizada") {
            return res.status(400).json({
                mensaje: "La evaluación ya fue finalizada"
            })
        }

        // Comprobar si ya existe una respuesta para esta pregunta
        const [respuestasExistentes] = await pool.query(
            `
            SELECT
                id_respuesta
            FROM respuesta
            WHERE alumno_consigna_id_asignacion = ?
            `,
            [id]
        )

        if (respuestasExistentes.length > 0) {
            return res.status(409).json({
                mensaje: "Esta pregunta ya fue respondida"
            })
        }

        // Guardar la respuesta
        const [resultado] = await pool.query(
            `
            INSERT INTO respuesta (
                respuesta,
                nota_final,
                alumno_cedula_alumno,
                evaluacion_id_evaluacion,
                alumno_consigna_id_asignacion
            )
            VALUES (?, NULL, ?, ?, ?)
            `,
            [
                respuesta,
                alumno.cedula_alumno,
                asignacion.evaluacion_id_evaluacion,
                asignacion.id_asignacion
            ]
        )

        // Actualizar el estado de la asignación
        await pool.query(
            `
            UPDATE alumno_consigna
            SET estado = 'respondida'
            WHERE id_asignacion = ?
            `,
            [id]
        )

        return res.status(201).json({
            mensaje: "Respuesta guardada correctamente",
            id_respuesta: resultado.insertId,
            id_asignacion: asignacion.id_asignacion
        })

    } catch (error) {
        console.error(error)

        return res.status(500).json({
            mensaje: "Error interno del servidor"
        })
    }
}

const obtenerProgresoEvaluacion = async (req, res) => {
    try {
        const idLogin = req.user.id
        const { id } = req.params

        // Buscar al alumno autenticado
        const [alumnos] = await pool.query(
            `
            SELECT
                a.cedula_alumno
            FROM login l
            INNER JOIN alumno a
                ON a.cedula_alumno = l.alumno_cedula_alumno
            WHERE l.id_login = ?
            AND l.rol = 'alumno'
            `,
            [idLogin]
        )

        if (alumnos.length === 0) {
            return res.status(404).json({
                mensaje: "No se encontró el alumno"
            })
        }

        const alumno = alumnos[0]

        // Obtener las preguntas asignadas de la evaluación
        const [progreso] = await pool.query(
            `
            SELECT
                ac.id_asignacion,
                ac.consigna_id_consigna,
                ac.estado,
                c.consigna
            FROM alumno_consigna ac
            INNER JOIN consigna c
                ON c.id_consigna = ac.consigna_id_consigna
            WHERE ac.alumno_cedula_alumno = ?
            AND ac.evaluacion_id_evaluacion = ?
            ORDER BY ac.id_asignacion
            `,
            [alumno.cedula_alumno, id]
        )

        if (progreso.length === 0) {
            return res.status(404).json({
                mensaje: "El alumno no tiene esta evaluación iniciada"
            })
        }

        // Contar preguntas respondidas
        const respondidas = progreso.filter(
            pregunta => pregunta.estado === "respondida"
        ).length

        return res.status(200).json({
            evaluacion_id: Number(id),
            total_preguntas: progreso.length,
            respondidas,
            pendientes: progreso.length - respondidas,
            preguntas: progreso
        })

    } catch (error) {
        console.error(error)

        return res.status(500).json({
            mensaje: "Error interno del servidor"
        })
    }
}

const finalizarEvaluacion = async (req, res) => {
    try {
        const idLogin = req.user.id
        const { id } = req.params

        // Buscar al alumno autenticado
        const [alumnos] = await pool.query(
            `
            SELECT
                a.cedula_alumno
            FROM login l
            INNER JOIN alumno a
                ON a.cedula_alumno = l.alumno_cedula_alumno
            WHERE l.id_login = ?
            AND l.rol = 'alumno'
            `,
            [idLogin]
        )

        if (alumnos.length === 0) {
            return res.status(404).json({
                mensaje: "No se encontró el alumno"
            })
        }

        const alumno = alumnos[0]

        // Obtener las preguntas asignadas
        const [asignaciones] = await pool.query(
            `
            SELECT
                id_asignacion,
                estado
            FROM alumno_consigna
            WHERE alumno_cedula_alumno = ?
            AND evaluacion_id_evaluacion = ?
            `,
            [alumno.cedula_alumno, id]
        )

        if (asignaciones.length === 0) {
            return res.status(404).json({
                mensaje: "El alumno no tiene esta evaluación iniciada"
            })
        }

        // Verificar si quedaron preguntas sin responder
        const pendientes = asignaciones.filter(
            asignacion => asignacion.estado === "pendiente"
        )

        if (pendientes.length > 0) {
            return res.status(400).json({
                mensaje: "No se puede finalizar la evaluación",
                preguntas_pendientes: pendientes.length
            })
        }

        // Marcar la evaluación como finalizada
        const [resultado] = await pool.query(
            `
            UPDATE alumno_evaluacion
            SET
                estado = 'finalizada',
                fecha_finalizacion = NOW()
            WHERE alumno_cedula_alumno = ?
            AND evaluacion_id_evaluacion = ?
            AND estado = 'en_progreso'
            `,
            [
                alumno.cedula_alumno,
                id
            ]
        )

        if (resultado.affectedRows === 0) {
            return res.status(400).json({
                mensaje: "La evaluación no está en progreso o ya fue finalizada"
            })
        }

        return res.status(200).json({
            mensaje: "Evaluación finalizada correctamente",
            evaluacion_id: Number(id),
            total_preguntas: asignaciones.length,
            preguntas_respondidas: asignaciones.length
        })

    } catch (error) {
        console.error(error)

        return res.status(500).json({
            mensaje: "Error interno del servidor"
        })
    }
}

const subirArchivo = async (req, res) => {
    try {
        const idLogin = req.user.id
        const { id } = req.params

        // Verificar que se haya enviado un archivo
        if (!req.file) {
            return res.status(400).json({
                mensaje: "No se recibió ningún archivo"
            })
        }

        // Buscar al alumno autenticado
        const [alumnos] = await pool.query(
            `
            SELECT
                a.cedula_alumno
            FROM login l
            INNER JOIN alumno a
                ON a.cedula_alumno = l.alumno_cedula_alumno
            WHERE l.id_login = ?
            AND l.rol = 'alumno'
            `,
            [idLogin]
        )

        if (alumnos.length === 0) {
            await fs.unlink(req.file.path).catch(() => {})

            return res.status(404).json({
                mensaje: "No se encontró el alumno"
            })
        }

        const alumno = alumnos[0]

        // Verificar que la asignación pertenece al alumno
        const [asignaciones] = await pool.query(
            `
            SELECT
                id_asignacion,
                evaluacion_id_evaluacion
            FROM alumno_consigna
            WHERE id_asignacion = ?
            AND alumno_cedula_alumno = ?
            `,
            [id, alumno.cedula_alumno]
        )

        if (asignaciones.length === 0) {
            await fs.unlink(req.file.path).catch(() => {})

            return res.status(404).json({
                mensaje: "No se encontró la pregunta asignada al alumno"
            })
        }

        const asignacion = asignaciones[0]

        // Comprobar el estado de la evaluación
        const [evaluacionesAlumno] = await pool.query(
            `
            SELECT estado
            FROM alumno_evaluacion
            WHERE alumno_cedula_alumno = ?
            AND evaluacion_id_evaluacion = ?
            `,
            [
                alumno.cedula_alumno,
                asignacion.evaluacion_id_evaluacion
            ]
        )

        if (evaluacionesAlumno.length === 0) {
            await fs.unlink(req.file.path).catch(() => {})

            return res.status(404).json({
                mensaje: "No se encontró el registro de la evaluación"
            })
        }

        // No permitir archivos después de finalizar
        if (evaluacionesAlumno[0].estado === "finalizada") {
            await fs.unlink(req.file.path).catch(() => {})

            return res.status(400).json({
                mensaje: "La evaluación ya fue finalizada"
            })
        }

        try {
            // Guardar los datos del archivo en la base de datos
            const [resultado] = await pool.query(
                `
                INSERT INTO entrega_codigo (
                    nombre_archivo,
                    ruta_archivo,
                    fecha_entrega,
                    alumno_consigna_id_asignacion
                )
                VALUES (?, ?, CURDATE(), ?)
                `,
                [
                    req.file.originalname,
                    req.file.path,
                    asignacion.id_asignacion
                ]
            )

            return res.status(201).json({
                mensaje: "Archivo subido correctamente",
                id_entrega_codigo: resultado.insertId,
                nombre_archivo: req.file.originalname,
                ruta_archivo: req.file.path,
                id_asignacion: asignacion.id_asignacion
            })

        } catch (error) {
            // Si falla el registro en MySQL,
            // eliminar el archivo que Multer ya había guardado
            await fs.unlink(req.file.path).catch(() => {})

            throw error
        }

    } catch (error) {
        console.error(error)

        return res.status(500).json({
            mensaje: "Error interno del servidor"
        })
    }
}

const obtenerResultadoEvaluacion = async (req, res) => {
    try {
        const idLogin = req.user.id
        const { id } = req.params

        // Buscar al alumno autenticado
        const [alumnos] = await pool.query(
            `
            SELECT
                a.cedula_alumno,
                a.nombre,
                a.apellido
            FROM login l
            INNER JOIN alumno a
                ON a.cedula_alumno = l.alumno_cedula_alumno
            WHERE l.id_login = ?
            AND l.rol = 'alumno'
            `,
            [idLogin]
        )

        if (alumnos.length === 0) {
            return res.status(404).json({
                mensaje: "No se encontró el alumno"
            })
        }

        const alumno = alumnos[0]

        // Buscar el registro de la evaluación del alumno
        const [evaluacionesAlumno] = await pool.query(
            `
            SELECT
                ae.estado,
                ae.fecha_inicio,
                ae.fecha_finalizacion,
                e.id_evaluacion,
                e.titulo,
                e.descripcion,
                e.fecha,
                e.tipo
            FROM alumno_evaluacion ae
            INNER JOIN evaluacion e
                ON e.id_evaluacion = ae.evaluacion_id_evaluacion
            WHERE ae.alumno_cedula_alumno = ?
            AND ae.evaluacion_id_evaluacion = ?
            `,
            [alumno.cedula_alumno, id]
        )

        if (evaluacionesAlumno.length === 0) {
            return res.status(404).json({
                mensaje: "El alumno no tiene esta evaluación iniciada"
            })
        }

        const evaluacion = evaluacionesAlumno[0]

        // Obtener preguntas y respuestas del alumno
        const [resultados] = await pool.query(
            `
            SELECT
                ac.id_asignacion,
                ac.consigna_id_consigna,
                c.consigna,
                r.id_respuesta,
                r.respuesta,
                r.nota_final
            FROM alumno_consigna ac
            INNER JOIN consigna c
                ON c.id_consigna = ac.consigna_id_consigna
            LEFT JOIN respuesta r
                ON r.alumno_consigna_id_asignacion = ac.id_asignacion
            WHERE ac.alumno_cedula_alumno = ?
            AND ac.evaluacion_id_evaluacion = ?
            ORDER BY ac.id_asignacion
            `,
            [alumno.cedula_alumno, id]
        )

        // Calcular la suma solamente de las notas que ya existen
        const notas = resultados
            .map(resultado => resultado.nota_final)
            .filter(nota => nota !== null)

        const totalNotas = notas.reduce(
            (total, nota) => total + Number(nota),
            0
        )

        return res.status(200).json({
            alumno: {
                cedula: alumno.cedula_alumno,
                nombre: alumno.nombre,
                apellido: alumno.apellido
            },
            evaluacion: {
                id: evaluacion.id_evaluacion,
                titulo: evaluacion.titulo,
                descripcion: evaluacion.descripcion,
                fecha: evaluacion.fecha,
                tipo: evaluacion.tipo,
                estado: evaluacion.estado,
                fecha_inicio: evaluacion.fecha_inicio,
                fecha_finalizacion: evaluacion.fecha_finalizacion
            },
            resultado: {
                total_preguntas: resultados.length,
                preguntas_corregidas: notas.length,
                preguntas_sin_corregir: resultados.length - notas.length,
                total_notas: totalNotas
            },
            preguntas: resultados
        })

    } catch (error) {
        console.error(error)

        return res.status(500).json({
            mensaje: "Error interno del servidor"
        })
    }
}

export {
    obtenerMiPerfil,
    obtenerEvaluaciones,
    iniciarEvaluacion,
    guardarRespuesta,
    obtenerProgresoEvaluacion,
    finalizarEvaluacion,
    subirArchivo,
    obtenerResultadoEvaluacion
}