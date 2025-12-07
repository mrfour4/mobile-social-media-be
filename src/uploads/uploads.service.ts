// src/uploads/uploads.service.ts
import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class UploadsService {
  generateSignature(folder?: string) {
    const timestamp = Math.round(Date.now() / 1000);

    const cloudFolder =
      folder || process.env.CLOUDINARY_UPLOAD_FOLDER || 'mobile';
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    // https://cloudinary.com/documentation/upload_images#generating_authentication_signatures
    const stringToSign = `folder=${cloudFolder}&timestamp=${timestamp}`;

    const signature = crypto
      .createHash('sha1')
      .update(stringToSign + apiSecret)
      .digest('hex');

    return {
      timestamp,
      folder: cloudFolder,
      signature,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
    };
  }
}
