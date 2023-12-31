enum LogLevel {
    DEBUG='debug',
    LOG='log',
    WARN='warn',
    ERROR='error',
}

class AditorLogger {
    private isDebug: boolean;
    private isLog: boolean;
    private isWarn: boolean;
    private isError: boolean;

    constructor(debugLevel: LogLevel) {
        if (debugLevel == LogLevel.DEBUG) {
            this.isDebug = true
            this.isLog = true
            this.isWarn = true
            this.isError = true
        }else if (debugLevel == LogLevel.LOG) {
            this.isDebug = false
            this.isLog = true
            this.isWarn = true
            this.isError = true
        }else if (debugLevel == LogLevel.WARN) {
            this.isDebug = false
            this.isLog = false
            this.isWarn = true
            this.isError = true
        }else if (debugLevel == LogLevel.ERROR) {
            this.isDebug = false
            this.isLog = false
            this.isWarn = false
            this.isError = true
        }else {
            this.isDebug = false
            this.isLog = false
            this.isWarn = false
            this.isError = false
        }
    }

    debug(...args: any[]) {
        if (this.isDebug) {
            console.debug(...args);
        }
    }

    log(...args: any[]) {
        if (this.isLog) {
            console.log(...args);
        }
    }

    warn(...args: any[]) {
        if (this.isWarn) {
            console.warn(...args);
        }
    }

    error(...args: any[]) {
        if (this.isError) {
            console.error(...args);
        }
    }

    // 你可以添加更多的方法，比如 warn, error 等
}

export const logger = new AditorLogger(import.meta.env.VITE_LOGGER_LEVEL);