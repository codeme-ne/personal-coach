// === Resilient Together API Wrapper ===
// Zweck: Robuste API-Kommunikation mit exponential backoff und strukturiertem Logging
// Features: Retry-Logik, Jitter, Error-Mapping, Request-Tracking

import * as functions from 'firebase-functions';

interface TogetherAPIOptions {
  model?: string;
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
}

interface TogetherRequest {
  messages: Array<{ role: string; content: string }>;
  model: string;
  max_tokens: number;
  temperature: number;
  top_p: number;
}

interface TogetherResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

interface APICall {
  requestId: string;
  model: string;
  prompt: string;
  attempt: number;
  maxAttempts: number;
}

/**
 * Generiert Request-ID für Logging
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Berechnet Exponential Backoff mit Jitter
 */
function calculateBackoffDelay(attempt: number): number {
  const baseDelays = [500, 1200, 2500]; // ms
  const baseDelay = baseDelays[Math.min(attempt, baseDelays.length - 1)];
  
  // Jitter ±25%
  const jitter = 0.25;
  const minDelay = baseDelay * (1 - jitter);
  const maxDelay = baseDelay * (1 + jitter);
  
  return Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;
}

/**
 * Mappt HTTP Status Codes zu Firebase Error Codes
 */
function mapErrorToFirebaseCode(status: number, error: any): {
  code: functions.https.FunctionsErrorCode;
  message: string;
} {
  switch (status) {
    case 429:
      return {
        code: 'resource-exhausted',
        message: 'API rate limit exceeded. Please try again later.'
      };
    case 502:
    case 503:
    case 504:
      return {
        code: 'unavailable',
        message: 'API temporarily unavailable. Please try again.'
      };
    case 400:
    case 422:
      return {
        code: 'invalid-argument',
        message: error?.message || 'Invalid request parameters.'
      };
    case 401:
    case 403:
      return {
        code: 'permission-denied',
        message: 'API authentication failed.'
      };
    default:
      return {
        code: 'internal',
        message: `API error: ${error?.message || 'Unknown error'}`
      };
  }
}

/**
 * Strukturiertes Logging für API Calls
 */
function logAPICall(call: APICall, status?: number, error?: any): void {
  const logData = {
    requestId: call.requestId,
    model: call.model,
    attempt: call.attempt,
    maxAttempts: call.maxAttempts,
    promptLength: call.prompt.length,
    promptPreview: call.prompt.substring(0, 100) + '...',
    status,
    error: error ? { message: error.message, code: error.code } : undefined,
    timestamp: new Date().toISOString()
  };

  if (error) {
    console.error('[TogetherAPI] Request failed:', logData);
  } else {
    console.log('[TogetherAPI] Request completed:', logData);
  }
}

/**
 * Schläft für die angegebene Zeit
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Prüft ob ein Fehler retry-fähig ist
 */
function isRetryableError(status: number): boolean {
  return status === 429 || status === 502 || status === 503 || status === 504;
}

/**
 * Resiliente Together API Wrapper-Klasse
 */
export class ResilientTogetherAPI {
  private apiKey: string;
  private maxRetries: number;

  constructor(apiKey: string, maxRetries: number = 3) {
    this.apiKey = apiKey;
    this.maxRetries = maxRetries;
  }

  /**
   * Führt API Call mit Retry-Logik aus
   */
  async call(
    prompt: string,
    options: TogetherAPIOptions = {}
  ): Promise<string> {
    const requestId = generateRequestId();
    const model = options.model || 'meta-llama/Llama-2-7b-chat-hf';
    
    const apiCall: APICall = {
      requestId,
      model,
      prompt,
      attempt: 0,
      maxAttempts: this.maxRetries
    };

    const requestPayload: TogetherRequest = {
      messages: [
        { role: 'system', content: prompt }
      ],
      model,
      max_tokens: options.max_tokens || 200,
      temperature: options.temperature || 0.7,
      top_p: options.top_p || 0.9
    };

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      apiCall.attempt = attempt + 1;
      
      try {
        console.log(`[TogetherAPI] Starting attempt ${apiCall.attempt}/${this.maxRetries}`, {
          requestId,
          model,
          promptLength: prompt.length
        });

        const response = await fetch('https://api.together.xyz/inference', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          },
          body: JSON.stringify(requestPayload)
        });

        if (response.ok) {
          const data: TogetherResponse = await response.json();
          const result = data.choices?.[0]?.message?.content || '';
          
          logAPICall(apiCall, response.status);
          return result;
        }

        // Fehler-Handling
        const errorData = await response.text();
        let parsedError;
        try {
          parsedError = JSON.parse(errorData);
        } catch {
          parsedError = { message: errorData };
        }

        logAPICall(apiCall, response.status, parsedError);

        // Prüfe ob Retry sinnvoll ist
        if (!isRetryableError(response.status) || attempt === this.maxRetries - 1) {
          const { code, message } = mapErrorToFirebaseCode(response.status, parsedError);
          throw new functions.https.HttpsError(code, message);
        }

        // Warte vor nächstem Versuch
        const delay = calculateBackoffDelay(attempt);
        console.log(`[TogetherAPI] Retrying in ${delay}ms...`, { requestId, attempt: attempt + 1 });
        await sleep(delay);

      } catch (error) {
        logAPICall(apiCall, undefined, error);

        // Bei letztem Versuch oder nicht-retry-fähigem Fehler: Fehler weiterwerfen
        if (attempt === this.maxRetries - 1) {
          if (error instanceof functions.https.HttpsError) {
            throw error;
          }
          throw new functions.https.HttpsError('internal', `API call failed: ${error.message}`);
        }

        // Warte vor nächstem Versuch
        const delay = calculateBackoffDelay(attempt);
        console.log(`[TogetherAPI] Network error, retrying in ${delay}ms...`, { requestId, attempt: attempt + 1 });
        await sleep(delay);
      }
    }

    // Sollte nie erreicht werden
    throw new functions.https.HttpsError('internal', 'API call failed after all retries');
  }
}