import { Router } from "express"

import {
    crearEvaluacion,
    agregarPreguntaAEvaluacion,
    obtenerPreguntasDeEvaluacion,
    eliminarPreguntaDeEvaluacion
} from "../controllers/evaluacionController.js"

import { auth } from "../middlewares/auth.js"
import { roleProfesor } from "../middlewares/role.js"

const router = Router()

router.post(
    "/",
    auth,
    roleProfesor,
    crearEvaluacion
)

router.post(
    "/:id/preguntas/:idConsigna",
    auth,
    roleProfesor,
    agregarPreguntaAEvaluacion
)

router.get(
    "/:id/preguntas",
    auth,
    roleProfesor,
    obtenerPreguntasDeEvaluacion
)

router.delete(
    "/:id/preguntas/:idConsigna",
    auth,
    roleProfesor,
    eliminarPreguntaDeEvaluacion
)

export default router