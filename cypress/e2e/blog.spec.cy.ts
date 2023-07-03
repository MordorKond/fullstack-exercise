
describe('template spec', () => {
    it('passes', () => {
        cy.setCookie('next-auth.csrf-token', '781e841a4212902e37727beef51e3a4c124ee52fd06e6e60044f65ffd34cdb28%7Cd369ebc30d8e5e9a6031272f34fb4d727fc78898572e84fc101e4d8b71bdd647')
        cy.setCookie('next-auth.callback-url', 'http%3A%2F%2Flocalhost%3A3000%2F')
        cy.setCookie('next-auth.session-token', '0c416372-b5a2-445c-93e0-fe558732008b')
        cy.visit('http://localhost:3000/')
        /* ==== Generated with Cypress Studio ==== */
        cy.get('#blog > .rounded-full > .flex').click();
        cy.get('#create-article').click();
        cy.get('#title').clear('C');
        cy.get('#title').type('Cypress');
        /* ==== End Cypress Studio ==== */
        /* ==== Generated with Cypress Studio ==== */
        cy.get('#upload-image').click();
        cy.get('input[type=file]').selectFile('/Users/ivo/Projects/twitter-clone/cypress/fixtures/test-image.jpg', { force: true }); // Select the image file
        cy.get('#contnet').type('Some very long text about testing with cypress');
        cy.get('#action').click();
        cy.get(':nth-child(1) > .ml-6 > .mt-5 > a > .border').click();
        cy.get('#comment-field').type('test{enter}');
        cy.get('[name="upvote"] > img').click();
        cy.get('.rounded-full > img').click();
        cy.get('[name="downvote"] > img').click();
        cy.get('.rounded-full > img').click();
        cy.get('[name="upvote"] > img').click();
        cy.get('[name="downvote"] > img').click();
        cy.get('[name="upvote"] > img').click();
        cy.get('#my-articles').click();
      cy.get(':nth-child(1) > :nth-child(6) > .flex > a > #eddit').click();
        cy.get('#title').type(' 2');
        cy.get('#contnet').type(' 2');
        cy.get('#action').click();
        cy.get(':nth-child(1) > :nth-child(6) > .flex > #delete > .m-2').click();
    })
})
