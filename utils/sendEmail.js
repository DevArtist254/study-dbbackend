const nodemailer = require('nodemailer');

/**
 * @function sendEmail @param options : {email, subject, message}
 * create transporter
 * define receiver and sender details
 * send mail
 */

const sendEmail = async (options) => {
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        auth: {
            user: process.env.EMAIL_USERNAME,
            pass: process.env.EMAIL_PASSWORD
        }
    })

    const mailOptions = {
        from: 'Kevin Wasonga <jackwest@gmail.com>',
        to: options.email,
        subject: options.subject,
        text: options.message
    }

    await transporter.sendMail(mailOptions)
};

module.exports = sendEmail;