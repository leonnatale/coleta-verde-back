import nodemailer from 'nodemailer';
import Logger from './Logger';

let mailer: any;

export function initializeMailer(): void {
    mailer = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
            user: process.env['EMAIL_USER'],
            pass: process.env['EMAIL_PASSWORD'],
        },
    });
    Logger.log('Mailer initialized.');
}