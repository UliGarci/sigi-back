import { getConnection } from '../databases/database';

// función para obtener todos los reportes de la BD
const getReports = async (req,res)=>{
    try {
        const connection = await getConnection();
        // obtenemos todos los reportes
        const result = await connection.query("SELECT * FROM reports");
        // creamos un arreglo para mandar los datos hacia el cliente
        // idTool => name & code
        const report=[];
        for(const i of result){
            const [tool] = await connection.query("SELECT code,name FROM tools WHERE id=?",i.idTool);
            const info ={
                id:i.id,
                idTool:i.idTool,
                code:tool.code,
                name:tool.name,
                description:i.description,
                status:i.status
            }
            report.push(info);
        }
        // se envia el arreglo report
        res.json(report);
    } catch (error) {
        console.log("Error: ",error);
        res.json({message:'Error'});
    }
}

// función para reparar herramienta dentro del reporte
const repair=async(req,res)=>{
    try {
        const {id} = req.params;
        const {idTool} = req.body;
        const connection = await getConnection();
        // busqueda de información de herramienta rota
        const [result] = await connection.query("SELECT quantityAvailable, inventoryQuantity, status FROM tools WHERE id=?",idTool);
        if(result && result.inventoryQuantity){
            // validación si es la unica herramienta en almacen, se realizan operaciones con status
            if(result.status===3){
                // se actualiza la informacion de la herramienta
                await connection.query("UPDATE tools SET status=1, quantityAvailable=1 WHERE id=?",idTool);
                // se actualiza el status del reporte a 0 de que ya fue resuelto
                await connection.query("UPDATE reports SET status=0 WHERE id=?",id);
                res.json({message:'Success'});
            }else if(result.status===null){ // validación si hay más de 1 herramienta en almacen
                // se actualiza la cantidad disponible, agregando la herramienta reparada a cantidad disponible
                console.log("Son varias")
                const newQuantityAvailable = result.quantityAvailable+1;
                await connection.query("UPDATE tools SET quantityAvailable=? WHERE id=?",[newQuantityAvailable,idTool]);
                // se actualiza el status del reporte a 0 de que ya fue atendido
                await connection.query("UPDATE reports SET status=0 WHERE id=?",id);
                res.json({message:'Success'});
            }
        }else{
            console.log("Resultado: ",result);
            res.json({message:'Missing'});
        }
    } catch (error) {
        console.log(error);
        res.json({message:'Error'});
    }
}

// función para eliminar o quitar de almacen una herramienta rota
const deleteToolBreak=async(req,res)=>{
    try {
        const {id}=req.params;
        const {idTool} = req.body;
        const connection = await getConnection();
        // se consulta la información de la herramienta
        const [result] = await connection.query("SELECT status,quantityAvailable,inventoryQuantity FROM tools WHERE id=?",idTool);
        // se valida si se encontro algo en la base de datos
        if(result && result.inventoryQuantity){
            if(result.inventoryQuantity===1){
                console.log("UNICA")
                // se elimina los registros con llave foranea de la herramienta
                // prestamos
                await connection.query("DELETE FROM loantools WHERE idTool=?",idTool);
                // reportes
                await connection.query("DELETE FROM reports WHERE idTool=?",idTool);
                
                // se elimina si es unica herramienta en almacen
                await connection.query("DELETE FROM tools WHERE id=?",idTool);
                // se actualiza la información del reporte
                await connection.query("UPDATE reports SET status=0 WHERE id=?",id);
                res.json({message:'Success'});
            }else{
                console.log("VARIAS")
                // se actualiza la información de la herramienta si no es la unica en el almacen
                const newInventoryQuantity = result.inventoryQuantity-1;
                await connection.query("UPDATE tools SET inventoryQuantity=? WHERE id=?",[newInventoryQuantity,id]);
                // se actualiza la información del reporte
                await connection.query("UPDATE reports SET status=0 WHERE id=?",id);
                res.json({message:'Success'});
            }
        }else{
            console.log(result);
            res.json({message:'Missing'})
        }

    } catch (error) {
        console.log("Error: ",error);
        res.json({message:'Error'});
    }
}

// funcion para eliminar reporte existente
const deleteReport = async (req,res) => {
    try {
        const {id} = req.params;
        const connection = await getConnection();
        await connection.query("DELETE FROM reports WHERE id=?",id);
        res.json({message:'Success'});
    } catch (error) {
        console.log(error)
        res.json({message:'Error'});
    }
}

export const methods={
    getReports,
    repair,
    deleteToolBreak,
    deleteReport
}