import jwt from "jsonwebtoken"

/**
 * Valido token antes de pasar al controlador
 * 
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */


const auth = (req, res, next) => {
    try {
        // Obtengo autorización
        const authHeader = req.headers.authorization;

        // Verifico si envió token
        if (!authHeader) {
            return res.status(401).json({
                mensaje: "Token no proporcionado"
            });
        }

        // Obtengo el token
        const token = authHeader.split(" ")[1];

        // Verifico si existe el token
        if (!token) {
            return res.status(401).json({
                mensaje: "Acceso denegado"
            });
        }

        // Verifico JWT y guardo el decoded en req.user
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;

        next()

    } catch (error) {

        // Si el token es inválido
        if (error.name === "JsonWebTokenError") {
            return res.status(401).json({
                mensaje: "Token Inválido"
            });
        }

        // Si el token expiró
        if (error.name === "TokenExpiredError") {
            return res.status(401).json({
                mensaje: "Token caducado"
            });
        }

        console.error(error);

        return res.status(500).json({
            mensaje: "Error interno del servidor"
        })
    }
}

export {
    auth
}