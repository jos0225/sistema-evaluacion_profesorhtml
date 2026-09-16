import { Router } from "express"
import { obtenerProfesores, obtenerProfesoresPorCedula, crearProfesor, actualizarProfesor, eliminarProfesor } from "../controllers/profesorController.js"
import { auth } from "../middlewares/auth.js"
import { roleProfesor } from "../middlewares/role.js"


const router = Router();

router.get("/", auth, roleProfesor, obtenerProfesores)
router.get("/:cedula", obtenerProfesoresPorCedula)

router.post("/", crearProfesor)

router.put("/:cedula", actualizarProfesor)

router.delete("/:cedula", eliminarProfesor)

export default router;