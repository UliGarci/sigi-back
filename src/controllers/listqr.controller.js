import {getConnection} from '../databases/database';
// función para listar toso los códigos QR
const listQR = async (req,res)=>{
    try {
        const connection = await getConnection();
        const result = await connection.query("SELECT barcode, name, code, description FROM tools ORDER BY name");
        res.json(result);
    } catch (error) {
        console.log(error);
        res.json({message:'Error'});
    }
}

export const methods={
    listQR
}