import { getConnection } from '../databases/database';

// Obtener todos los usuarios
const getusers = async (req, res) => {
    try {
        const connection = await getConnection();
        const result = await connection.query("SELECT * FROM users");
        res.json(result);
    } catch (error) {
        console.error("Error al obtener usuarios:", error);
        res.status(500).json({ message: "Error en el servidor" });
    }
};

// Agregar un usuario
const adduser = async (req, res) => {
    try {
        const { name, email, password, image } = req.body;
        const idRol = 1;  // Valor por defecto

        if (!name || !email || !password) {
            return res.status(400).json({ message: "Todos los campos son requeridos" });
        }

        const newUser = { name, email, password, image, idRol };
        const connection = await getConnection();
        await connection.query("INSERT INTO users SET ?", [newUser]);
        res.status(201).json({ message: "Usuario creado exitosamente" });
    } catch (error) {
        console.error("Error al agregar usuario:", error);
        res.status(500).json({ message: "Error en el servidor" });
    }
};

// Obtener un usuario por ID
const getuser = async (req, res) => {
    try {
        const { id } = req.params;
        const connection = await getConnection();
        const [result] = await connection.query("SELECT * FROM users WHERE id = ?", [id]);

        if (!result) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }

        res.json(result);
    } catch (error) {
        console.error("Error al obtener usuario:", error);
        res.status(500).json({ message: "Error en el servidor" });
    }
};

// Eliminar un usuario por ID
const deleteuser = async (req, res) => {
    try {
        const { id } = req.params;
        const connection = await getConnection();
        const result = await connection.query("DELETE FROM users WHERE id = ?", [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }

        res.json({ message: "Usuario eliminado" });
    } catch (error) {
        console.error("Error al eliminar usuario:", error);
        res.status(500).json({ message: "Error en el servidor" });
    }
};

// Actualizar un usuario por ID
const updateuser = async (req, res) => {
    try {
        const { id } = req.params;
        const { email, password } = req.body;

        if (!id || !email || !password) {
            return res.status(400).json({ message: "Todos los campos son requeridos" });
        }

        const connection = await getConnection();
        const result = await connection.query(
            "UPDATE users SET email = ?, password = ? WHERE id = ?",
            [email, password, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }

        res.json({ message: "Usuario actualizado exitosamente" });
    } catch (error) {
        console.error("Error al actualizar usuario:", error);
        res.status(500).json({ message: "Error en el servidor" });
    }
};

// Exportar los métodos
export const methods = {
    getusers,
    getuser,
    adduser,
    deleteuser,
    updateuser
};