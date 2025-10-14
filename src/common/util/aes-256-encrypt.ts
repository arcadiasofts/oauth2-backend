import crypto from 'crypto';

export class Aes256 {
  private key: string;
  private ivLength: number;
  /**
   * Aes256 알고리즘을 사용하기 위한 클래스입니다.
   * @param key 암호화 키를 입력받습니다.
   * @param ivLength iv의 길이를 입력받습니다.
   */
  constructor(key: string, ivLength = 16) {
    this.key = crypto
      .createHash('sha256')
      .update(key)
      .digest('base64')
      .substr(0, 32);
    this.ivLength = ivLength;
  }

  /**
   * 값을 aes-256-gcm 알고리즘으로 암호화합니다.
   * @param value 암호화할 값을 입력받습니다.
   * @returns 암호화된 결과를 리턴합니다.
   */
  encrypt(value: string) {
    const iv = crypto.randomBytes(this.ivLength);
    const cipher = crypto.createCipheriv('aes-256-gcm', this.key, iv);
    let encrypted = cipher.update(value, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
  }

  /**
   * aes-256-gcm으로 암호화된 텍스트를 복호화합니다.
   * @param encrypted 암호화된 문자열을 입력받습니다.
   * @returns 복호화된 결과를 리턴합니다.
   */
  decrypt(encrypted: string) {
    try {
      const parts = encrypted.split(':');
      const iv = Buffer.from(parts[0], 'hex');
      const authTag = Buffer.from(parts[1], 'hex');
      const encryptedText = parts[2];
      const decipher = crypto.createDecipheriv('aes-256-gcm', this.key, iv);
      decipher.setAuthTag(authTag);
      let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (error) {
      console.error('복호화 실패:', error.message);
      return null;
    }
  }
}
