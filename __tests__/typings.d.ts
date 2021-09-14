import type http from "http";
import type https from "https";

declare global {
  // eslint-disable-next-line no-var
  var __verdaccioServer: http.Server | https.Server;
}
