import {
  Injectable,
  LoggerService as NestLoggerService,
  ConsoleLogger,
} from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

interface LogEntry {
  timestamp: string;
  level: string;
  context?: string;
  message: string;
  trace?: string;
}

@Injectable()
export class FileLoggerService implements NestLoggerService {
  private readonly logsDir = path.join(process.cwd(), 'logs');
  private readonly maxLogAgeDays = 7;
  private readonly consoleLogger = new ConsoleLogger();

  constructor() {
    this.ensureLogsDirectory();
    this.cleanOldLogs();
  }

  private ensureLogsDirectory(): void {
    if (!fs.existsSync(this.logsDir)) {
      fs.mkdirSync(this.logsDir, { recursive: true });
    }
  }

  private getLogFileName(extension: 'txt' | 'json'): string {
    const today = new Date().toISOString().split('T')[0];
    return path.join(this.logsDir, `${today}.${extension}`);
  }

  private writeToFile(content: string, extension: 'txt' | 'json'): void {
    const fileName = this.getLogFileName(extension);
    try {
      fs.appendFileSync(fileName, content + '\n', 'utf8');
    } catch (error) {
      console.error(`Error escribiendo log en ${fileName}:`, error);
    }
  }

  private formatLogEntry(
    level: string,
    message: any,
    context?: string,
    trace?: string,
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level: level.toUpperCase(),
      context,
      message: typeof message === 'object' ? JSON.stringify(message) : message,
      trace,
    };
  }

  private writeLog(
    level: string,
    message: any,
    context?: string,
    trace?: string,
  ): void {
    const logEntry = this.formatLogEntry(level, message, context, trace);

    const contextPart = logEntry.context ? ` [${logEntry.context}]` : '';
    const tracePart = logEntry.trace ? `\n${logEntry.trace}` : '';
    const txtFormat = `[${logEntry.timestamp}] [${logEntry.level}]${contextPart} ${logEntry.message}${tracePart}`;

    const jsonFormat = JSON.stringify(logEntry);

    this.writeToFile(txtFormat, 'txt');
    this.writeToFile(jsonFormat, 'json');
  }

  private cleanOldLogs(): void {
    try {
      const files = fs.readdirSync(this.logsDir);
      const now = Date.now();
      const maxAge = this.maxLogAgeDays * 24 * 60 * 60 * 1000;

      files.forEach((file) => {
        const filePath = path.join(this.logsDir, file);
        const stats = fs.statSync(filePath);
        const fileAge = now - stats.mtimeMs;

        if (fileAge > maxAge) {
          fs.unlinkSync(filePath);
          console.log(`Log antiguo eliminado: ${file}`);
        }
      });
    } catch (error) {
      console.error('Error limpiando logs antiguos:', error);
    }
  }

  log(message: any, context?: string): void {
    this.consoleLogger.log(message, context);
    this.writeLog('log', message, context);
  }

  error(message: any, trace?: string, context?: string): void {
    this.consoleLogger.error(message, trace, context);
    this.writeLog('error', message, context, trace);
  }

  warn(message: any, context?: string): void {
    this.consoleLogger.warn(message, context);
    this.writeLog('warn', message, context);
  }

  debug(message: any, context?: string): void {
    this.consoleLogger.debug(message, context);
    this.writeLog('debug', message, context);
  }

  verbose(message: any, context?: string): void {
    this.consoleLogger.verbose(message, context);
    this.writeLog('verbose', message, context);
  }
}
