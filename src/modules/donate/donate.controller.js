import donateModel from "../../../database/models/donation.js";
import { catchError } from "../../middleware/catch.errors.js";
import { AppError } from "../../utils/response.error.js";
import { ApiFeatures } from "../../utils/api.features.js";
import userModel from "../../../database/models/user.js";
import BoxModel from "../../../database/models/donationBox.js";
import * as manage from "./donation.manage.js";

export const newDonate = catchError(async (req, res, next) => {
  const { userId, donationBox, amount} = req.body;
  console.log(req.body)
  const [user, box] = await Promise.all([
    userModel.findById(userId),
    BoxModel.findById(donationBox),
  ]);
  if (!user || !box) next(new AppError("Not found inputs", 400));
  // Edit amount in donation box
  await manage.updateDonationBox(box, amount);
  await manage.processFinancialTransaction(box, amount);   // Finance process
  let donate = await donateModel.insertMany(req.body);
  res.json({ message: "success", donations: donate });
});

export const getdonations = catchError(async (req, res, next) => {
  const { _id } = req.query;
  let features = new ApiFeatures(donateModel.find({ userId: _id }), req.query)
    .sort()
    .fields();
  const donations = await features.mongooseQuery.populate("donationBox","charityId countryId completed categories");
  res
    .status(200)
    .json({ message: "success", donations });
});
export const deleted = catchError(async(req,res)=>{
  await donateModel.deleteMany();
  res.json('success')
})
