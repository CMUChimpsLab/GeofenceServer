const VIEWS = {
  INDEX: "index",
  TASK_ADD: "task-add"
};

export const ROUTES = {
  INDEX: "/",
  TASK_ADD: "/" + VIEWS.TASK_ADD,
  DB: {
    TASK_ADD: "/db/" + VIEWS.TASK_ADD,
    TASK_DELETE: "/db/task-delete",
    TASK_FETCH: "/db/task-fetch",
    TASK_SYNC: "/db/task-sync",
    TASK_RESPOND: "/db/task-respond",
    USER_CREATE: "/db/user-create",
    USER_FETCH: "/db/user-fetch"
  }
};

const MODELS = {
  CHANGE_LOG: "changelog",
  TASK: "task",
  TASK_RESPONSE: "taskresponse",
  TASK_ACTION: "taskaction",
  TASK_ACTION_RESPONSE: "taskactionresponse",
  LOCATION: "location",
  USER: "user"
};

const HELPERS = {
  SUFFIX_ID_FIELD: "Id",
  CHANGE_LOG_STATUS_CREATED: "created",
  CHANGE_LOG_STATUS_DELETED: "deleted"
};

const CONSTANTS = {
  ROUTES: ROUTES,
  MODELS: MODELS,
  VIEWS: VIEWS,
  HELPERS: HELPERS
};

export default CONSTANTS;
