import { Router, type IRouter } from "express";
import healthRouter from "./health";
import menuproRouter from "./menupro";

const router: IRouter = Router();

router.use(healthRouter);
router.use(menuproRouter);

export default router;
