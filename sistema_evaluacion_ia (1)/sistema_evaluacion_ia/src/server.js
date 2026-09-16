import dotenv from "dotenv"
import app from "./app.js"

dotenv.config();

const PORT = process.env.PORT || 2323

app.listen(PORT, () => {
    console.log(`Servidor ejecutandose en puerto ${PORT}`)
});