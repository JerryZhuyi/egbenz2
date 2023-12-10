enum LogLevel {
    DEBUG='debug',
    WARN='warn',
    ERROR='error',
}

class AditorLogger {
    private isDebug: boolean;
    private isWarn: boolean;

    constructor(debugLevel: LogLevel) {
        if (debugLevel == LogLevel.DEBUG) {
            this.isDebug = true
            this.isWarn = true
        }else if (debugLevel == LogLevel.WARN) {
            this.isDebug = false
            this.isWarn = true
        }else{
            this.isDebug = true
            this.isWarn = true
        }
    }

    log(...args: any[]) {
        if (this.isDebug) {
            console.log(...args);
        }
    }

    warn(...args: any[]) {
        if (this.isWarn) {
            console.warn(...args);
        }
    }

    // 你可以添加更多的方法，比如 warn, error 等
}
console.log(import.meta.env.VITE_LOGGER_LEVEL)
export const logger = new AditorLogger(import.meta.env.VITE_LOGGER_LEVEL);