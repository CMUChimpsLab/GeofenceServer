import db from "../app/models";
import CONSTANTS, {ROUTES} from "../config/constants";

console.log("Start creating stub...\n");

const fakeUser = {id: "test@gmail.com"};

Promise.all([
  db[CONSTANTS.MODELS.USER].find({
    where: fakeUser
  }),
  db[CONSTANTS.MODELS.TASK].create({
    name: "Check Fridge",
    cost: 0,
    location: {
      name: "Home",
      lat: 40.4472512,
      lng: -79.9460148,
      radius: 60.0
    },
    taskactions: [{
      description: "How many eggs left?",
      type: "text"
    }, {
      description: "Is fridge clean?",
      type: "text"
    }]
  }, {
    include: [db[CONSTANTS.MODELS.TASK_ACTION], db[CONSTANTS.MODELS.LOCATION]]
  })
]).catch(error => {
  return console.log(error.message);
}).then(values => {
  const user = values[0];
  const userPromise = user ? new Promise((resolve, reject) => { resolve(user); }) : db[CONSTANTS.MODELS.USER].create(fakeUser);
  const task = values[1];

  db[CONSTANTS.MODELS.CHANGE_LOG].create({taskId: task.id, status: CONSTANTS.HELPERS.CHANGE_LOG_STATUS_CREATED});

  userPromise.then(user => {
    // instead of using addTaskactionresponse or addTaskactionresponses
    db[CONSTANTS.MODELS.TASK_ACTION_RESPONSE].bulkCreate([{
      userId: user.id,
      taskactionId: task.taskactions[0].id,
      response: "10"
    }, {
      userId: user.id,
      taskactionId: task.taskactions[1].id,
      response: "Yes"
    }]).then(() => {
      console.log("\nFinished creating stub.")
    }).catch(error => {
      return console.log(error.message);
    });
  }).catch(error => {
    return console.log(error.message);
  });
});
