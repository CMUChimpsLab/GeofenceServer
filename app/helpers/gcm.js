const debug = require("debug")("app:helpers:gcm");
import gcmConfig from "../../config/gcm-config.json";
import request from "request";

export default class GCM {

  constructor() {
    this.options = {
      url: "https://gcm-http.googleapis.com/gcm/send",
      method: "POST",
      json: true, // this automatically adds "Content-Type": "application/json" to header
      headers: {
        "Authorization": "key=" + gcmConfig["api_key"]
      }
    };
  }

  sendMessage(obj, to, cb) {
    // TODO: use object extend
    this.options.body = {
      to: to == "all" ? "/topics/global" : to,
      data: obj
    };

    request(this.options, (error, response, body) => {
      if (error) {
        debug(error);
      }
      else {
        debug("gcm request finished with response.statusCode: " + response.statusCode);
        debug("gcm request response:", body);
      }

      cb(error, body);
    });
  }
}
