import { Router } from "express"
import { obtenerProfesores, obtenerProfesoresPorCedula, crearProfesor, actualizarProfesor, eliminarProfesor } from "../controllers/profesorController.js"

const router = Router();

router.get("/", obtenerProfesores)
router.get("/:cedula", obtenerProfesoresPorCedula)

router.post("/", crearProfesor)

router.put("/:cedula", actualizarProfesor)

router.delete("/:cedula", eliminarProfesor)

export default router;