// utils/generateUniqueCompanyId.js
import IndexModel from '../models/indexModel.js';

// Step 2: Generate unique companyId by checking DB
export async function fetchToolLogoName() {
  const toolSuperAdmin = await IndexModel.User.findOne({role:"superAdmin"}).select("toolName toolLogo");
  const toolNameLogo = toolSuperAdmin
  return toolNameLogo;
}

export async function fetchIndustryName(companyId) {
  const user = await IndexModel.User.findOne({companyId:companyId}).select("role");
  if(user.role === "superAdmin"){
  return null;
  }
  const IndustryName = await IndexModel.Company.findOne({companyId, deleted:false, isActive:true}).select("industryName owner");
// console.log("the IndustryName: ",IndustryName)
  return IndustryName.industryName;
}