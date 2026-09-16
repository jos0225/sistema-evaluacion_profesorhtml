import { Router } from "express"

import { obtenerAlumnos, obtenerAlumnosPorCedula, crearAlumno, actualizarAlumno, eliminarAlumno } from "../controllers/alumnoController.js"

import { auth } from "../middlewares/auth.js"
import { roleAlumno } from "../middlewares/role.js"

const router = Router();

router.get("/", auth, roleAlumno, obtenerAlumnos)

router.get("/:cedula", obtenerAlumnosPorCedula)

router.post("/", crearAlumno)

router.put("/:cedula", actualizarAlumno)

router.delete("/:cedula", eliminarAlumno)

export default router;