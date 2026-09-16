import { pool } from "../config/database.js"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"

/**
 * Crear un registro nuevo de usuario
 * 
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */

const crearUsuario = async (req, res) => {
    try {
        // Recibo los datos ingresados
        const {usuario, password, confirmarPassword, rol, cedula} = req.body;

        // Verifico que todos los campos hayan sido enviados
        if (!usuario || !password || !confirmarPassword || !rol || !cedula) {
            return res.status(400).json({
                mensaje: "Faltan campos obligatorios"
            });
        }

        // Verifico que coincidan las contraseñas
        if (password !== confirmarPassword) {
            return res.status(400).json({
                mensaje: "Las contraseñas no coinciden"
            })
        }

        if (password.length < 8) {
            return res.status(400).json({
                mensaje: "La contraseña debe tener al menos 8 carácteres"
            });
        }

        // Verifico que mande un rol existente
        if (rol !== "alumno" && rol !== "profesor") {
            return res.status(400).json({
                mensaje: "Rol inválido"
            });
        }

        if (rol === "alumno") {

            // Verifico el rol para alumno
            const [rolAlumno] = await pool.query(
                `
                SELECT cedula_alumno
                FROM alumno
                WHERE cedula_alumno = ?
                `,
                [cedula]
            )

            if (rolAlumno.length === 0) {
                return res.status(400).json({
                    mensaje: "No existe un alumno con esa cédula"
                });
            }

            // Verifico que no exista otra cuenta vinculada a un alumno
            const [cuentaAlumno] = await pool.query(
                `
                SELECT alumno_cedula_alumno
                FROM login
                WHERE alumno_cedula_alumno = ?
                `,
                [cedula]
            )

            if (cuentaAlumno.length > 0) {
                return res.status(409).json({
                    mensaje: "Este alumnno ya tiene una cuenta"
                });
            }
        }

        if (rol === "profesor") {

            // Verifico el rol para profesor
            const [rolProfesor] = await pool.query(
                `
                SELECT cedula_profesor
                FROM profesor
                WHERE cedula_profesor = ?
                `,
                [cedula]
            )

            if (rolProfesor.length === 0) {
                return res.status(400).json({
                    mensaje: "No existe un profesor con esa cédula"
                });
            }

            // Verifico que no exista otra cuenta vinculada a un profesor
            const [cuentaProfesor] = await pool.query(
                `
                SELECT profesor_cedula_profesor
                FROM login
                WHERE profesor_cedula_profesor = ?
                `,
                [cedula]
            )

            if (cuentaProfesor.length > 0) {
                return res.status(409).json({
                    mensaje: "Este profesor ya tiene una cuenta"
                });
            }
        }
        
        // Verifico que no exista el usuario
        const [usuarios] = await pool.query(
            `
            SELECT *
            FROM login
            WHERE usuario = ?
            `,
            [usuario]
        )

        if (usuarios.length > 0) {
            return res.status(409).json({
                mensaje: "El usuario ya está registrado"
            });
        }

        // Convierto la contraseña enviada a un codigo hash
        const passwordHash = await bcrypt.hash(password, 10)

        // Inserto los datos en la tabla login siendo alumno
        if (rol === "alumno") {
            await pool.query(
                `
                INSERT INTO login (
                usuario,
                password_hash,
                rol,
                alumno_cedula_alumno
                )
                VALUES (?, ?, ?, ?)
                `,
                [usuario, passwordHash, rol, cedula]
            )
        }

        // Inserto los datos en la tabla login siendo profesor
        if (rol === "profesor") {
            await pool.query (
                `
                INSERT INTO login (
                usuario,
                password_hash,
                rol,
                profesor_cedula_profesor
                )
                VALUES (?, ?, ?, ?)
                `,
                [usuario, passwordHash, rol, cedula]
            )
        }

        return res.status(201).json({
            mensaje: "Usuario creado correctamente"
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            mensaje: "Error interno del servidor"
        });
    }
}

/**
 * Inicio de sesion
 * 
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */

const login = async (req, res) => {
    try {
        // Recibo datos y los valido
        const {usuario, password} = req.body;

        if (!usuario || !password) {
            return res.status(400).json({
                mensaje: "Faltan campos obligatorios"
            });
        }

        // Verifico que ese usuario exista
        const [usuarios] = await pool.query(
            `
            SELECT *
            FROM login
            WHERE usuario = ?
            `,
            [usuario]
        )

        if (usuarios.length === 0) {
            return res.status(401).json({
                mensaje: "Credenciales inválidas"
            });
        }

        // Usuario encontrado
        const usuarioEncontrado = usuarios[0];

        // Comparo contraseñas para verificar que haya puesto la correcta
        const passwordCorrecta = await bcrypt.compare(
            password,
            usuarioEncontrado.password_hash
        );

        if (!passwordCorrecta) {
            return res.status(401).json({
                mensaje: "Credenciales inválidas"
            });
        }

        const token = jwt.sign(
            {
                id: usuarioEncontrado.id_login,
                usuario: usuarioEncontrado.usuario,
                rol: usuarioEncontrado.rol
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1h"
            }
        );

        return res.status(200).json({
            mensaje: "Login exitoso",
            token
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            mensaje: "Error interno del servidor"
        });
    }
}

export {
    crearUsuario,
    login
}