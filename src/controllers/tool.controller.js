import { getConnection } from '../databases/database';
import qrcode from 'qrcode';
import JsBarcode from 'jsbarcode';
import { createCanvas } from 'canvas';

//FUNCIÓN PARA OBTENER TODOS LOS DATOS DE TODAS LAS HERRAMIENTAS
const gettools = async (req, res) => {
    try {
        const connection = await getConnection();
        const result = await connection.query("SELECT * FROM tools ORDER BY name");
        res.json(result);
    } catch (error) {
        res.status(500);
        console.log(error);
        res.json({ message: "Error" });
    }
}

//FUNCIÓN PARA REGISTRAR UNA NUEVA HERRAMIENTA
const addtool = async (req, res) => {
    try {
        const { name, idCategory, image, description, inventoryQuantity } = req.body;
        if (name == undefined || idCategory == undefined || inventoryQuantity == undefined) {
            res.status(400).json({ message: "Bad Request" })
        }
        const connection = await getConnection();
        // obtener el nombre de la categoria
        const [category] = await connection.query("SELECT name FROM toolcategories WHERE id=?", idCategory.value);
        const nameCategory = category.name;
        //generar código para "code"
        const codePrefix = nameCategory.substring(0, 3);
        const tools = await connection.query("SELECT code FROM tools WHERE code LIKE ?", [`${codePrefix}%`]);

        let nextNumber;
        let lastCode;
        let code;
        if(tools.length>0){
            lastCode=tools[tools.length - 1].code
            nextNumber = parseInt(lastCode.substring(3)) + 1;
            code = codePrefix + nextNumber;
        }else{
            lastCode=1;
            code = codePrefix + lastCode;
        }
        let toolId;
        const barcode = null;
        let status = 0;
        const quantityAvailable = inventoryQuantity;
        // Si la cantidad en inventario es igual a 1 tendra status, de lo contrario no tendra status
        if (inventoryQuantity === 1) {
            status = 1;
        }
        const result = await connection.query("INSERT INTO tools SET code=?,name=?,idCategory=?,image=?,description=?,barcode=?,inventoryQuantity=?,quantityAvailable=?,status=?",[code,name,idCategory.value,image,description,barcode,inventoryQuantity,quantityAvailable,status]);
        //GENERAR QR
        toolId = result.insertId;
        await generateBarcode(toolId);
        res.json({ message: "Success" });

    } catch (error) {
        console.log(error);
        res.json({ message: "Error" });
    }
}

const generateQR = async (toolId) => {
    try {
        const qr = await qrcode.toDataURL(toolId.toString());
        const connection = await getConnection();
        await connection.query("UPDATE tools SET qr = ? WHERE id = ?", [qr, toolId]);
    } catch (error) {
        console.log("Error al generar qr: ", error);
    }
}

const generateBarcode = async (toolId)=>{
    try {
        // creación de lienzo para el barcode
        const canvas = createCanvas(1,1);
        //configuración de generación de barcode
        const barcodeOptions = {
            format: 'CODE128', //formato de barcode
            displayValue:true //mostrar el valor en el codigo de barras
        }
        //generar el barcode
        JsBarcode(canvas,toolId.toString(),barcodeOptions);
        //barcode a png base64
        const barcode = canvas.toDataURL();
        //guardar en base de datos
        const connection = await getConnection();
        await connection.query("UPDATE tools SET barcode=? WHERE id=?",[barcode,toolId]);
    } catch (error) {
        console.log("Error al generar el barcode, ",error);
    }
}

const gettool = async (req, res) => {
    try {
        const { id } = req.params;
        const connection = await getConnection();
        const [result] = await connection.query("SELECT * FROM tools WHERE id = ?", id);
        const [category] = await connection.query("SELECT name FROM toolcategories WHERE id=?",result.idCategory);
        const data = {
            id: result.id,
            code: result.code,
            name: result.name,
            category: category.name,
            image: result.image,
            description: result.description,
            barcode: result.barcode,
            inventoryQuantity: result.inventoryQuantity,
            quantityAvailable: result.quantityAvailable,
            status: result.status
        }
        res.json(data);
    } catch (error) {
        res.status(500);
        console.log(error);
        res.json({ message: "Error" });
    }
}

// funcion para eliminar, si la cantidad en almacen es 1, de lo contrario para eliminar es mediante editar
const deletetool = async (req, res) => {
    try {
        const { id } = req.params;
        const connection = await getConnection();
        const [result] = await connection.query("SELECT * FROM tools WHERE id=?",id);
        if(result.quantityAvailable===1 && result.status===1){
            await connection.query("DELETE FROM tools WHERE id = ?", id);    
            res.json({ message: "Success" });
        }else if(result.quantityAvailable===0 && result.status===2){
            // si la herramienta esta en prestamo, no se podra eliminar
            res.json({message:"Impossible"});
        }else if(result.status===3){
            res.json({message:"Repair"});
        }
    } catch (error) {
        res.status(500);
        console.log(error);
        res.json({ message: "Error" });
    }
}


// funcion para actualizar toda la informacion de la herramienta
const updatetool = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, image, description, inventoryQuantity } = req.body;
        if (id == undefined || name == undefined || inventoryQuantity == undefined) {
            res.status(400).json({ message: "Bad Request" })
        }
        const connection = await getConnection();
        const [result] = await connection.query("SELECT * FROM tools WHERE id=?", id);

        // validar si se modifico la cantidad de herramienta, para que podamos cambiar el status y la cantidad disponible y cantidad en el inventario
        if (result.inventoryQuantity != inventoryQuantity) {
            // si la cantidad en el inventario actualmente tiene 1 hacer lo siguiente:
            // considerando que se aumento la cantidad
            if (result.inventoryQuantity === 1) {
                const status = null;
                if (result.status === 1) {
                    // asigno el mismo valor de inventoryQuanitity a quantityAvailable porque no hay herramienta prestada
                    await connection.query("UPDATE tools SET name=?, image=?, description=?, inventoryQuantity=?, quantityAvailable=?, status=? WHERE id = ?", [name, image, description, inventoryQuantity, inventoryQuantity, status, id])
                    return res.json({ message: "Success" });
                } else if (result.status === 2 || result.status === 3) {
                    // asigno las nuevas herramientas a cantidad disponible porque una herramienta esta en prestamo o rota
                    const quantityAvailable = inventoryQuantity - result.inventoryQuantity;
                    await connection.query("UPDATE tools SET name=?, image=?, description=?, inventoryQuantity=?, quantityAvailable=?, status=? WHERE id = ?", [name, image, description, inventoryQuantity, quantityAvailable, status, id])
                    return res.json({ message: "Success" });
                }
            }else if(inventoryQuantity>result.inventoryQuantity){       // si la cantidad en el invetario actualmente es mayor a 1 hacer lo siguiente
                                                                        // considerando que se aumento la cantidad

                // la constante add servira para almacenar cuantas herramientas mas se agrego
                const add =inventoryQuantity-result.inventoryQuantity;
                // la constante quantityAvailable servira para almacenar cuantas herramientas estaran disponibles despues de agregar las nuevas
                const quantityAvailable = result.quantityAvailable+add;
                await connection.query("UPDATE tools SET name=?, image=?, description=?, inventoryQuantity=?, quantityAvailable=? WHERE id = ?", [name, image, description, inventoryQuantity, quantityAvailable, id])
                return res.json({message:'Success'});
            }else if(inventoryQuantity<result.inventoryQuantity){       // considerando que se disminuira la cantidad
                                                                        // no se admite cero por parte del FRONT-END

                // la constante minus servira para almacenar cuantas herramientas se estan eliminando
                const minus = result.inventoryQuantity-inventoryQuantity;
                // solo se podran eliminar las herramientas disponibles, ya que estan enlazadas a un prestamo
                if(minus>result.quantityAvailable){
                    return res.json({message:'Impossible'});
                }else if(minus<=result.quantityAvailable){
                    // le restamos el minus a la cantidad disponible actualmente para setearlo en el quantityAvailable
                    const quantityAvailable = result.quantityAvailable-minus;
                    // le restamos el minus a la cantidad en el inventario actualmente para setearlo en el inventoryQuantity
                    const newinventoryQuantity= result.inventoryQuantity-minus;
                    // se valida si la herramienta cuenta con solo uno, para devolver su estado a prestamo o 
                    if(newinventoryQuantity===1){
                        // si esta disponible esa unica herramienta se hace lo siguiente
                        let status = 1;
                        if(quantityAvailable===1){ 
                            status = 1;
                        }else if(quantityAvailable===0){
                            status = 2;
                        }
                        await connection.query('UPDATE tools SET name=?, image=?, description=?, inventoryQuantity=?, quantityAvailable=?, status=? WHERE id=?',[name,image,description,inventoryQuantity,quantityAvailable,status,id]);
                        return res.json({message:'Success'});
                    }else{
                        let status =3;
                        await connection.query('UPDATE tools SET name=?, image=?, description=?, inventoryQuantity=?, quantityAvailable=?, status=? WHERE id=?',[name,image,description,inventoryQuantity,quantityAvailable,status,id]);
                        return res.json({message:'Success'});
                    }
                    // si no se realiza ningun cambio en la cantidad hacer lo siguiente
                    await connection.query('UPDATE tools SET name=?, image=?, description=?, inventoryQuantity=?, quantityAvailable=? WHERE id=?',[name,image,description,inventoryQuantity,quantityAvailable,id]);
                    return res.json({message:'Success'});
                }
            }
        }else{
        // si no se modifico la cantidad de herramientas en el inventario hacer lo siguiente:
            await connection.query("UPDATE tools SET name=?, image=?, description=?, inventoryQuantity=? WHERE id = ?", [name, image, description, inventoryQuantity, id]);
            return res.json({ message: "Success" });
        }
    } catch (error) {
        res.status(500);
        console.log(error);
        res.json({ message: error });
    }
}

const repair= async(req,res)=>{
    try {
        const {id} = req.params;
        const connection = await getConnection();
        await connection.query("UPDATE tools SET status=?, quantityAvailable=? WHERE id=?",[1,1,id]);
        res.json({message:'Success'});
    } catch (error) {
        console.log(error);
        res.json({message:"Error"});
    }
}


export const methods = {
    gettools,
    addtool,
    gettool,
    deletetool,
    updatetool,
    generateQR,
    repair
};