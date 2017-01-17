import { Injectable } from '@angular/core';

@Injectable()
export class Logger {

    log(message) {
        console.log(message);
    }

    error(message) {
        console.error(message);
    }
}