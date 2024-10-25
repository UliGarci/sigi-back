import { Router } from "express";
import { methods as loanController} from "../controllers/loan.controller";

const router = Router();

// router.get("/",verifyToken,loanController.getloans);
router.get("/",loanController.getloans);
router.get("/loantools/:id",loanController.getToolsLoan);
router.post("/",loanController.addloan);
router.put("/:id",loanController.addToolLoan);
router.put("/returntool/:id",loanController.toolReturn);
router.put("/breaktool/:id",loanController.toolBreak);
router.put("/finishloan/:id",loanController.finishLoan);
router.delete("/:id",loanController.deleteloan);

export default router;