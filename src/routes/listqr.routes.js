import { Router } from "express";
import { methods as listqrController } from "../controllers/listqr.controller";

const router = Router();

router.get("/",listqrController.listQR);

export default router;