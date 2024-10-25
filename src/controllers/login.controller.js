import { getConnection } from '../databases/database';
import jwt from 'jsonwebtoken';

const secretKey = process.env.SECRET_KEY;

const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const connection = await getConnection();
        const result = await connection.query("SELECT * FROM users WHERE email=?", [email]);
        if (result.length > 0) {
            const storedpassword = result[0].password;
            if (password === storedpassword) {
                const user = result[0];
                const idUser = user.id;
                const token= jwt.sign({userId:idUser},secretKey,{expiresIn:'5h'});
                res.json({token:token,message:"Success"});
            } else {
                res.json({ message: 'No Valid' });
            }
        } else {
            res.json({ message: 'No Valid' });
        }
    } catch (error) {
        console.log('Error: ',error);
        res.status(500).json({ message: "Error" });
    }
}

export const methods = {
    login
}