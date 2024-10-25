import { getConnection } from '../databases/database';

// Obtener la lista de prestamos
const getloans = async (req, res) => {
    try {
        const connection = await getConnection();
        const result = await connection.query("SELECT * FROM loans");
        res.json(result);
    } catch (error) {
        res.status(500);
        res.json({ message: "Error" });
    }
}

const deleteloan = async (req,res) =>{
    try {
        const {id} = req.params;
        const connection = await getConnection();
        await connection.query("DELETE FROM loantools WHERE idLoan=?",id)
        await connection.query("DELETE FROM loans WHERE id=?",id);
        res.json({message:'Success'});
    } catch (error) {
        console.log('Error: ',error);
        res.json({message:'Error'});
    }
}


// funcion para crear un prestamo de herramientas para cierto proyecto
const addloan = async (req, res) => {
    try {
        // se obtiene como parametro el nombre del proyecto "name" y la lista de id de la herramienta a prestar;
        const { name, codes } = req.body;
        // constante para almacenar los codigos que no existan
        const missingCodes = [];
        // constante para almacenar los codigos que no esten disponibles
        const notAvailableCodes = [];
        // constante para almacenar los codigos que esten rotas
        const toolBreakCodes = [];
        const idUser = 1;   // id de usuario quien realiza el prestamo
        let dateLoan = new Date();    // fecha de inicio del prestamo
        dateLoan = dateLoan.toISOString().split('T')[0];
        const dateReturn = null;    // fecha de devolución total del prestamo, se coloca nulo porque apenas se esta iniciando el prestamo
        // se crea un array para iterar el id de la lista separados por las comas
        const codeArray = codes.split(",").map(code => code.trim().replace(/^,|,$/g, ""));

        if (codeArray.length === 1) {   // se valida si el prestamo solo es una herramienta o más de una
            const connection = await getConnection();
            // se valida si el id existe
            const [exist] = await connection.query(`SELECT name,code,inventoryQuantity,quantityAvailable,status FROM tools WHERE id=?`, [codeArray[0]]);
            // validación si la consulta encontro algo
            if (exist && exist.name) {
                if (exist.inventoryQuantity === 1) {    // se valida si en almacen es unica pieza, se realiza operaciones con status
                    if (exist.status === 1) {
                        try {
                            // Se registra el prestamo en "loan"
                            const insertLoanQuery = "INSERT INTO loans (idUser, project, dateLoan, dateReturn) VALUES (?, ?, ?, ?)";
                            const result = await connection.query(insertLoanQuery, [idUser, name, dateLoan, dateReturn]);
                            const loanId = result.insertId; // se obtiene el ultimo id registrado del prestamo
                            // se registra el prestamo con relacion al id del prstamo creado "loanId"
                            await connection.query("INSERT INTO loantools SET idLoan=?,idTool=?,status=1", [loanId, codeArray]);
                            // se actualiza el status de la herramienta solicitada
                            await connection.query("UPDATE tools SET quantityAvailable=0, status=2 WHERE id=?", codeArray);
                            res.json({ message: 'Success', notAvailableCodes, toolBreakCodes, missingCodes });
                        } catch (error) {
                            console.log('Error', error);
                            res.json({ message: 'Error' });
                        }
                    } else if (exist.status === 2) {
                        const tool = {
                            name: exist.name,
                            code: exist.code
                        }
                        notAvailableCodes.push(tool);
                        res.json({ message: 'Not Available', notAvailableCodes });
                    } else if (exist.status === 3) {
                        const tool = {
                            name: exist.name,
                            code: exist.code
                        }
                        toolBreakCodes.push(tool);
                        res.json({ message: "Broken", toolBreakCodes });
                    }
                } else if (exist.inventoryQuantity > 1) {   // se valida si la cantidad en inventario es mayor a uno, no se maneja status
                    if (exist.quantityAvailable > 0) {  // si hay cantidad disponible para el prestamo
                        try {
                            const insertLoanQuery = "INSERT INTO loans (idUser, project, dateLoan, dateReturn) VALUES (?, ?, ?, ?)";
                            const result = await connection.query(insertLoanQuery, [idUser, name, dateLoan, dateReturn]);
                            const loanId = result.insertId; // se obtiene el ultimo id registrado del prestamo
                            // se registra la herramietna con el id del prestamo creado "loanId"
                            await connection.query("INSERT INTO loantools SET idLoan=?,idTool=?,status=1", [loanId, codeArray]);
                            // operaciones para actualizar la cantidad disponible
                            const available = exist.quantityAvailable - 1;
                            await connection.query("UPDATE tools SET quantityAvailable=? WHERE id=?", [available, codeArray]);
                            res.json({ message: 'Success' });
                        } catch (error) {
                            console.log("ERROR: ", error);
                            res.json({ message: 'Error' });
                        }
                    } else if (exist.quantityAvailable === 0) {  // si no hay cantidad disponible, almacenar el codigo en no disponible
                        const tool = {
                            name: exist.name,
                            code: exist.code
                        }
                        notAvailableCodes.push(tool);
                        res.json({ message: 'Not Available', notAvailableCodes });
                    }
                }

            } else {
                missingCodes.push(codeArray);
                res.json({ message: "Missing", missingCodes })
            }

        } else if (codeArray.length > 1) {   // validación si el prestamo es de dos o más herramientas
            const connection = await getConnection();
            const found = [];
            try {
                // se crea una validacion si el codigo existe
                for (const code of codeArray) {
                    const [exist] = await connection.query(`SELECT name FROM tools WHERE id=?`, [code]);
                    if (exist && exist.name) {
                        found.push(code);
                    } else {
                        const coding = {
                            code: code
                        }
                        missingCodes.push(coding);
                    }
                }

                // si algun codigo de la lista existe hacer el prestamo
                if (found.length > 0) {

                    // primero, se registra el prestamo en "loan"
                    const idUser = 1;   // id de usuario quien realiza el prestamo
                    let dateLoan = new Date();    // fecha de inicio del prestamo
                    dateLoan = dateLoan.toISOString().split('T')[0];
                    const dateReturn = null;    // fecha de devolución total del prestamo, se coloca nulo porque apenas se esta iniciando el prestamo
                    const connection = await getConnection();
                    const insertLoanQuery = "INSERT INTO loans (idUser, project, dateLoan, dateReturn) VALUES (?, ?, ?, ?)";
                    const result = await connection.query(insertLoanQuery, [idUser, name, dateLoan, dateReturn]);
                    const loanId = result.insertId; // se obtiene el ultimo id registrado del prestamo

                    for (const code of found) {

                        // validamos si existe la herramienta
                        const [exist] = await connection.query(`SELECT name,code,inventoryQuantity,quantityAvailable,status FROM tools WHERE id=?`, [code]);
                        if (exist && exist.name) { // si existen la herramienta realizar el prestamo
                            if (exist.inventoryQuantity === 1) {    // si la herramienta en almacen es 1, se realizan operaciones con status
                                if (exist.status === 1) {  // si hay herramienta disponible, realizar el prestamo
                                    try {
                                        await connection.query("INSERT INTO loantools SET idLoan=?,idTool=?,status=1", [loanId, code]);
                                        await connection.query("UPDATE tools SET quantityAvailable=0, status=2 WHERE id=?", code);
                                    } catch (error) {
                                        console.log('Error', error);
                                        res.json({ message: 'Error' });
                                    }
                                } else if (exist.status === 2) {  // si no hay herramienta disponible, almacenar el codigo en no disponible
                                    const tool = {
                                        name: exist.name,
                                        code: exist.code
                                    }
                                    notAvailableCodes.push(tool);
                                } else if (exist.status === 3) {
                                    const tool = {
                                        name: exist.name,
                                        code: exist.code
                                    }
                                    toolBreakCodes.push(tool);
                                }
                            } else if (exist.inventoryQuantity > 1) {    // si la herramienta en almacen es mayor a 1, no se realizan operaciones con status
                                if (exist.quantityAvailable > 0) {  // si hay cantidad disponible para el prestamo
                                    try {
                                        await connection.query("INSERT INTO loantools SET idLoan=?,idTool=?,status=1", [loanId, code]);
                                        // operaciones para actualizar la cantidad disponible
                                        const available = exist.quantityAvailable - 1;
                                        await connection.query("UPDATE tools SET quantityAvailable=? WHERE id=?", [available, code]);
                                    } catch (error) {
                                        console.log("ERROR: ", error);
                                        res.json({ message: 'Error' });
                                    }
                                } else if (exist.quantityAvailable === 0) {  // si no hay cantidad disponible, almacenar el codigo en no disponible
                                    const tool = {
                                        name: exist.name,
                                        code: exist.code
                                    }
                                    notAvailableCodes.push(tool);
                                }
                            }
                        } else {  // si no existe el codigo, se almacena en codigos no existentes
                            missingCodes.push(code);
                        }
                    }
                    res.json({ message: 'Success', missingCodes, notAvailableCodes, toolBreakCodes })
                } else {  // si no se encontro ningun codigo, no se realiza ningun registro
                    res.json({ message: 'Missing' })
                }
            } catch (error) {
                res.json({ message: 'Error' });
                console.log(error);
            }
        }
    } catch (error) {
        res.json({ message: "Error" });
        console.log('Error: ', error);
    }
}


// funcion para obtener todas las herramientas de cierto prestamo
const getToolsLoan = async (req, res) => {
    try {
        const { id } = req.params;
        const connection = await getConnection();
        // se obtiene las herramientas del prestamo mediante el id del prestamo
        const rows = await connection.query("SELECT * FROM loantools WHERE idLoan=?", id);
        const idRegister = rows.id;
        // constante para almacenar la informaciónde de la herramienta
        const tools = [];
        // iterar cada idTool para hacer una consulta de code y name sobre cada herramienta
        for (const row of rows) {
            const [toolRow] = await connection.query("SELECT code,name,description,idCategory FROM tools WHERE id=?", row.idTool);
            const [category] = await connection.query("SELECT name FROM toolcategories WHERE id=?",toolRow.idCategory);
            // pasamos los datos que necesitamos a un arreglo y despues pushear a tools, ya que se obtienen datos de tools y loantools
            const tool = {
                id: row.id, // id del registro de la herramienta en loantools
                idTool: row.idTool,
                code: toolRow.code,
                name: toolRow.name,
                category:category.name,
                status: row.status,
                description: toolRow.description
            }
            tools.push(tool);
        }
        res.json(tools);
    } catch (error) {
        console.log(error);
        res.json({ message: 'Error' });
    }
}

// funcion para registrar que se devolvio cierta herramienta
const toolReturn = async (req, res) => {
    try {
        // id de la herramienta
        const { id } = req.params;
        // id => de la herramienta,     idLoan => id del prestamo
        const { idLoan, name, idTool } = req.body;
        const connection = await getConnection();
        // obtener información de la herramienta sobre su cantidad, y validar si se hara operaciones con status
        const [result] = await connection.query("SELECT inventoryQuantity,quantityAvailable FROM tools WHERE id=?", [idTool]);
        // validar si la herramienta es la unica o cuenta con más en el almacen
        // si la herramienta es unica realizar operaciones con status
        if (result.inventoryQuantity === 1) {
            try {
                // se actualiza la informacion de la herramienta de tools
                await connection.query("UPDATE tools SET quantityAvailable=1, status=1 WHERE id=?", idTool);
                // se actualiza la informacion del registro de la herramienta de loantools
                await connection.query("UPDATE loantools SET status=0 WHERE id=? AND idTool=?", [id, idTool]);
                res.json({ message: 'Success' });
            } catch (error) {
                console.log(error);
                res.json({ message: 'Error' })
            }
        } else if (result.inventoryQuantity > 1) {  // si la herramienta no es unica, no manejar status y realizar operaciones de cantidades de inventario
            try {
                let quantityAvailable = result.quantityAvailable;
                quantityAvailable = quantityAvailable + 1;
                // se actualiza la informacion de la herramienta de tools
                await connection.query("UPDATE tools SET quantityAvailable=? WHERE id=?", [quantityAvailable, idTool]);
                await connection.query("UPDATE loantools SET status=0 WHERE idTool=? AND idLoan=?", [idTool, idLoan]);
                res.json({ message: 'Success' });
            } catch (error) {
                console.log(error);
                res.json({ message: 'Error' });
            }
        }
    } catch (error) {
        console.log(error);
        res.json({ message: 'Error' });
    }
}

// funcion para devolver herramienta rota de un prestamo
const toolBreak = async (req, res) => {
    try {
        const { id } = req.params;
        const { idTool, message } = req.body;
        const connection = await getConnection();
        // se actualiza el status de la herramienta si es la unica en almacen
        const [result] = await connection.query("SELECT inventoryQuantity,quantityAvailable FROM tools WHERE id=?", [idTool]);
        if (result.inventoryQuantity === 1) {
            // se modifica el status de la herramienta a 3
            await connection.query("UPDATE tools SET status=3 WHERE id=?", idTool);
            // se genera un reporte en la tabla reports, si el status=1 el reporte necesita atención, si status=0 el reporte ya se atendio
            // se valida el tipo de reporte (rota o perdida) mediante el mensaje que se recibe
            if (message === '¿Deseas reportar esta herramienta como rota?') {
                await connection.query("INSERT INTO reports SET idTool=?, description='La herramienta esta rota necesita reponerse', status=1", idTool);
            } else if (message === '¿Deseas reportar esta herramienta como perdida?') {
                await connection.query("INSERT INTO reports SET idTool=?, description='La herramienta esta perdida, necesita recuperarse', status=1", idTool);
            }
            // se actualiza la informacion del registro de la herramienta de loantools
            await connection.query("UPDATE loantools SET status=0 WHERE id=? AND idTool=?", [id, idTool]);
            res.json({ message: 'Success' });
        } else if (result.inventoryQuantity > 1) {
            // se actualiza el status de la herramienta en prestamo de que ya fue atendida
            await connection.query("UPDATE loantools SET status=0 WHERE id=?", id);
            // se realiza un reporte sobre la herramienta
            await connection.query("INSERT INTO reports SET idTool=?, description='La herramienta necesita reponerse', status=1", idTool);
            res.json({ message: 'Success' });
        }
    } catch (error) {
        console.log(error);
        res.json({ message: 'Error' });
    }
}

const finishLoan = async (req, res) => {
    try {
        const { id } = req.params;
        const connection = await getConnection();
        const result = await connection.query("SELECT id FROM loantools WHERE idLoan=? AND status=1", id)
        if (result.length > 0) {
            res.json({ message: 'Impossible' });
        } else {
            const currentDate = new Date();
            const formattedDate = currentDate.toISOString().split('T')[0];
            const connection = await getConnection();
            await connection.query("UPDATE loans SET dateReturn=? WHERE id=?", [formattedDate, id]);
            res.json({ message: 'Success' });
        }
    } catch (error) {
        console.log(error);
        res.json({ message: 'Error' });
    }
}

// funcion para agregar herramienta a prestamo existente
const addToolLoan = async (req, res) => {
    try {
        const { id } = req.params;
        const { codes } = req.body;
        const codeArray = codes.split(",").map(code => code.trim().replace(/^,|,$/g, ""));
        // constante para almacenar los codigos que no existan
        const missingCodes = [];
        // constante para almacenar los codigos que no esten disponibles
        const notAvailableCodes = [];
        // constante para almacenar los codigos que esten rotas
        const toolBreakCodes = [];
        if (codeArray.length == 1) {
            const connection = await getConnection();
            // se valida si el id existe
            const [exist] = await connection.query(`SELECT name,code,inventoryQuantity,quantityAvailable,status FROM tools WHERE id=?`, [codeArray[0]]);
            // validación si la consulta encontro algo
            if (exist && exist.name) {
                if (exist.inventoryQuantity === 1) {    // se valida si en almacen es unica pieza, se realiza operaciones con status
                    if (exist.status === 1) {
                        try {
                            // se registra el prestamo con relacion al id del prestamo creado "loanId"
                            await connection.query("INSERT INTO loantools SET idLoan=?,idTool=?,status=1", [id, codeArray]);
                            // se actualiza el status de la herramienta solicitada
                            await connection.query("UPDATE tools SET quantityAvailable=0, status=2 WHERE id=?", codeArray);
                            res.json({ message: 'Success', notAvailableCodes, toolBreakCodes, missingCodes });
                        } catch (error) {
                            console.log('Error',error);
                            res.json({ message: 'Error' });
                        }
                    } else if (exist.status === 2) {
                        const tool = {
                            name: exist.name,
                            code: exist.code
                        }
                        notAvailableCodes.push(tool);
                        res.json({ message: 'Not Available', notAvailableCodes });
                    } else if (exist.status === 3) {
                        const tool = {
                            name: exist.name,
                            code: exist.code
                        }
                        toolBreakCodes.push(tool);
                        res.json({ message: "Broken", toolBreakCodes });
                    }
                } else if (exist.inventoryQuantity > 1) {   // se valida si la cantidad en inventario es mayor a uno, no se maneja status
                    if (exist.quantityAvailable > 0) {  // si hay cantidad disponible para el prestamo
                        try {
                            // se registra la herramietna con el id del prestamo "loanId"
                            await connection.query("INSERT INTO loantools SET idLoan=?,idTool=?,status=1", [id, codeArray]);
                            // operaciones para actualizar la cantidad disponible
                            const available = exist.quantityAvailable - 1;
                            await connection.query("UPDATE tools SET quantityAvailable=? WHERE id=?", [available, codeArray]);
                            res.json({ message: 'Success' });
                        } catch (error) {
                            console.log("ERROR: ", error);
                            res.json({ message: 'Error' });
                        }
                    } else if (exist.quantityAvailable === 0) {  // si no hay cantidad disponible, almacenar el codigo en no disponible
                        const tool = {
                            name: exist.name,
                            code: exist.code
                        }
                        notAvailableCodes.push(tool);
                        res.json({ message: 'Not Available', notAvailableCodes });
                    }
                }

            } else {
                missingCodes.push(codeArray);
                res.json({ message: "Missing", missingCodes })
            }
        } else if (codeArray.length > 1) {
            const connection = await getConnection();
            const found = [];
            try {
                // se crea una validacion si el codigo existe
                for (const code of codeArray) {
                    const [exist] = await connection.query(`SELECT name FROM tools WHERE id=?`, [code]);
                    if (exist && exist.name) {
                        found.push(code);
                    } else {
                        const coding = {
                            code: code
                        }
                        missingCodes.push(coding);
                    }
                }

                // si algun codigo de la lista existe hacer el prestamo
                if (found.length > 0) {
                    const connection = await getConnection();
                    for (const code of found) {
                        // obtenemos informacion de la herramienta
                        const [exist] = await connection.query(`SELECT name,code,inventoryQuantity,quantityAvailable,status FROM tools WHERE id=?`, [code]);
                        console.log("Existe", exist);
                        if (exist && exist.name) { // si existen la herramienta realizar el prestamo
                            if (exist.inventoryQuantity === 1) {    // si la herramienta en almacen es 1, se realizan operaciones con status
                                if (exist.status === 1) {  // si hay herramienta disponible, realizar el prestamo
                                    try {
                                        await connection.query("INSERT INTO loantools SET idLoan=?,idTool=?,status=1", [id, code]);
                                        await connection.query("UPDATE tools SET quantityAvailable=0, status=2 WHERE id=?", code);
                                    } catch (error) {
                                        console.log('Error', error);
                                        res.json({ message: 'Error' });
                                    }
                                } else if (exist.status === 2) {  // si no hay herramienta disponible, almacenar el codigo en no disponible
                                    const tool = {
                                        name: exist.name,
                                        code: exist.code
                                    }
                                    notAvailableCodes.push(tool);
                                } else if (exist.status === 3) {
                                    const tool = {
                                        name: exist.name,
                                        code: exist.code
                                    }
                                    toolBreakCodes.push(tool);
                                }
                            } else if (exist.inventoryQuantity > 1) {    // si la herramienta en almacen es mayor a 1, no se realizan operaciones con status
                                if (exist.quantityAvailable > 0) {  // si hay cantidad disponible para el prestamo
                                    try {
                                        await connection.query("INSERT INTO loantools SET idLoan=?,idTool=?,status=1", [id, code]);
                                        // operaciones para actualizar la cantidad disponible
                                        const available = exist.quantityAvailable - 1;
                                        await connection.query("UPDATE tools SET quantityAvailable=? WHERE id=?", [available, code]);
                                    } catch (error) {
                                        console.log("ERROR: ", error);
                                        res.json({ message: 'Error' });
                                    }
                                } else if (exist.quantityAvailable === 0) {  // si no hay cantidad disponible, almacenar el codigo en no disponible
                                    const tool = {
                                        name: exist.name,
                                        code: exist.code
                                    }
                                    notAvailableCodes.push(tool);
                                }
                            }
                        } else {  // si no existe el codigo, se almacena en codigos no existentes
                            missingCodes.push(code);
                        }
                    }
                    res.json({ message: 'Success', missingCodes, notAvailableCodes, toolBreakCodes })
                } else {  // si no se encontro ningun codigo, no se realiza ningun registro
                    res.json({ message: 'Missing' })
                }
            } catch (error) {
                res.json({ message: 'Error' });
                console.log(error);
            }
        }
    } catch (error) {
        console.log(error);
        res.json({ message: 'Error' });
    }
}

export const methods = {
    deleteloan,
    getloans,
    addloan,
    getToolsLoan,
    toolReturn,
    toolBreak,
    finishLoan,
    addToolLoan
}