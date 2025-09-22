import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    const version = require('../package.json').version;
    return `<html><head><title>Arcadiasofts Account.</title></head><body><h1>Arcadiasofts Account System v.${version}</h1></body></html>`;
  }
}
