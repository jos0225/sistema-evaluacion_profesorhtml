/**
 * Valido si el rol del usuario logueado es profesor
 * 
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */

const roleProfesor = (req, res, next) => {
    try {
        if (req.user.rol !== "profesor") {
            return res.status(403).json({
                mensaje: "Acceso no permitido"
            });
        }

        
        next()
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            mensaje: "Error interno del servidor"
        });
    }
}

/**
 * Valido si el rol del usuario logueado es alumno
 * 
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */

const roleAlumno = (req, res, next) => {
    try {
        if (req.user.rol !== "alumno") {
            return res.status(403).json({
                mensaje: "Acceso no permitido"
            });
        }

        next()

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            mensaje: "Error interno del servidor"
        });
    }
}

export {
    roleProfesor,
    roleAlumno
}