import chalk from 'chalk';

function formatTime(type: string, hexColor: number): string {
    const timestamp = new Date().toISOString();
    return `[${chalk.bold.hex('#' + hexColor.toString(16))(type + ' - ' + timestamp)}]:`;
}

function callLog(type: string, hexColor: number, ...args: any[]) {
    console.log(formatTime(type, hexColor), ...args);
}

export default {
    log(...args: any[]) {
        callLog('Log', 0xffffff, ...args);
    },
    warn(...args: any[]) {
        callLog('Warning', 0xffffaa, ...args);
    },
    error(...args: any[]) {
        callLog('Error', 0xffaaaa, ...args);
    }
};