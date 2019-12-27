const config = require('./config');
const chai = require('chai');
const expect = chai.expect;
const chaiHttp = require('chai-http');

chai.use(chaiHttp);

describe('API availablity', () => {
    it('should return {\"status\": \"ok\"}', (done) => {
    chai.request(config.BASE_URL)
        .get('/checkApi')
        .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body.status).to.equal('ok');
            done();
        });
    });
});
