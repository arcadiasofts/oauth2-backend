import { Injectable } from '@nestjs/common';
import { version } from '../package.json';

@Injectable()
export class AppService {
  getHello(): string {
    return `<html><head><title>Arcadiasofts Account.</title></head><body><h1>Arcadiasofts Account System v.${version}</h1></body></html>`;
  }
}
