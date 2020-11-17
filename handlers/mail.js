const nodemailer = require('nodemailer');
const pug = require('pug');
const juice = require('juice');
const htmlToText = require('html-to-text');
const promisify = require('es6-promisify');

const transport = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: process.env.MAIL_PORT,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

const generateHtml = (filename, options = {}) => {
  // __dirname quiere decir, "ubicame en la ruta de donde se esta corriendo este archivo",
  // /Users/josemaria/Documents/etc... va toda la ruta
  // cuando no podemos encontrar una ruta, las options las pasamos para usar los atributos en el html
  const html = pug.renderFile(
    `${__dirname}/../views/email/${filename}.pug`,
    options
  );
  // juice, nos pone el css inline en el html que tendremos, para que funcione melo en todo lado
  const inlined = juice(html);
  return inlined;
};

exports.send = async (options) => {
  const html = generateHtml(options.filename, options);
  const text = htmlToText.fromString(html);
  const mailOptions = {
    from: `Jose Maria <noreply@jose.com>`,
    to: options.user.email,
    subject: options.subject,
    html,
    text,
  };
  // tranmsformamos de promersa a await async
  const sendMail = promisify(transport.sendMail, transport);
  return sendMail(mailOptions);
};
