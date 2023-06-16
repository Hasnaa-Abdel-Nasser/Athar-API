import mongoose from "mongoose";

const BoxSchema = mongoose.Schema(
  {
    title:{
        type:String,
        minlength:[20 , 'so short title to donation box'],
        trim: true,
    },
    charityId: {
      type: mongoose.Types.ObjectId,
      required: [true, "charity Id required"],
      ref: "charity",
    },
    countryId: {
      type: mongoose.Types.ObjectId,
      ref: "country",
      required: [true, "country Id required"],
    },
    amount: {
      type: Number,
      required: [true, "Donation box amount required"],
      min: 1,
    },
    raised: {
      type: Number,
      default: 0,
    },
    left: {
      type: Number,
      default: 1,
    },
    categories: [
      {
        type:String,
        lowercase: true,
      }
    ],
    completed: {
      type: Boolean,
      default: false,
    }
  },
  { timestamps: true }
);

BoxSchema.pre(/^find/, function() {
  this.populate('countryId', 'name _id');
  this.populate('charityId', 'name image verified')
});
const BoxModel = mongoose.model("donationBox", BoxSchema);
export default BoxModel;
