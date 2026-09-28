import { Router } from "express"
import { obtenerAlumnos, obtenerAlumnosPorCedula, crearAlumno, actualizarAlumno, eliminarAlumno } from "../controllers/alumnoController.js"

const router = Router();

router.get("/", obtenerAlumnos)

router.get("/:cedula", obtenerAlumnosPorCedula)

router.post("/", crearAlumno)

router.put("/:cedula", actualizarAlumno)

router.delete("/:cedula", eliminarAlumno)

export default router;