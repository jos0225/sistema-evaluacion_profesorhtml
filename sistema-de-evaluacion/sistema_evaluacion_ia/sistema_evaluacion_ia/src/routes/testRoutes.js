import { Router } from "express"
import { auth } from "../middlewares/auth.js"
import { roleProfesor, roleAlumno } from "../middlewares/role.js";

const router = Router();

router.get("/prueba", auth, (req, res) => {
    res.json({
        mensaje: "Llegaste al controlador",
        usuario: req.user
    })
});

router.get("/profesor", auth, roleProfesor, (req, res) => {
    return res.status(200).json({
        mensaje: "Bienvenido profesor"
    })
});

router.get("/alumno", auth, roleAlumno, (req, res) => {
    return res.status(200).json({
        mensaje: "Bienvenido alumno"
    })
});

export default router;