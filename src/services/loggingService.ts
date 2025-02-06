// Logging service for API responses

interface APILogData {
  endpoint: string;
  method: string;
  timestamp: string;
  response: any;
  error?: any;
}

class LoggingService {
  private static instance: LoggingService;
  private readonly MAX_LOGS = 100;
  private logs: APILogData[] = [];

  private constructor() {}

  public static getInstance(): LoggingService {
    if (!LoggingService.instance) {
      LoggingService.instance = new LoggingService();
    }
    return LoggingService.instance;
  }

  public logAPIResponse(endpoint: string, method: string, response: any, error?: any) {
    const logData: APILogData = {
      endpoint,
      method,
      timestamp: new Date().toISOString(),
      response,
      error
    };

    console.log('API Response Log:', logData);
    this.logs.push(logData);

    // Keep only the last MAX_LOGS entries
    if (this.logs.length > this.MAX_LOGS) {
      this.logs = this.logs.slice(-this.MAX_LOGS);
    }

    return logData;
  }

  public getLogs(): APILogData[] {
    return [...this.logs];
  }

  public clearLogs(): void {
    this.logs = [];
    console.log('Logs cleared');
  }
}

export const loggingService = LoggingService.getInstance();