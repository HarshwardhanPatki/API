const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  //1: Create a Transporter
  var transport = nodemailer.createTransport({
    host: 'sandbox.smtp.mailtrap.io',
    port: 2525,
    auth: {
      user: 'facf4affd51ef7',
      pass: '83ff024031640f',
    },
  });
  //2:  Define the email options
  const mailOptions = {
    from: 'collab1172@gmail.com',
    to: options.email,
    subject: options.subject,
    test: options.message,
  };
  //3: Actually send the email
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
