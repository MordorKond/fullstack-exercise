/// <reference types="cypress" />

declare namespace Cypress {
    interface Chainable<Subject = any> {
        uploadFile(fileNamePath: string, fileName: string, fileType = ' ', selector: string): Chainable<any>;
    }
}
