import express from "express";
import * as endPoint from "./user.controller.js";
const userRouter = express.Router();

userRouter
  .route("/")
  .post(endPoint.adduser)
  .delete(endPoint.deleteusers);
  userRouter.get("/getusers", endPoint.getusers);
  userRouter.get("/userdata" , endPoint.getuserdata);
export default userRouter;
