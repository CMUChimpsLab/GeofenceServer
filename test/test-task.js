var assert = require('assert');
var should = require('should');
var express = require('express');
var supertest = require('supertest');
require('../app.js');
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
  gcmToken: uniqueToken2,
  balance: .25
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

var createdTaskIdQuickExpire, createdTaskActionQuickExpire;
describe('POST /db/task-add', function() {
  var task = {
      userId: fakeUser.userId,
      taskName: 'fake task',
      cost: 0.5,
      refreshRate: 10,
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
        createdTaskIdQuickExpire = res.body['createdTaskId'];
        createdTaskActionQuickExpire = res.body['createdTaskActions'][0]['id'];
        server.get('/db/task-fetch?taskId=' + createdTaskIdQuickExpire)
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

var taskId2;
describe('POST /db/task-respond', function() {
  var laterDate = new Date();
  laterDate.setMinutes(61); // so it will be at least some time in the future
  var task = {
      userId: fakeUser.userId,
      taskName: 'new fake task',
      cost: 0.5,
      refreshRate: 10,
      expiresAt: laterDate,
      locationName: 'Downtown Pittsburgh center',
      lat: 40.4416667,
      lng: -80,
      radius: 60,
      taskActions: [{'description': 'how many dogs are here now?', type: 'text'},
                    {'description': 'What is their color?', type: 'text'}]
  };
  var action1Id, action2Id, taskIdShort;
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
            taskId2 = res.body['createdTaskId'];
            action1Id = res.body['createdTaskActions'][0]['id'];
            action2Id = res.body['createdTaskActions'][1]['id'];

            // Then fakeUser2 responds to it.
            var taskResponse = {
              userId: fakeUser2.userId,
              taskId: taskId2,
              taskActionIds: [action1Id, action2Id],
              responses: {}
            }
            taskResponse['responses'][action1Id] = "three dogs";
            taskResponse['responses'][action2Id] = "blue, purple, and green";
            taskResponse['responses'] = taskResponse['responses'];
            server.post('/db/task-respond')
              .send(taskResponse)
              .expect(200)
              .end(function(err, res) {
                console.error(err);
                if(err) { console.error(res); }
                res.body['result'].should.be.true();
                // No in-depth checks here, just it should send the "ok" signal.
                // TODO maybe we can shorten this test b/c there was already
                // a task created, maybe we can just respond to that one.
                done();
              });
          });
      });
  });

  it("Fails a response if another user answered too soon", function(done) {
        // Then fakeUser2 responds to it.
        var taskResponse = {
            userId: fakeUser2.userId,
            taskId: taskId2,
            taskActionIds: [action1Id],
            responses: {}
        }
        taskResponse['responses'][action1Id] = "three dogs";
        taskResponse['responses'] = taskResponse['responses'];
        server.post('/db/task-respond')
            .send(taskResponse)
            .expect(200)
            .end(function(err, res) {
              should(res.body['error']).startWith('Another user has recently answered');
              done();
            });
  })

  it("Fails a response if the user does not have enough money", function(done) {
    var laterDate = new Date();
    laterDate.setMinutes(61); // so it will be at least some time in the future
    var expensiveTask = {
        userId: fakeUser2.userId,
        taskName: 'new expensive fake task',
        cost: 30,
        refreshRate: 120,
        expiresAt: laterDate,
        locationName: 'Downtown Pittsburgh center',
        lat: 40.4416667,
        lng: -80,
        radius: 60,
        taskActions: [{'description': 'how much money does this cost?', type: 'text'}]
    };
     server.post('/db/task-add')
        .send(task)
        .expect(200)
        .end(function(err, res) {
        expensiveTaskId = res.body['createdTaskId']
        expensiveActionId = res.body['createdTaskActions'][0]['id'];
        // Then fakeUser responds to it.
        var taskResponse = {
            userId: fakeUser.userId,
            taskId: expensiveTaskId,
            taskActionIds: [expensiveActionId],
            responses: {}
        }
        taskResponse['responses'][expensiveActionId] = "very expensive!";
        server.post('/db/task-respond')
            .send(taskResponse)
            .expect(function(err,res) {
              should(res.body['error']).startWith('The user does not have the funds to pay');
            })
            .end(function(err, res) {
              done();
            });
        });
  })

  it("Fails a response if the task has expired", function(done) {
    // createdTaskId; // got this from a test above.
    server.get('/db/task-fetch?taskId=' + createdTaskIdQuickExpire)
      .end(function(err, res) {
        var taskactionId = res.body[0]['taskactions'][0].id;
        var taskResponse = {
          userId: fakeUser2.userId,
          taskId: createdTaskIdQuickExpire,
          taskActionIds: [taskactionId],
          responses: {}
        }
        taskResponse['responses'][taskactionId] = "two dogs";
        server.post('/db/task-respond')
          .send(taskResponse)
          .end(function(err, res) {
            should(res.body['error']).startWith('Task has expired');
            done();
          });
      });
    });

});
