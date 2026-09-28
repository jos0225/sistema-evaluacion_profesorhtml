import { Router } from "express"
import { auth } from "../middlewares/auth.js"
import { roleAlumno } from "../middlewares/role.js"
import { upload } from "../middlewares/upload.js"
import {
    obtenerMiPerfil,
    obtenerEvaluaciones,
    iniciarEvaluacion,
    guardarRespuesta,
    obtenerProgresoEvaluacion,
    finalizarEvaluacion,
    subirArchivo,
    obtenerResultadoEvaluacion
} from "../controllers/alumnoEvaluacionController.js"
const router = Router()

router.get(
    "/perfil",
    auth,
    roleAlumno,
    obtenerMiPerfil
)

router.get(
    "/evaluaciones",
    auth,
    roleAlumno,
    obtenerEvaluaciones
)

router.post(
    "/evaluaciones/:id/iniciar",
    auth,
    roleAlumno,
    iniciarEvaluacion
)


router.post(
    "/evaluaciones/respuestas/:id",
    auth,
    roleAlumno,
    guardarRespuesta
)

router.get(
    "/evaluaciones/:id/progreso",
    auth,
    roleAlumno,
    obtenerProgresoEvaluacion
)

router.get(
    "/evaluaciones/:id/resultados",
    auth,
    roleAlumno,
    obtenerResultadoEvaluacion)

router.post(
    "/evaluaciones/:id/finalizar",
    auth,
    roleAlumno,
    finalizarEvaluacion
)

router.post(
    "/evaluaciones/entrega/:id",
    auth,
    roleAlumno,
    (req, res, next) => {
        upload.single("archivo")(req, res, (error) => {
            if (error) {
                if (error.message === "Tipo de archivo no permitido") {
                    return res.status(400).json({
                        mensaje: "Tipo de archivo no permitido"
                    })
                }

                return res.status(500).json({
                    mensaje: "Error al subir el archivo"
                })
            }

            next()
        })
    },
    subirArchivo
)

export default router