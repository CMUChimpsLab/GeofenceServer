const Debug = require("debug");
// Debug.enable("app:*"); // uncomment to have all logs printed to console
const debug = Debug("app:test:user");

const chai = require("chai");
chai.use(require("chai-http"));
const server = chai.request(require("../app")); // app should be exported as express() within file
const expect = chai.expect;

// cherry pick by using `describe.only()` or `describe.skip()`

const uniqueToken = String(new Date().getTime());
const fakeUser = {
  userId: uniqueToken + "@domain.com",
  balance: 10,
  gcmToken: uniqueToken
};


/*
 * Route: /db/user-create
 */
const urlUserCreate = "/db/user-create";
describe("POST " + urlUserCreate, function () {

  it('should create a new user', function (done) {
    server.post(urlUserCreate)
      .send(fakeUser)
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res).to.be.json;
        // Correct response should be: {"error": "", "result": true}
        // where "result" is `true` if the user never had a gcmToken before and `false` if otherwise.
        // In other words, sending a request to `/db/user-create` with an existing userId is basically
        // just updating the gcmToken for that user.
        expect(res.body).to.have.property("error").that.equals("");
        expect(res.body).to.have.property("result").that.equals(true);
        done(err);
      });
  });

  it('should update the info of an existing user', function (done) {
    server.post(urlUserCreate)
      .send(fakeUser)
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res).to.be.json;
        // not really updating user info here but seeing if we get the correct '{"result": false}' response
        expect(res.body).to.have.property("error").that.equals("");
        expect(res.body).to.have.property("result").that.equals(false);
        done(err);
      });
  });
});


/*
 * Route: /db/user-create
 */
const urlUserFetch = "/db/user-fetch";
describe("GET " + urlUserFetch, function () {

  // uses user info based on previous user creation test
  it("should fetch the info an existing user", function (done) {
    server.get(urlUserFetch)
      .query({userId: fakeUser.userId})
      .end(function (err, res) {
        expect(res).to.have.status(200);
        expect(res).to.be.json;
        expect(res.body).to.have.property("id").that.equals(fakeUser.userId);
        expect(res.body).to.have.property("balance").that.equals(fakeUser.balance);
        expect(res.body).to.have.property("gcmToken").that.equals(fakeUser.gcmToken);
        done(err);
      });
  });

  it("should return an error for a non-existing user", function (done) {
    server.get(urlUserFetch)
      .query({userId: "not_a_user@seriouslynotauser.com"})
      .end(function (err, res) {
        expect(res).to.have.status(500);
        expect(res.body).to.have.property("error");
        done();
      });
  });
});
