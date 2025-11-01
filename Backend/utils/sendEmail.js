import nodemailer from 'nodemailer';
import handlebars from 'handlebars';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { fetchToolLogoName, fetchIndustryName } from "../utils/fetchToolLogoName.js";

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),  // Ensure it's a number
    secure: process.env.EMAIL_PORT === '465',  // true for 465 (SSL), false for 587 (STARTTLS)
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
};

// Load and compile handlebars email template
const loadTemplate = (templateName) => {
  const templatePath = path.join(__dirname, "../templates/emails", `${templateName}.hbs`);

  if (!fs.existsSync(templatePath)) {
    throw new Error(`Email template ${templateName} not found`);
  }

  const templateSource = fs.readFileSync(templatePath, "utf8");
  return handlebars.compile(templateSource);
};

// Send email
const sendEmail = async (options) => {
  try {
    const transporter = createTransporter();

    let html = options.html;

    // Compile template if provided
    if (options.template) {
      const template = loadTemplate(options.template);
      html = template(options.data || {});
    }
    const toolNameLogo = await fetchToolLogoName()
    // toolName: toolNameLogo.toolName,
    const mailOptions = {
      from: `${toolNameLogo.toolName} <${process.env.EMAIL_FROM}>`,
      to: options.email,
      subject: options.subject,
      html,
      text: options.text,
    };

    const info = await transporter.sendMail(mailOptions);

    return info;
  } catch (error) {
    console.error("Email sending failed:", error);
    throw error;
  }
};

export default sendEmail;