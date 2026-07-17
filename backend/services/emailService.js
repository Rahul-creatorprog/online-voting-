const nodemailer = require('nodemailer');

const sendOtpEmail = async (email, otp) => {
  try {
    const smtpPort = parseInt(process.env.SMTP_PORT || '465');
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: smtpPort,
      secure: smtpPort === 465, // true for 465, false for other ports
      auth: {
        user: 'kprcas596@gmail.com',
        pass: 'bjnfnulderumglmd'
      },
      tls: {
        rejectUnauthorized: false
      },
      connectionTimeout: 5000, // 5 seconds connection timeout
      greetingTimeout: 5000    // 5 seconds greeting timeout
    });

    const mailOptions = {
      from: '"IT Department Voting" <kprcas596@gmail.com>',
      to: email,
      subject: `${otp} is your verification code`,
      html: `
        <p>Hello,</p>
        <p>Use the following verification code for the B.Sc. IT Voting System login:</p>
        <p style="font-size: 28px; font-weight: bold; color: #2b6cb0; letter-spacing: 2px; margin: 15px 0;">${otp}</p>
        <p>This code is valid for 5 minutes. Please do not share it with anyone.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 11px; color: #999;">This is an automated security notification. Do not reply to this email.</p>
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
