import nodemailer from 'nodemailer';
import { IMessage } from './models/message';
import { IUser } from './models/user';

// Configure email transporter
// Note: For production, use actual email credentials in environment variables
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASS || 'your-app-password',
  },
});

export async function sendMessageNotification(message: IMessage, sender: IUser, recipient: IUser) {
  try {
    // Only send if recipient is not online
    if (recipient.online) return;

    let contentPreview = message.content;
    
    // Format content preview based on content type
    if (message.contentType !== 'text') {
      contentPreview = `Sent a ${message.contentType}`;
      if (message.fileName) {
        contentPreview += `: ${message.fileName}`;
      }
    }

    // Prepare email
    const mailOptions = {
      from: process.env.EMAIL_USER || 'your-email@gmail.com',
      to: recipient.email,
      subject: `New message from ${sender.name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h2 style="color: #3B82F6;">New Message Notification</h2>
          <p>Hello ${recipient.name},</p>
          <p>${sender.name} sent you a message while you were offline.</p>
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0;"><strong>${sender.name}:</strong> ${contentPreview}</p>
            <p style="margin: 5px 0 0; font-size: 12px; color: #666;">
              ${new Date(message.timestamp).toLocaleString()}
            </p>
          </div>
          <p>Log in to view the full message.</p>
          <div style="margin-top: 30px; font-size: 12px; color: #666;">
            <p>This is an automated notification from your Private Chat App.</p>
          </div>
        </div>
      `
    };

    // Send the email
    await transporter.sendMail(mailOptions);
    console.log('Notification email sent successfully');
    return true;
  } catch (error) {
    console.error('Failed to send notification email:', error);
    return false;
  }
}