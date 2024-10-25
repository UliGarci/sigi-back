import jwt from 'jsonwebtoken';

const secretKey = 'sigi';

const verifyToken = (req,res,next)=>{
    const token = req.headers.authorization;
    if (!token) {
        return res.status(401).json({ message: 'Token not provided' });
      }

    jwt.verify(token,secretKey,(err,decoded)=>{
        if (err) {
            if (err.name === 'TokenExpiredError') {
              return res.status(401).json({ message: 'Token expired' });
            }
            if (err.name === 'JsonWebTokenError') {
              return res.status(401).json({ message: 'Invalid token' });
            }else{
              res.json("success");
            }
            // Otros errores JWT
            return res.status(500).json({ message: 'Internal server error' });
          }
        req.user = decoded;
        next();
    })
}

export default verifyToken;