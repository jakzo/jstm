import type http from "http";
import type https from "https";

declare global {
  namespace NodeJS {
    interface Global {
      __verdaccioServer: http.Server | https.Server;
    }
  }
}
