var assert = require('assert');
var should = require('should');
var express = require('express');
var supertest = require('supertest');
require('../server.js');
var app = require('../app.js');

var server = supertest(app); // handles server setup and shutdown I guess
var uniqueToken = new Date().getTime();
var fakeUser = {
  userId: uniqueToken+"@domain.com",
  gcmToken: uniqueToken
};

var uniqueToken2 = new Date().getTime() + "_2";
var fakeUser2 = {
  userId: uniqueToken2+"@domain.com",
  gcmToken: uniqueToken2
};


describe('GET /', function() {
  it('responds with a 200', function(done) {
    server.get('/')
      .expect(200)
      .end(function(err, res) {done();});
  });
  it('responds to a nonsense request with a 404', function(done) {
    server.get('/asdf')
      .expect(404)
      .end(function(err, res) {done();});
  });
});

describe('POST /db/user-create', function() {
  it('creates a new user', function(done) {
    server.post('/db/user-create')
      .send(fakeUser)
      .expect(200)
      .expect('Content-Type', /json/)
      .expect(function(res) {
        // Correct response should be: {"error": "", "result": true}
        // where "result" is `true` if the user never had a gcmToken before and `false` if otherwise.
        // In other words, sending a request to `/db/user-create` with an existing userId is basically
        // just updating the gcmToken for that user.
        if (res.body.error) throw new Error("error while creating a new user");
        if (!res.body.result) throw new Error("gcmToken somehow existed previously");
      })
      .end(function (err, res) {
        if(err) return done(err);
        done();
      });
  });
  it('updates the gcmToken for an existing user', function(done) {
    server.post('/db/user-create')
      .send(fakeUser)
      .expect(200)
      .expect('Content-Type', /json/)
      .expect(function(res) {
        if (res.body.error) throw new Error("error while accessing an existing user");
        if (res.body.result) throw new Error("gcmToken somehow didn't exist previously");
      })
      .end(function (err, res) {
        if(err) return done(err);
        done();
      });
  });
  it('successfully fetches a real user', function(done) {
    server.get('/db/user-fetch')
      .query({userId: fakeUser.userId})
      .expect(function(res) {
        if(res.body['id'] != fakeUser.userId) {
          throw new Error("Didn't find the user.");
        }
      })
      .end(done);
  });
  it('correctly doesn\'t find a user who doesn\'t exist', function(done) {
    server.get('/db/user-fetch')
      .query({userId: "not_a_user@seriouslynotauser.com"})
      .expect(function(res) {
        if (res.body !== null) {
          throw new Error("Found a user, even though this user didn't exist.");
        }
      })
      .end(done);
  });
});

describe('POST /db/task-add', function() {
  var task = {
      userId: fakeUser.userId,
      taskName: 'fake task',
      cost: 0.5,
      expiresAt: new Date(),
      locationName: 'Downtown Pittsburgh center',
      lat: 40.4416667,
      lng: -80,
      radius: 60,
      taskActions: [{'description': 'how many dogs are here now?', type: 'text'}]
    };

  it('successfully adds a legit task', function(done) {
    server.post('/db/task-add')
      .send(task)
      .expect(200)
      .end(function(err, res) {
        // Make sure it was actually added by fetching it too.
        var createdTaskId = res.body['createdTaskId'];
        server.get('/db/task-fetch?taskId=' + createdTaskId)
          .expect(200)
          .end(function(err, res) {
            res['body'][0]['name'].should.equal('fake task');
            done();
          });
      });
  });
  it('fails when the task is somehow bad', function(done) {
    task['lat'] = 'not a number';
    server.post('/db/task-add').send(task)
      .end(function(err, res) {
        res['body']['error'].should.be.ok();
        done();
      });
  });
});

describe('POST /db/task-respond', function() {
  var task = {
      userId: fakeUser.userId,
      taskName: 'new fake task',
      cost: 0.5,
      expiresAt: new Date(),
      locationName: 'Downtown Pittsburgh center',
      lat: 40.4416667,
      lng: -80,
      radius: 60,
      taskActions: [{'description': 'how many dogs are here now?', type: 'text'}]
  };
  it("Responds to a task", function(done) {
    // first, make sure fakeUser2 exists (fakeUser was created previously
    server.post('/db/user-create')
      .send(fakeUser2)
      .expect(200)
      .end(function (err, res) {
        // then fakeUser creates a task
        server.post('/db/task-add')
          .send(task)
          .expect(200)
          .end(function(err, res) {
            action1Id = res.body['createdTaskActions'][0]['id'];
            // Then fakeUser2 responds to it.
            var taskResponse = {
              userId: fakeUser2.userId,
              taskActionIds: [action1Id],
              responses: {}
            }
            taskResponse['responses'][action1Id] = "three dogs";
            server.post('/db/task-respond')
              .send(taskResponse)
              .end(function(err, res) {
                res.body['result'].should.be.true();
                // No in-depth checks here, just it should send the "ok" signal.
                // TODO maybe we can shorten this test b/c there was already
                // a task created, maybe we can just respond to that one.
                done();
              });
          });
      });
  });

});
