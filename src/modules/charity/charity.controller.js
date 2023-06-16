import charityModel from '../../../database/models/charity.js';
import { catchError } from "../../middleware/catch.errors.js";
import { AppError } from "../../utils/response.error.js";
import { ApiFeatures } from "../../utils/api.features.js";

export const addcharity = catchError(async(req,res,next)=>{
    const charity = await charityModel.insertMany(req.body);
    res.status(200).json({message:'success',charity });
});

export const getcharity = catchError(async(req,res,next)=>{
    const total = await charityModel.countDocuments({});
      const totalPages = Math.ceil(total / 12);
      let features = new ApiFeatures(charityModel.find(), req.query)
        .sort()
        .paginate(totalPages)
        .fields()
        .filter();
      const charities = await features.mongooseQuery;
      res
        .status(200)
        .json({ message: "success", totalPages, page: features.page, charities });
});
export const charity = catchError(async(req,res)=>{
  const charity = await charityModel.findById(req.query.id);
  res.status(200).json({message:'success' , charity})
})
export const deleteusers = catchError(async(req,res,next)=>{
    await charityModel.deleteMany();
    res.status(200).json({ message: "success"});
});
export const verifyCharity = catchError(async(req,res,next)=>{
  const charity = await charityModel.findById(req.query.id);
  if(!charity) return next(new AppError("Not Found", 400));
  charity.verified = !charity.verified;
  await charity.save();
    res.status(200).json({ message: "success"});
})