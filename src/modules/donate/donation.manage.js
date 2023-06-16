import charityModel from "../../../database/models/charity.js";
import countryModel from "../../../database/models/country.js";
import financeModel from "../../../database/models/finance.js";

export const updateDonationBox = async (box, amount) => {
  box.raised += amount;
  if (box.raised >= box.amount) {
    box.left = 0;
    box.completed = true;
  } else {
    box.left -= amount;
  }
  console.log(box);
  return await box.save();
};

export const processFinancialTransaction = async (box, amount) => {
  const currentDate = new Date().toISOString().slice(0, 10);
  let financeEntry = await financeModel.findOne({ date: currentDate });
  if (!financeEntry) {
    financeEntry = await financeModel.create({
      date: currentDate,
      finance: [],
    });
  }
  let financeEntryIndex = -1;
  if(financeEntry.finance.length > 0){
    financeEntryIndex = financeEntry.finance.findIndex((entry) => entry.box.toString() === box._id.toString());
    console.log(financeEntry.finance);
  }
  // console.log(currentDate , financeEntry , financeEntryIndex);

  if (financeEntryIndex !== -1) {
    financeEntry.finance[financeEntryIndex].amount += amount;
  } else {
    financeEntry.finance.push({
      box: box._id,
      amount:amount,
      country: box.countryId.name,
      categories: box.categories,
      charity: box.charityId.name,
    });
  }

  await financeEntry.save();
  // console.log(financeEntry.finance[financeEntryIndex].amount)
  return financeEntry;
};
