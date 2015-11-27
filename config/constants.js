const VIEWS = {
  INDEX: "index",
  TASK_ADD: "task-add",
  TASK_DELETE: "task-delete"
};

export const ROUTES = {
  INDEX: "/",
  TASK_ADD: "/" + VIEWS.TASK_ADD,
  TASK_DELETE: "/" + VIEWS.TASK_DELETE,
  DB: {
    TASK_ADD: "/db/" + VIEWS.TASK_ADD,
    TASK_DELETE: "/db/" + VIEWS.TASK_DELETE
  }
};

const MODELS = {
  TASK: "task",
  TASK_ACTION: "taskaction",
  LOCATION: "location",
  SUFFIX_ID_FIELD: "Id"
};

const CONSTANTS = {
  ROUTES: ROUTES,
  MODELS: MODELS,
  VIEWS: VIEWS
};

export default CONSTANTS;
