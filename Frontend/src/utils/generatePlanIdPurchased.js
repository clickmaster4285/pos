import IndexModel from "../models/indexModel.js";

// Generate unique plan ID: COMPANYID-USERID-(YYYY_MM_DD_HH_mm_ss_mmm)_SEQ
export const generatePlanId = async (companyId, userId) => {
  const date = new Date();

  // Format date and time
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  const second = String(date.getSeconds()).padStart(2, '0');
  const millisecond = String(date.getMilliseconds()).padStart(3, '0');

  // Create a readable timestamp
  const dateStr = `${year}_${month}_${day}_${hour}_${minute}_${second}_${millisecond}`;

  // Find the company to get current number of plans
  const company = await IndexModel.Company.findOne({ companyId });

  // If company not found, handle gracefully
  let sequence = 1;
  if (company) {
      // Get current plan count
      const planCount = Array.isArray(company.plan) ? company.plan.length : 0;
      sequence = planCount + 1;
    
  }


  // Generate planId
  const planId = `${companyId}-${userId}-${dateStr}_${sequence}`;

  return planId;
};
