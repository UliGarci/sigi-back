import { Router } from "express";
import { methods as toolController } from "../controllers/tool.controller";

const router=Router();

router.get("/",toolController.gettools);
router.post("/",toolController.addtool);
router.get("/:id",toolController.gettool);
router.delete("/:id",toolController.deletetool);
router.put("/:id",toolController.updatetool);
router.put("/repair/:id",toolController.repair);

export default router;