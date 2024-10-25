import { Router } from "express";
import { methods as reportController} from "../controllers/reports.controller";


const router = Router();

router.get("/",reportController.getReports);
router.put("/:id",reportController.repair);
router.delete("/:id",reportController.deleteToolBreak);
router.delete("/report/:id",reportController.deleteReport);

export default router;