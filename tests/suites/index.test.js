import assert from 'assert';
import mainModule from '../../src';
describe('Senrews', function () {
    describe('Title extraction', function () {
        it('Should handle space seperated', function () {
            assert.strictEqual(mainModule.extractTitle('Bank of America bank@america.com'), 'Bank of America');
        });
        it('Should handle angle brackets', function () {
            assert.strictEqual(mainModule.extractTitle('Bank of America <bank@america.com>'), 'Bank of America');

        });
        it('Should handle no title', function () {
            assert.strictEqual(mainModule.extractTitle('bank@america.com'), '', 'No title');
        });
        it('Should handle bad formatting', function () {
            assert.strictEqual(mainModule.extractTitle('"Karen Hink"<a@yeah.net>'), 'Karen Hink');
        });
    });
    describe('Email extraction', function () {
        it('Should handle space seperated', function () {
            //This is a fascile smoke test to see that we have no large problems
            assert.strictEqual(mainModule.extractEmail('Bank of America bank@america.com'), 'bank@america.com');
        });
        it('Should handle space seperated', function () {
            //This is a fascile smoke test to see that we have no large problems
            assert.strictEqual(mainModule.extractEmail('Bank of America <bank@america.com>'), 'bank@america.com');
        });
        it('Should handle not title', function () {
            assert.strictEqual(mainModule.extractEmail('bank@america.com'), 'bank@america.com');
        });
    });
});
