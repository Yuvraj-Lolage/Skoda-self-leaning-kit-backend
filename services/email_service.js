const fs = require("fs");
const path = require("path");
const nodemailer = require("nodemailer");

require("dotenv").config();

const TEMPLATE_PATH = path.join(
  __dirname,
  "..",
  "templates",
  "email",
  "new_user_welcome.html"
);

function escapeHtml(s) {
  if (s == null) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function roleLabel(role) {
  const r = String(role || "User").toLowerCase().replace(/\s+/g, "_");
  const map = {
    user: "User",
    admin: "Admin",
    super_admin: "Super Admin",
  };
  return map[r] || role || "User";
}

function createTransport() {
  if (process.env.SMTP_SERVICE) {
    return nodemailer.createTransport({
      service: process.env.SMTP_SERVICE,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  if (!process.env.SMTP_HOST) {
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth:
      process.env.SMTP_USER && process.env.SMTP_PASS
        ? {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          }
        : undefined,
  });
}

function isEmailConfigured() {
  if (process.env.SMTP_SERVICE && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return true;
  }
  if (process.env.SMTP_HOST) {
    return true;
  }
  return false;
}

/**
 * @param {{ to: string; name: string; email: string; password: string; role: string }} params
 * @returns {Promise<{ sent: boolean; skipped?: boolean; error?: string }>}
 */
async function sendNewUserCredentials(params) {
  const { to, name, email, password, role } = params;

  if (!isEmailConfigured()) {
    console.warn(
      "[email] SMTP not configured (set SMTP_SERVICE or SMTP_HOST). Skipping welcome email."
    );
    return { sent: false, skipped: true };
  }

  const transport = createTransport();
  if (!transport) {
    return { sent: false, skipped: true };
  }

  const from =
    process.env.MAIL_FROM ||
    process.env.SMTP_USER ||
    '"VG Academy" <noreply@localhost>';

  const appName =
    process.env.APP_PUBLIC_NAME || "Volkswagen Group Academy";

  let html = fs.readFileSync(TEMPLATE_PATH, "utf8");
  const year = new Date().getFullYear();

  const repl = {
    APP_NAME: escapeHtml(appName),
    USER_NAME: escapeHtml(name),
    USER_EMAIL: escapeHtml(email),
    USER_PASSWORD: escapeHtml(password),
    ROLE_LABEL: escapeHtml(roleLabel(role)),
    YEAR: String(year),
  };

  for (const [key, val] of Object.entries(repl)) {
    html = html.split(`{{${key}}}`).join(val);
  }

  const subject =
    process.env.NEW_USER_EMAIL_SUBJECT ||
    `Your ${appName} account is ready`;

  try {
    await transport.sendMail({
      from,
      to,
      subject,
      html,
      text: [
        `Hello ${name},`,
        "",
        "An administrator has created an account for you. This email is for your information only.",
        "",
        `Email: ${email}`,
        `Temporary password: ${password}`,
        `Role: ${roleLabel(role)}`,
        "",
        "Please change your password after first login if your organisation allows it.",
        "If you did not expect this message, contact your administrator.",
      ].join("\n"),
    });
    return { sent: true };
  } catch (err) {
    console.error("[email] Failed to send welcome email:", err.message);
    return { sent: false, error: err.message };
  }
}

module.exports = {
  sendNewUserCredentials,
  isEmailConfigured,
};
