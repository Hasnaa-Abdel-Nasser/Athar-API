import convoyModel from "../../../database/models/convoy.js";
import charityModel from "../../../database/models/charity.js";
import countryModel from "../../../database/models/country.js";
import userModel from "../../../database/models/user.js";
import { catchError } from "../../middleware/catch.errors.js";
import { AppError } from "../../utils/response.error.js";
import { ApiFeatures } from "../../utils/api.features.js";
import * as manage from "./convoys.manage.js";
import { createInvoice } from "../../utils/pdf.js";

export const addConvoy = catchError(async (req, res, next) => {
  const { charityId, countryId, jobs, totalVolunteers, startDate, endDate } =
    req.body;
  if (manage.validateDates(startDate, endDate)) {
    return next(new AppError("Invalid start or end date", 400));
  }
  // check if found charity in db and country.
  const [findCharity, findCountry] = await manage.findCountryAndCharity(
    countryId,
    charityId
  );
  if (!findCountry || !findCharity)
    return next(new AppError("Could not find the charity or country", 400));
  // check if charity input invalid range to volunteers.
  // valid range ---> 500 volunteers
  const totalCount = jobs.reduce((acc, job) => acc + job.count, 0);
  if (totalCount > 500 || totalCount !== totalVolunteers) {
    return next(
      new AppError("Invalid number of volunteers for the given jobs", 400)
    );
  }
  findCharity.convoysNumber += 1;
  await findCharity.save();
  findCountry.convoysNumber += 1;
  await findCountry.save();
  const convoy = await convoyModel.insertMany(req.body);
  res.status(200).json({ message: "success", convoy });
});

export const addUserToConvoy = async (req, res,next) => {
  try {
    const { _id, userId } = req.body;

    const user = await userModel.findOne({ _id: userId });
    if (!user)  return next(new AppError("Could not add user to convoy", 400));

    let convoy = await convoyModel.findOne({
      _id,
      "jobs.job": user.job.toLowerCase(),
      completed: false,
    });
    let convoyOther = await convoyModel.findOne({
      _id,
      "jobs.job": 'other',
      completed: false,
    });
    console.log(convoyOther)
    if (!convoy && !convoyOther) return next(new AppError("Could not add user to convoy", 400));
    //  check if the job section has been completed or not.
    let jobData;
    if(convoy) jobData =  user.job.toLowerCase();
    else{ 
      jobData = 'other';
      convoy = convoyOther;
    }
    const jobIndex = convoy.jobs.findIndex((obj) => obj.job === jobData);
    const job = convoy.jobs[jobIndex];

    if (job.completed) return next(new AppError("Cannot add user to a completed job.", 400));

    const beforeAddUser = job.usersId.length;
    convoy.jobs[jobIndex].usersId.addToSet(userId);
    const updatedConvoy = await convoy.save();
    const totalUsers = job.usersId.length;

    if (totalUsers == beforeAddUser) return next(new AppError("User already in this convoy.", 400));

    await userModel.findByIdAndUpdate(userId, { $addToSet: { convoys: _id } });

    if (job.usersId.length === job.count) {
      job.completed = true;
      await updatedConvoy.save();
    }

    const jobsCompleted = updatedConvoy.jobs.every((job) => job.completed);
    if (jobsCompleted) {
      updatedConvoy.completed = true;
      await updatedConvoy.save();
    }

    await Promise.all([
      charityModel.findByIdAndUpdate(convoy.charityId, { $inc: { volunteers: 1 } }),
      countryModel.findByIdAndUpdate(convoy.countryId, { $inc: { volunteers: 1 } }),
    ]);

    res.status(200).json({ message: "success", user });
  } catch (error) {
    console.log(error)
  }
};

export const deleteUserFromConvoy = catchError(async (req, res, next) => {
  const { _id, userId } = req.body;
  const user = await userModel.findOneAndUpdate(
    //check if the user exists in the database and has joined this convoy.
    { _id: userId, convoys: _id },
    { $pull: { convoys: _id } }
  );
  if (!user) return next(new AppError("User not found in this convoy", 400));
  let convoy = await convoyModel.findOneAndUpdate(
    // Delete user from convoy data
    { _id, "jobs.job": user.job.toLowerCase() },
    {
      $pull: { "jobs.$[job].usersId": userId },
      $set: { "jobs.$[job].completed": false, completed: false },
    },
    {
      new: true,
      arrayFilters: [{ "job.job": user.job.toLowerCase() }], // to only update the job field in those objects
    }
  );
  if (!convoy){
    let convoyOther = await convoyModel.findOneAndUpdate(
      // Delete user from convoy data
      { _id, "jobs.job": 'other' },
      {
        $pull: { "jobs.$[job].usersId": userId },
        $set: { "jobs.$[job].completed": false, completed: false },
      },
      {
        new: true,
        arrayFilters: [{ "job.job": 'other' }], // to only update the job field in those objects
      }
    );
    if(!convoyOther) return next(new AppError("Faild remove user from this convoy", 400));
      convoy = convoyOther;
  }
  
    await charityModel.findByIdAndUpdate(convoy.charityId, {
    $inc: { volunteers: -1 },
  });
  await countryModel.findByIdAndUpdate(convoy.countryId, {
    $inc: { volunteers: -1 },
  });
  res.status(200).json({ message: "success" });
});

export const deleteConvoy = catchError(async (req, res, next) => {
  const { _id } = req.params;
  const convoy = await convoyModel.findByIdAndDelete(_id);
  console.log(convoy);
  if (!convoy) return next(new AppError("Not found convoy", 400));
  const jobs = convoy.jobs;
  let usersNumber = 0;
  for (const job of jobs) {
    // to delete convoy from all users
    usersNumber += job.usersId.length;
    for (const user of job.usersId) {
      await userModel.findByIdAndUpdate(user, { $pull: { convoys: _id } });
    }
  } // use "for" instead "map" --> map return array and take from memory , so "for loop" high performance from "map"
  await charityModel.findByIdAndUpdate(convoy.charityId, {
    $inc: { convoysNumber: -1, volunteers: -usersNumber },
  });
  await countryModel.findByIdAndUpdate(convoy.countryId, {
    $inc: { convoysNumber: -1, volunteers: -usersNumber },
  });
  res.status(200).json({ message: "success" });
});

export const getConvoys = catchError(async (req, res, next) => {
  const { id } = req.query;
  const user = await userModel.findById(id);
  if (!user) {
    return next(new AppError("User not found.", 400));
  }
  const total = await convoyModel.countDocuments({
    jobs: {
      $elemMatch: {
        job: { $in: [user.job, "other"] },
        usersId: { $not: { $eq: id } },
        completed: false,
      },
    },
  });
  const totalPages = Math.ceil(total / 10);
  let features = new ApiFeatures(
    convoyModel.find(
      {
        jobs: {
          $elemMatch: {
            job: { $in: [user.job, "other"] },
            usersId: { $not: { $eq: id } },
            completed: false,
          },
        },
      },
      {
        jobs: {
          $elemMatch: {
            job: { $in: [user.job, "other"] },
            completed: false
          },
        },
        startDate: 1,
        endDate: 1,
      }
    ),
    req.query
  )
    .paginate(totalPages)
    .sort()
    .fields();
  const convoys = await features.mongooseQuery.populate(
    "charityId",
    "name image verified"
  );
  res
    .status(200)
    .json({ message: "success", totalPages, page: features.page, convoys });
});

export const getUserConvoys = catchError(async (req, res, next) => {
  const { id } = req.query;
  const user = await userModel.findById(id);
  if (!user) return next(new AppError("Not found user", 404));
  res.status(200).json({ message: "success", convoys: user.convoys });
});

export const getConvoysToCharity = catchError(async (req, res, next) => {
  let features = new ApiFeatures(
    convoyModel.find({ charityId: req.query.id }),
    req.query
  )
    .sort()
    .fields()
    .filter();
  const convoys = await features.mongooseQuery;
  res
    .status(200)
    .json({ message: "success", convoys });
});

export const dashboardCharity = catchError(async (req, res, next) => {
  const charity = await charityModel.findById(req.query.id, {
    name: 1,
    image: 1,
    donationBoxNumber: 1,
    convoysNumber: 1,
    volunteers: 1,
  });
  if (!charity) return next(new AppError("Not found charity", 404));
  let features = new ApiFeatures(
    convoyModel.find({ charityId: req.query.id }, { charityId: 0 }),
    req.query
  )
    .sort()
    .fields()
    .filter();
  const convoys = await features.mongooseQuery;
  res.status(200).json({ message: "success", charity, convoys });
});
export const convoysPdf = catchError(async (req, res, next) => {
  const { id } = req.params;
  const convoy = await convoyModel
    .findById(id)
    .populate({ path: "jobs.usersId", select: "-_id name phone country job national_id" });
  if (!convoy) return next(new AppError("Convoy not fount or not completed"));
  const pdf = await createInvoice(convoy);
  console.log(pdf);
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", 'inline; filename="convoy.pdf"');
  res.send(pdf);
});
