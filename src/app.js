import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
//Routes
import toolRoutes from './routes/tool.routes';
import userRoutes from './routes/user.routes';
import toolcategoryRoutes from './routes/toolcategory.routes';
import loanRoutes from './routes/loan.routes';
import loginRoutes from './routes/login.routes';
import reportRoutes from './routes/report.routes';
import listqrRoutes from './routes/listqr.routes';

const app=express();

//SETTINGS
const PORT = process.env.PORT || 4000;
app.set("port",PORT);

//MIDDLEWARES
app.use(morgan("dev"));
app.use(express.json({limit:'10mb'}));
app.use(cors());

//ROUTES
//tools
app.use("/api/tools",toolRoutes);
//users
app.use("/api/users",userRoutes);
//loans
app.use("/api/loans",loanRoutes);
//toolcategories
app.use("/api/toolcategories",toolcategoryRoutes);
//login
app.use("/api/login",loginRoutes);
//reports
app.use("/api/reports",reportRoutes);
// list QR
app.use("/api/listqr",listqrRoutes);
export default app;