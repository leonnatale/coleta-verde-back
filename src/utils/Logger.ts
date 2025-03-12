import chalk from 'chalk';

function formatTime(type: string, hexColor: number): string {
    const timestamp = new Date().toLocaleTimeString();
    return `[${chalk.hex('#' + hexColor.toString(16))(type)}] ${chalk.bold.gray(timestamp)}`;
}

function callLog(type: string, hexColor: number, ...args: any[]) {
    console.log(formatTime(type, hexColor), ...args);
}

export default {
    log(...args: any[]) {
        callLog('LOG', 0xffffff, ...args);
    },
    warn(...args: any[]) {
        callLog('WARN', 0xffffaa, ...args);
    }
};