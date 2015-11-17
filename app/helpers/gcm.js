import gcmConfig from "../../config/gcm-config.json";
import request from "request";

export default class GCM {

  constructor() {
    this.options = {
      url: "https://gcm-http.googleapis.com/gcm/send",
      method: "POST",
      json: true, // automatically add "Content-Type": "application/json" to header
      headers: {
        "Authorization": "key=" + gcmConfig["api_key"]
      }
    };
  }

  sendMessage(obj, cb) {
    this.options.body = {
      to: "/topics/global",
      data: obj
    };

    request(this.options, (error, response, body) => {
      console.log("response.statusCode: " + response.statusCode);
      console.dir(body);
      cb(error);
    });
  }
}
