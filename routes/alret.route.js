import express from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { setAlert } from "../controller/alret.controller.js";

const route = express.Router();

route.post("/", authMiddleware, setAlert);

export default route;