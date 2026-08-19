// src/services/email.service.ts
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT ?? 587),
  secure: process.env.SMTP_PORT === '465',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

interface LowStockItem {
  name: string;
  quantity: number;
  lowStockThreshold: number;
}

export const sendLowStockAlert = async (recipientEmails: string[], items: LowStockItem[]) => {
  if (recipientEmails.length === 0 || items.length === 0) return;

  const rows = items
    .map(
      (i) =>
        `<tr><td style="padding:6px 12px;">${i.name}</td><td style="padding:6px 12px;">${i.quantity}</td><td style="padding:6px 12px;">${i.lowStockThreshold}</td></tr>`
    )
    .join('');

  const html = `
    <h2>⚠️ Low Stock Alert</h2>
    <p>${items.length} product(s) are at or below their low-stock threshold:</p>
    <table style="border-collapse:collapse;border:1px solid #ddd;">
      <thead>
        <tr style="background:#f5f5f5;">
          <th style="padding:6px 12px;text-align:left;">Product</th>
          <th style="padding:6px 12px;text-align:left;">Current Qty</th>
          <th style="padding:6px 12px;text-align:left;">Threshold</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM ?? 'Inventory Pro <alerts@inventorypro.app>',
      to: recipientEmails.join(','),
      subject: `⚠️ Low Stock Alert — ${items.length} product(s) need attention`,
      html,
    });
  } catch (error) {
    // Don't let email failure break the sale/update flow that triggered it
    console.error('Failed to send low-stock alert email:', error);
  }
};