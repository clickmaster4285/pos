// utils/generateUniqueCompanyId.js
import IndexModel from '../models/indexModel.js';

// Step 2: Generate unique companyId by checking DB
export async function fetchToolLogoName() {
  const toolSuperAdmin = await IndexModel.User.findOne({role:"superAdmin"}).select("toolName toolLogo");

  const toolNameLogo = toolSuperAdmin
  return toolNameLogo;
}