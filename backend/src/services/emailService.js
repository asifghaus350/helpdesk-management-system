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

module.exports = {
  sendPasswordResetEmail,
};