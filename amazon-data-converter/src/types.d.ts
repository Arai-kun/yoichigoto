declare module 'formidable' {
  export interface File {
    filepath: string;
    originalFilename: string;
    mimetype: string;
    size: number;
  }

  export interface Fields {
    [key: string]: string | string[];
  }

  export interface Files {
    [key: string]: File | File[];
  }

  export interface Options {
    maxFileSize?: number;
    maxFieldsSize?: number;
    maxFields?: number;
    keepExtensions?: boolean;
    uploadDir?: string;
    multiples?: boolean;
    allowEmptyFiles?: boolean;
  }

  export interface IncomingForm {
    parse: (req: any, callback: (err: any, fields: Fields, files: Files) => void) => void;
    on: (event: string, callback: (...args: any[]) => void) => void;
  }

  export function IncomingForm(options?: Options): IncomingForm;
}

declare module 'tesseract.js' {
  export interface RecognizeResult {
    data: {
      text: string;
      confidence: number;
      lines: any[];
    };
  }

  export interface Worker {
    recognize: (image: string | Uint8Array | ImageData, options?: any) => Promise<RecognizeResult>;
    terminate: () => Promise<void>;
  }

  export function createWorker(options?: any): Promise<Worker>;
}
