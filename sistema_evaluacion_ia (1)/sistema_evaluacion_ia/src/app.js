import express from "express"
import cors from "cors"
import alumnoRoutes from "./routes/alumnoRoutes.js"
import profesorRoutes from "./routes/profesorRoutes.js"
import authRoutes from "./routes/authRoutes.js"
import testRoutes from "./routes/testRoutes.js"

const app = express()

app.use(cors())

app.use(express.json())


app.use("/api/alumnos", alumnoRoutes)
app.use("/api/profesores", profesorRoutes)
app.use("/api/auth", authRoutes)
app.use("/api/test", testRoutes)

export default app