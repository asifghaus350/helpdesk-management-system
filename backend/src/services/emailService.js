const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

const sendPasswordResetEmail = async (email, resetUrl) => {
  const mailOptions = {
    from: `"HelpDesk Support" <${process.env.SMTP_USER}>`,
    to: email,
    subject: "HelpDesk - Password Reset Request",
    text: `
Hello,

We received a request to reset your HelpDesk account password.

Use the following link to reset your password:

${resetUrl}

This password reset link will expire in 15 minutes.

If you did not request a password reset, you can safely ignore this email.

Regards,
HelpDesk Support Team
    `,
    html: `
      <div style="font-family: Arial, sans-serif; background:#f8fafc; padding:40px;">
        <div style="max-width:600px; margin:auto; background:#ffffff; padding:32px; border-radius:12px; border:1px solid #e2e8f0;">

          <h2 style="color:#1e293b; margin-bottom:16px;">
            HelpDesk Password Reset
          </h2>

          <p style="color:#475569; line-height:1.6;">
            We received a request to reset your HelpDesk account password.
          </p>

          <p style="color:#475569; line-height:1.6;">
            Click the button below to create a new password:
          </p>

          <div style="margin:28px 0;">
            <a
              href="${resetUrl}"
              style="
                display:inline-block;
                background:#2563eb;
                color:#ffffff;
                text-decoration:none;
                padding:12px 22px;
                border-radius:8px;
                font-weight:600;
              "
            >
              Reset Password
            </a>
          </div>

          <p style="color:#64748b; font-size:14px; line-height:1.6;">
            This password reset link will expire in 15 minutes.
          </p>

          <p style="color:#64748b; font-size:14px; line-height:1.6;">
            If you did not request a password reset, you can safely ignore this email.
          </p>

          <hr style="border:none; border-top:1px solid #e2e8f0; margin:28px 0;" />

          <p style="color:#94a3b8; font-size:12px;">
            HelpDesk Support Team
          </p>

        </div>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

// Escape text placed inside the HTML email
const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

// =========================
// NOTIFICATION EMAIL
// =========================
// Short "something happened on your ticket" email with a button
// that opens the ticket in the app.

const sendNotificationEmail = async ({ to, title, message, url }) => {
  const safeTitle = escapeHtml(title);
  const safeMessage = escapeHtml(message);

  await transporter.sendMail({
    from: `"HelpDesk Support" <${process.env.SMTP_USER}>`,
    to,
    subject: `HelpDesk - ${title}`,
    text: `${title}

${message}

${url ? `Open in HelpDesk: ${url}` : ""}

You can turn off email notifications in HelpDesk → Settings.`,
    html: `
      <div style="font-family: Arial, sans-serif; background:#f8fafc; padding:40px;">
        <div style="max-width:600px; margin:auto; background:#ffffff; padding:32px; border-radius:12px; border:1px solid #e2e8f0;">
          <h2 style="color:#1e293b; margin:0 0 12px;">${safeTitle}</h2>

          <p style="color:#475569; line-height:1.6; margin:0;">${safeMessage}</p>

          ${
            url
              ? `<div style="margin:28px 0;">
                  <a href="${escapeHtml(url)}" style="display:inline-block; background:#2563eb; color:#ffffff; text-decoration:none; padding:12px 22px; border-radius:8px; font-weight:600;">
                    Open in HelpDesk
                  </a>
                </div>`
              : ""
          }

          <hr style="border:none; border-top:1px solid #e2e8f0; margin:28px 0;" />

          <p style="color:#94a3b8; font-size:12px; margin:0;">
            You can turn off email notifications in HelpDesk → Settings.
          </p>
        </div>
      </div>
    `,
  });
};

// =========================
// ACTION LINK EMAIL
// =========================
// One button that opens a link (verify email, confirm email change).

const sendActionEmail = async ({ to, subject, heading, lines, buttonText, url, footer }) => {
  const text = `${heading}

${lines.join("\n\n")}

${buttonText}: ${url}

${footer}

Regards,
HelpDesk Support Team`;

  await transporter.sendMail({
    from: `"HelpDesk Support" <${process.env.SMTP_USER}>`,
    to,
    subject: `HelpDesk - ${subject}`,
    text,
    html: `
      <div style="font-family: Arial, sans-serif; background:#f8fafc; padding:40px;">
        <div style="max-width:600px; margin:auto; background:#ffffff; padding:32px; border-radius:12px; border:1px solid #e2e8f0;">
          <h2 style="color:#1e293b; margin:0 0 16px;">${escapeHtml(heading)}</h2>

          ${lines
            .map(
              (line) =>
                `<p style="color:#475569; line-height:1.6;">${escapeHtml(line)}</p>`
            )
            .join("")}

          <div style="margin:28px 0;">
            <a href="${escapeHtml(url)}" style="display:inline-block; background:#2563eb; color:#ffffff; text-decoration:none; padding:12px 22px; border-radius:8px; font-weight:600;">
              ${escapeHtml(buttonText)}
            </a>
          </div>

          <p style="color:#64748b; font-size:14px; line-height:1.6;">${escapeHtml(footer)}</p>

          <hr style="border:none; border-top:1px solid #e2e8f0; margin:28px 0;" />

          <p style="color:#94a3b8; font-size:12px; margin:0;">HelpDesk Support Team</p>
        </div>
      </div>
    `,
  });
};

const sendVerificationEmail = (email, name, url) =>
  sendActionEmail({
    to: email,
    subject: "Verify your email",
    heading: "Verify your email address",
    lines: [
      `Hello ${name},`,
      "Thanks for signing up for HelpDesk. Confirm that this is your email address to activate your account.",
    ],
    buttonText: "Verify email",
    url,
    footer:
      "This link expires in 24 hours. If you didn't create a HelpDesk account, you can ignore this email.",
  });

const sendEmailChangeEmail = (email, name, url) =>
  sendActionEmail({
    to: email,
    subject: "Confirm your new email",
    heading: "Confirm your new email address",
    lines: [
      `Hello ${name},`,
      "You asked to use this address for your HelpDesk account. Your email won't change until you confirm it.",
    ],
    buttonText: "Confirm new email",
    url,
    footer:
      "This link expires in 24 hours. If you didn't ask for this, you can ignore this email and nothing will change.",
  });

module.exports = {
  sendPasswordResetEmail,
  sendNotificationEmail,
  sendVerificationEmail,
  sendEmailChangeEmail,
};