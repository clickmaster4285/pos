import mongoose from 'mongoose';
import IndexModel from '../models/indexModel.js';
import { generateUniqueUserId } from '../utils/generateUniqueUserId.js';

// Function to create a superAdmin user if none exists
const createSuperAdmin = async () => {
  try {
    // Check if a superAdmin already exists
    const superAdminExists = await IndexModel.User.findOne({ role: "superAdmin" });
    if (superAdminExists) {
      console.log("SuperAdmin already exists:", superAdminExists.email);
      return;
    }

    // Get default credentials from env or fallback
    const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || "superadmin123@example.com";
    const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD || "123";
    const superAdminName = process.env.SUPER_ADMIN_NAME || "Super Admin";


    // Hash the password
    // const hashedPassword = await bcrypt.hash(superAdminPassword, 10);
    // Create new superAdmin
    const superAdmin = new IndexModel.User({
      name: superAdminName,
      userId: await generateUniqueUserId(superAdminName),
      email: superAdminEmail,
      password: superAdminPassword,
      role: "superAdmin",
      verified: true,
      mfaEnabled: false,
      permissions: ["full-access"],
      status: {
      isaccepted:true,
      performedBy: "superAdmin",
    },
    history: [{
        action: 'Super Admin Create auto',
        performedBy: "superAdmin"
      }],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await superAdmin.save();
    console.log("✅ SuperAdmin created successfully:", superAdminEmail);
  } catch (error) {
    console.error("❌ Error creating SuperAdmin:", error.message);
  }
};

export default createSuperAdmin;