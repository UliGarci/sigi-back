import {getConnection} from '../databases/database'

const gettoolcategories=async(req,res)=>{
    try {
        const connection = await getConnection();
        const result = await connection.query("SELECT * FROM toolcategories");
        res.json(result);
    } catch (error) {
        res.status(500);
        res.json({message:"Error"});
    }
}

const gettoolcategory=async(req,res)=>{
    try {
        const {id} = req.params;
        if(id==undefined){
            res.status(400).json({message:"Bad Request"});
        }
        const connection = await getConnection();
        const [result] = await connection.query("SELECT * FROM toolcategories WHERE id = ?",id);
        res.json(result);
    } catch (error) {
        res.status(500);
        res.json({message:"Error"});
    }
}

const addtoolcategory=async(req,res)=>{
    try {
        const {name} = req.body;
        if(name==undefined){
            res.status(400).json({message:"Bad Request"});
        }
        const connection = await getConnection();
        const result = await connection.query("SELECT * from toolcategories WHERE name = ?",name);
        console.log('NOMBRE:',name);
        console.log(result);
        if(result.length<1){
            await connection.query("INSERT INTO toolcategories SET name=?",name);
            res.json({message:"Success"});
        }else{
            res.json({message: "Already exists"});
        }
    } catch (error) {
        res.status(500);
        res.json({message:"Error"});
    }
}

const deletetoolcategory=async(req,res)=>{
    try {
        const {id} = req.params;
        const connection = await getConnection();
        await connection.query("DELETE FROM toolcategories WHERE id = ?",id);
        res.json({message:"Success"});
    } catch (error) {
        res.status(500);
        res.json({message:"Error"});
    }
}

const updatetoolcategory=async(req,res)=>{
    try {
        const {id} = req.params;
        const {name} = req.body;
        if(id==undefined){
            res.status(400).json({message:"Bad Request"});
        }
        const connection = await getConnection();
        const result = await connection.query("SELECT id FROM tools WHERE idtoolcategory = ?",id);
        if(result>0){
            res.json({message:"Cannot Update"});
        }else{
            await connection.query("UPDATE toolcategories SET ? WHERE id = ?",[name,id]);
            res.json({message:"Success"});
        }
    } catch (error) {
        res.status(500);
        res.json({message:"Error"});
    }
}

export const methods={
    gettoolcategories,
    gettoolcategory,
    addtoolcategory,
    deletetoolcategory,
    updatetoolcategory
}