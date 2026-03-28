const nodemailer = require('nodemailer');

// Create reusable transporter
let transporter = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return transporter;
}

// Generate newsletter HTML email
function buildNewsletterHTML({ articles, unsubscribeUrl, dashboardUrl }) {
  const topArticle = articles[0];
  const otherArticles = articles.slice(1, 6);

  const otherArticlesHTML = otherArticles.map(article => `
    <tr>
      <td style="padding: 16px 0; border-bottom: 1px solid #222;">
        <a href="${article.url}" style="text-decoration: none; color: #fff; font-size: 16px; font-weight: 400; line-height: 1.4;">
          ${article.title}
        </a>
        <p style="color: #888; font-size: 13px; margin: 6px 0 0;">
          ${article.source?.name || 'News'} ${article.summary ? '&mdash; ' + article.summary.substring(0, 120) + '...' : ''}
        </p>
      </td>
    </tr>
  `).join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #000; font-family: Georgia, serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #000;">
    <tr>
      <td align="center" style="padding: 20px;">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%;">

          <!-- Header -->
          <tr>
            <td style="padding: 30px 20px; text-align: center; border-bottom: 3px solid #f5c518;">
              <h1 style="color: #fff; font-size: 28px; font-weight: 400; letter-spacing: 2px; margin: 0;">
                YORNEWS
              </h1>
              <p style="color: #888; font-size: 13px; margin: 8px 0 0;">
                Your personalised news without the noise
              </p>
            </td>
          </tr>

          <!-- Featured Article -->
          ${topArticle ? `
          <tr>
            <td style="padding: 24px 20px 0;">
              <p style="color: #f5c518; font-size: 11px; letter-spacing: 2px; margin: 0 0 12px;">TOP STORY</p>
              ${topArticle.urlToImage ? `
              <a href="${topArticle.url}">
                <img src="${topArticle.urlToImage}" alt="${topArticle.title}"
                     style="width: 100%; max-height: 300px; object-fit: cover; display: block;" />
              </a>
              ` : ''}
              <a href="${topArticle.url}" style="text-decoration: none;">
                <h2 style="color: #fff; font-size: 22px; font-weight: 400; line-height: 1.3; margin: 16px 0 8px;">
                  ${topArticle.title}
                </h2>
              </a>
              <p style="color: #888; font-size: 14px; line-height: 1.5; margin: 0 0 16px;">
                ${topArticle.summary || topArticle.description || ''}
              </p>
              <a href="${topArticle.url}"
                 style="display: inline-block; background: #f5c518; color: #000; padding: 10px 24px; text-decoration: none; font-size: 13px; font-weight: 600;">
                READ MORE
              </a>
            </td>
          </tr>
          ` : ''}

          <!-- More Headlines -->
          ${otherArticles.length > 0 ? `
          <tr>
            <td style="padding: 30px 20px 0;">
              <p style="color: #f5c518; font-size: 11px; letter-spacing: 2px; margin: 0 0 8px; border-top: 1px solid #222; padding-top: 20px;">
                MORE HEADLINES
              </p>
              <table width="100%" cellpadding="0" cellspacing="0">
                ${otherArticlesHTML}
              </table>
            </td>
          </tr>
          ` : ''}

          <!-- Dashboard CTA -->
          <tr>
            <td style="padding: 30px 20px; text-align: center;">
              <a href="${dashboardUrl}"
                 style="display: inline-block; background: transparent; color: #f5c518; padding: 12px 32px; text-decoration: none; font-size: 14px; border: 1px solid #f5c518;">
                View All News on Dashboard
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px; text-align: center; border-top: 1px solid #222;">
              <p style="color: #555; font-size: 11px; margin: 0;">
                You're receiving this because you subscribed to YorNews newsletter.
              </p>
              <p style="margin: 8px 0 0;">
                <a href="${unsubscribeUrl}" style="color: #888; font-size: 11px; text-decoration: underline;">
                  Unsubscribe from this newsletter
                </a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// Send newsletter email to a user
async function sendNewsletter({ email, articles, unsubscribeToken }) {
  const baseUrl = process.env.FRONTEND_URL || 'https://yornews.vercel.app';
  const apiUrl = process.env.API_URL || 'https://yornews-server.vercel.app';

  const unsubscribeUrl = `${apiUrl}/api/newsletter/unsubscribe/${unsubscribeToken}`;
  const dashboardUrl = `${baseUrl}/news`;

  const html = buildNewsletterHTML({ articles, unsubscribeUrl, dashboardUrl });

  const mailOptions = {
    from: `"YorNews" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'Your YorNews Digest - Top Stories For You',
    html,
    headers: {
      'List-Unsubscribe': `<${unsubscribeUrl}>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    },
  };

  const transport = getTransporter();
  return transport.sendMail(mailOptions);
}

module.exports = {
  sendNewsletter,
  buildNewsletterHTML,
};
