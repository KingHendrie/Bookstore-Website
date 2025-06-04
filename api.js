const express = require('express');
const router = express.Router();
const transporter = require('./mailer');
const logger = require('./logger');
const { htmlToText } = require('html-to-text');

// Enable JSON parsing for API routes
router.use(express.json());

router.post('/send-email', async (req, res) => {
  const { to, subject, text, html } = req.body;
  if (!to || !subject || !(text || html)) {
    logger.warn('Email send attempt with missing fields');
    return res.status(400).json({ error: "Missing required fields." });
  }

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject,
      text,
      html,
    });
    logger.info(`Email sent to ${to} with subject "${subject}"`);
    res.json({ success: true });
  } catch (error) {
    logger.error('Error sending email: ' + error.stack);
    res.status(500).json({ error: "Failed to send email." });
  }
});

router.post('/send-contact', async (req, res) => {
	const { to, subject, text, html } = req.body;
	if (!to || !subject || !(text || html)) {
	  logger.warn('Email send attempt with missing fields');
	  return res.status(400).json({ error: "Missing required fields." });
	}

	try {
	  const mailOptions = {
		  from: process.env.EMAIL_USER,
		  to: process.env.EMAIL_TO,
		  subject,
	  };
	  if (html) {
		mailOptions.html = html;
		mailOptions.text = htmlToText(html);
	  } else if (text) {
		mailOptions.text = text;
	  }

	  await transporter.sendMail(mailOptions);
	  logger.info(`Email sent to ${process.env.EMAIL_TO} with subject "${subject}"`);
	  res.json({ success: true });
	} catch (error) {
	  logger.error('Error sending email: ' + error.stack);
	  res.status(500).json({ error: "Failed to send email." });
	}
});

module.exports = router;