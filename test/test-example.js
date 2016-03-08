var assert = require('assert');
var should = require('should');
var express = require('express');
var supertest = require('supertest');
require('../server.js');
var app = require('../app.js');

var server = supertest(app); // handles server setup and shutdown I guess

describe('GET /', function() {
  it('responds with a 200', function(done) {
    server.get('/')
      .expect(200)
      .end(function(err, res) {done();});
  })
  it('responds to a nonsense request with a 404', function(done) {
    server.get('/asdf')
      .expect(404)
      .end(function(err, res) {done();});
  });
})
 
describe('POST /db/task-add', function() {
  var task = {
      taskName: 'fake task',
      cost: 0.5,
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

  // TODO this is not great, the validation logic should be tested w/o starting
  // a whole new HTTP request/response.
  it('fails when the task is somehow bad', function(done) {
    task['lat'] = 'not a number';
    server.post('/db/task-add').send(task)
      .end(function(err, res) {
        res['body']['error'].should.be.ok();
        done();
      });
  });
});
