const nodemailer = require('nodemailer');

const sendOtpEmail = async (email, otp) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    const mailOptions = {
      from: `"College Online Voting" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Your Online Voting System OTP Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <h2 style="color: #2b6cb0; text-align: center;">College Online Voting System</h2>
          <hr style="border: 0; border-top: 1px solid #eee;" />
          <p>Hello,</p>
          <p>You have requested a secure verification code to sign into the Online Voting System.</p>
          <div style="text-align: center; margin: 30px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #2d3748; background: #edf2f7; padding: 10px 20px; border-radius: 4px; display: inline-block;">${otp}</span>
          </div>
          <p style="color: #718096; font-size: 14px;">This code is valid for 5 minutes. Do not share this OTP with anyone.</p>
          <hr style="border: 0; border-top: 1px solid #eee;" />
          <p style="color: #a0aec0; font-size: 12px; text-align: center;">This is an automated system email. Please do not reply directly.</p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`OTP Email sent to ${email}: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error('Error sending OTP email:', error);
    return false;
  }
};

module.exports = { sendOtpEmail };
