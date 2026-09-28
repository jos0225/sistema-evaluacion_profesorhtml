import { pool } from "../config/database.js"

/**
 * Obtiene todos los profesores 
 * 
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */

const obtenerProfesores = async (req, res) => {
    try {
        const [rows] = await pool.query(
            "SELECT * FROM profesor"
        );

        res.status(200).json(rows);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            mensaje: "Error interno del servidor"
        });
    }
};

/**
 * Obtiene profesores por cedula
 * 
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */

const obtenerProfesoresPorCedula = async (req, res) => {
    try {
        const { cedula } = req.params;

        const [rows] = await pool.query(
            `
            SELECT *
            FROM profesor
            WHERE cedula_profesor = ?
            `,
            [cedula]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                mensaje: "Profesor no encontrado"
            });
        }

        res.status(200).json(rows[0]);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            mensaje: "Error interno del servidor"
        });
    }
}

/**
 * Crear un nuevo registro de profesor
 * 
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */

const crearProfesor = async (req, res) => {
    try {
        const {
            cedula_profesor,
            nombre,
            apellido,
            correo
        } = req.body;

        if (!cedula_profesor || !nombre || !apellido || !correo) {
            return res.status(400).json({
                mensaje: "Faltan campos obligatorios"
            });
        }

        const [cedulaExistente] = await pool.query(
            `
            SELECT cedula_profesor
            FROM profesor
            WHERE cedula_profesor = ?
            `,
            [cedula_profesor]
        );

        if (cedulaExistente.length > 0) {
            return res.status(409).json({
                mensaje: "La cedula ya está registrada"
            });
        }

        const [correoExistente] = await pool.query(
            `
            SELECT correo
            FROM profesor
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
            INSERT INTO profesor (
                cedula_profesor,
                nombre,
                apellido,
                correo
            )
            VALUES (?, ?, ?, ?)
            `,
            [
                cedula_profesor,
                nombre,
                apellido,
                correo
            ]
        );

        return res.status(201).json({
            mensaje: "Profesor creado correctamente"
        });
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            mensaje: "Error interno del servidor"
        });
    }
}

/**
 * Actualizar registro de un profesor existente
 * 
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */

const actualizarProfesor = async (req, res) => {
    try {
        const {cedula} = req.params;
        const {nombre, apellido, correo} = req.body;

        // Validar que todos los campos obligatorios hayan sido enviados
        if (!nombre || !apellido || !correo) {
            return res.status(400).json({
                mensaje: "Faltan campos obligatorios"
            });
        }

        // Comprobar que el profesor exista
        const [profesores] = await pool.query(
            `
            SELECT *
            FROM profesor
            WHERE cedula_profesor = ?
            `,
            [cedula]
        )

        if (profesores.length === 0) {
            return res.status(404).json({
                mensaje: "Profesor no encontrado"
            });
        }

        // Comprobar si el correo pertenece a otro registro
        const [correoExistente] = await pool.query(
            `
            SELECT cedula_profesor
            FROM profesor
            WHERE correo = ?
            AND cedula_profesor != ?
            `,
            [correo, cedula]
        )

        if (correoExistente.length > 0) {
            return res.status(409).json({
                mensaje: "Este correo ya esta siendo utilizado por otro profesor"
            });
        }

        // Actualizar el profesor
        await pool.query(
            `
            UPDATE profesor
            SET nombre = ?,
                apellido = ?,
                correo = ?
            WHERE cedula_profesor = ?
            `,
            [nombre, apellido, correo, cedula]
        )

        return res.status(200).json({
            mensaje: "Profesor actualizado correctamente"
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            mensaje: "Error interno del servidor"
        });
    }
}

/**
 * Eliminar un registro de profesor existente
 * 
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */

const eliminarProfesor = async (req, res) => {
    try {
        // Recibo la cedula por la URL
        const {cedula} = req.params;

        // Verifico que exista el profesor
        const [profesor] = await pool.query(
            `
            SELECT cedula_profesor
            FROM profesor
            WHERE cedula_profesor = ?
            `,
            [cedula]
        )

        if (profesor.length === 0) {
            return res.status(404).json({
                mensaje: "Profesor no encontrado"
            });
        }

        // Elimino registro
        await pool.query(
            `DELETE from profesor
            WHERE cedula_profesor = ?
            `,
            [cedula]
        )

        return res.status(200).json({
            mensaje: "Profesor eliminado correctamente"
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            mensaje: "Error interno del servidor"
        });
    }
}

export {
    obtenerProfesores,
    obtenerProfesoresPorCedula,
    crearProfesor,
    actualizarProfesor,
    eliminarProfesor
}