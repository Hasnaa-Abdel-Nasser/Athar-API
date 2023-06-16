import userModel from '../../../database/models/user.js';
import { catchError } from "../../middleware/catch.errors.js";
import { AppError } from "../../utils/response.error.js";
import { ApiFeatures } from "../../utils/api.features.js";

export const adduser = catchError(async(req,res,next)=>{
    const user = await userModel.insertMany(req.body);
    res.status(200).json({message:'success',user });
});

export const getusers = catchError(async(req,res,next)=>{
    // const users = await userModel.find();
    // res.status(200).json({ message: "success", users });
    const jobs = await userModel.find();
    const titles = jobs.map(job => job._id);
    res.status(200).json(titles);
});
export const getuserdata = catchError(async(req,res,next)=>{
    let features = new ApiFeatures(userModel.findById({_id:req.query.id}), req.query)
    .fields()
  const user = await features.mongooseQuery;
    res.status(200).json({ message: "success", user });
});
export const deleteusers = catchError(async(req,res,next)=>{
    await userModel.deleteMany();
    res.status(200).json({ message: "success"});
});