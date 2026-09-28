import { pool } from "../config/database.js"

/**
 * Obtiene todos los alumnos 
 * 
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */

const obtenerAlumnos = async (req, res) => {
    try {
        const [rows] = await pool.query(
            "SELECT * FROM alumno"
        );

        res.status(200).json(rows)
    } catch (error) {
        console.error(error)

        res.status(500).json({
            mensaje: "Error interno del servidor"
        });
    }
};

/**
 * Obtiene un alumno por su cédula
 * 
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */

const obtenerAlumnosPorCedula = async (req, res) => {
    try {
        const { cedula } = req.params;

        const [rows] = await pool.query(
            `
            SELECT *
            FROM alumno
            WHERE cedula_alumno = ?
            `,
            [cedula]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                mensaje: "Alumno no encontrado"
            });
        }

        res.status(200).json(rows[0]);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            mensaje: "Error interno del servidor"
        });
    }
};

/**
 * Crear un nuevo alumno
 * 
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */

const crearAlumno = async (req, res) => {
    try {
        const {
            cedula_alumno,
            nombre,
            apellido,
            correo
        } = req.body;

        if (!cedula_alumno || !nombre || !apellido || !correo) {
            return res.status(400).json({
                mensaje: "Faltan campos obligatorios"
            }); 
        }

        const [cedulaExistente] = await pool.query(
            `
            SELECT cedula_alumno
            FROM alumno
            WHERE cedula_alumno = ?
            `,
            [cedula_alumno]
        );

        if (cedulaExistente.length > 0) {
            return res.status(409).json({
                mensaje: "La cedula ya está registrada"
            });
        }

        const [correoExistente] = await pool.query(
            `
            SELECT correo
            FROM alumno
            WHERE correo = ?
            `,
            [correo]
        );

        if (correoExistente.length > 0) {
            return res.status(409).json({
                mensaje: "Este correo ya está registrado"
            });
        }

        await pool.query(
            `
            INSERT INTO alumno (
                cedula_alumno,
                nombre,
                apellido,
                correo
            )
            VALUES (?, ?, ?, ?)
            `,
            [
                cedula_alumno,
                nombre,
                apellido,
                correo
            ]
        );

        return res.status(201).json({
            mensaje: "Alumno creado correctamente"
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            mensaje: "Error interno del servidor"
        });
    }
}

/**
 * Actualizar registro de un alumno existente
 * 
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */

const actualizarAlumno = async (req, res) => {
    try {
        const {cedula} = req.params;
        const {nombre, apellido, correo} = req.body;

        // Validar que todos los campos obligatorios hayan sido enviados
        if (!nombre || !apellido || !correo) {
            return res.status(400).json({
                mensaje: "Faltan campos obligatorios"
            });
        }

        // Comprobar que el alumno exista
        const [alumnos] = await pool.query(
            `
            SELECT * 
            FROM alumno
            WHERE cedula_alumno = ?
            `,
            [cedula]
        )

        if (alumnos.length === 0) {
            return res.status(404).json({
                mensaje: "Alumno no encontrado"
            });
        }

        // Comprobar si el correo pertenece a otro registro
        const [correoExistente] = await pool.query(
            `
            SELECT cedula_alumno
            FROM alumno
            WHERE correo = ?
            AND cedula_alumno != ?
            `,
            [correo, cedula]
        )

        if (correoExistente.length > 0) {
            return res.status(409).json({
                mensaje: "El correo ya está registrado por otro alumno"
            });
        }

        // Actualizo el alumno
        await pool.query(
            `
            UPDATE alumno
            SET nombre = ?, 
                apellido = ?, 
                correo = ?
            WHERE cedula_alumno = ?
            `,
            [nombre, apellido, correo, cedula]
        )

        return res.status(200).json({
            mensaje: "Alumno actualizado correctamente"
        })

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            mensaje: "Error interno del servidor"
        });
    }
}

/**
 * Eliminar un registro de alumno existente
 * 
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */

const eliminarAlumno = async (req, res) => {
    try {
        const {cedula} = req.params;

        const [alumno] = await pool.query(
            `SELECT cedula_alumno
            FROM alumno
            WHERE cedula_alumno = ?
            `,
            [cedula]
        )

        if (alumno.length === 0) {
            return res.status(404).json({
                mensaje: "Alumno no encontrado"
            });
        }

        await pool.query(
            `DELETE FROM alumno
            WHERE cedula_alumno = ?
            `,
            [cedula]
        )

        return res.status(200).json({
            mensaje: "Registro de alumno eliminado correctamente"
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            mensaje: "Error interno del servidor"
        });
    }
}

export {
    obtenerAlumnos,
    obtenerAlumnosPorCedula,
    crearAlumno,
    actualizarAlumno,
    eliminarAlumno
};