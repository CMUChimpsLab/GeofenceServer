const VIEWS = {
  INDEX: "index",
  LOCATION_ADD: "location-add",
  LOCATION_DELETE: "location-delete"
};

export const ROUTES = {
  INDEX: "/",
  LOCATION_ADD: "/" + VIEWS.LOCATION_ADD,
  LOCATION_DELETE: "/" + VIEWS.LOCATION_DELETE,
  DB: {
    LOCATION_ADD: "/db/" + VIEWS.LOCATION_ADD,
    LOCATION_DELETE: "/db/" + VIEWS.LOCATION_DELETE
  }
};

const MODELS = {
  LOCATION: "location"
};

const CONSTANTS = {
  ROUTES: ROUTES,
  MODELS: MODELS,
  VIEWS: VIEWS
};

export default CONSTANTS;
