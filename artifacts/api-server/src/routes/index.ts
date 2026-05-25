import { Router, type IRouter } from "express";
import healthRouter from "./health";
import ipoRouter from "./ipo";
import reportRouter from "./report";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/report", reportRouter);
router.use("/ipo", ipoRouter);

export default router;
