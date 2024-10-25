import { Router } from "express";
import { methods as toolCategoryController } from "../controllers/toolcategory.controller";

const router = Router();

router.get("/:id",toolCategoryController.gettoolcategory);
router.get("/",toolCategoryController.gettoolcategories);
router.post("/",toolCategoryController.addtoolcategory);
router.put("/:id",toolCategoryController.updatetoolcategory);
router.delete("/:id",toolCategoryController.deletetoolcategory);

export default router;
