import nodemailer from 'nodemailer';
import { google } from 'googleapis';
import Logger from './Logger';
import SMTPPool from 'nodemailer/lib/smtp-pool';
import { getUserById } from './Database';

const OAuth2 = google.auth.OAuth2;

let mailer: nodemailer.Transporter<SMTPPool.SentMessageInfo, SMTPPool.Options>;

export async function initializeMailer(): Promise<void> {
    const gmailClient = new OAuth2(
        process.env['GMAIL_CLIENT_ID'],
        process.env['GMAIL_CLIENT_SECRET'],
        'https://developers.google.com/oauthplayground'
    );

    gmailClient.setCredentials({
        refresh_token: process.env['GMAIL_REFRESH_TOKEN']
    });

    const accessToken: string = await new Promise((resolve, reject) => {
        gmailClient.getAccessToken((err, token) => {
            if (err) return reject(err);
            resolve(token!);
        });
    });

    const options: SMTPPool.Options = {
        service: 'gmail',
        auth: {
            type: 'OAuth2',
            user: process.env['GMAIL_EMAIL'],
            clientId: process.env['GMAIL_CLIENT_ID'],
            clientSecret: process.env['GMAIL_CLIENT_SECRET'],
            refreshToken: process.env['GMAIL_REFRESH_TOKEN'],
            accessToken
        },
        pool: true,
        maxConnections: 2,
        maxMessages: 50
    };

    mailer = nodemailer.createTransport(options);
    Logger.log('Mailer initialized.');
}

async function sendMail(to: string, subject: string, text: string): Promise<void> {
    try {
        await mailer.sendMail({
            from: `Coleta Verde <${process.env['GMAIL_EMAIL']}>`,
            to,
            subject,
            html: text
        });
    } catch (error) {
        Logger.error(`Failed to send email to ${to}:`, error);
    }
}

export async function sendEmailVerification(userID: number): Promise<void> {
    const user = (await getUserById(userID))!;

    sendMail(
        user.email,
        'Verificação de email',
        `
        <table width='100%' cellpadding='0' cellspacing='0' style='background-color: #f0f0f0; font-family: Arial, sans-serif;'>
            <tr>
                <td align='center'>
                    <table width='100%' cellpadding='0' cellspacing='0' style='max-width: 600px; background-color: #ffffff; border-radius: 5px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); margin: 20px auto; padding: 20px;'>
                        <tr>
                            <td align='center' style='color: #333333; font-size: 24px; font-weight: bold; margin-bottom: 20px;'>
                                Verificação de email
                            </td>
                        </tr>
                        <tr>
                            <td style='color: #333333; font-size: 16px; padding: 20px;'>
                                Olá <b>${user.name}</b>, para confirmar seu cadastro, clique no botão abaixo:
                            </td>
                        </tr>
                        <tr>
                            <td align='center' style='padding: 20px;'>
                                <a href='${process.env['URL']}/auth/verify-email/${user._id}' style='background-color: #82de99; border: none; border-radius: 5px; color: #ffffff; cursor: pointer; font-size: 16px; padding: 10px 20px; text-decoration: none;'>
                                    Confirmar email
                                </a>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
        `
    );
}
