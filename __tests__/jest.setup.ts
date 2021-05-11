import type http from "http";
import type https from "https";
import path from "path";

import detectFreePort from "detect-port";
import startVerdaccio from "verdaccio";

const VERDACCIO_CACHE_PATH = path.join(__dirname, ".verdaccio-cache");

const config = {
  storage: VERDACCIO_CACHE_PATH,

  auth: {
    // htpasswd: {
    //   file: "./htpasswd",
    //   // Maximum amount of users allowed to register, defaults to "+inf".
    //   // You can set this to -1 to disable registration.
    //   //max_users: 1000
    // },
    // "auth-memory": {
    //   users: {
    //     foo: {
    //       name: "foo",
    //       password: "s3cret",
    //     },
    //     bar: {
    //       name: "bar",
    //       password: "s3cret",
    //     },
    //   },
    // },
  },

  // a list of other known repositories we can talk to
  uplinks: {
    // npmjs: {
    //   url: "https://registry.npmjs.org/",
    //   max_fails: 40,
    //   maxage: "30m",
    //   timeout: "60s",
    //   agent_options: {
    //     keepAlive: true,
    //     // Avoid exceeding the max sockets that are allocated per VM.
    //     // https://docs.microsoft.com/en-us/azure/app-service/app-service-web-nodejs-best-practices-and-troubleshoot-guide#my-node-application-is-making-excessive-outbound-calls
    //     maxSockets: 40,
    //     maxFreeSockets: 10,
    //   },
    // },

    npmjs: {
      url: "https://registry.npmjs.org/",
      cache: true,
    },
  },

  packages: {
    "@jstm-test/*": {
      access: "$all",
      publish: "$all",
    },

    "**": {
      access: "$all",
      publish: "$authenticated",
      proxy: "npmjs",
    },
  },

  logs: { type: "stdout", format: "pretty", level: "warn" },

  server: {
    keepAliveTimeout: 0,
  },
};

const startVerdaccioServer = (
  port: number
): Promise<http.Server | https.Server> =>
  new Promise((resolve, reject) => {
    let isDone = false;

    setTimeout(() => {
      if (isDone) return;
      reject(new Error("verdaccio failed to start within 10s"));
      isDone = true;
    }, 10000);

    startVerdaccio(
      config,
      "6000",
      VERDACCIO_CACHE_PATH,
      "1.0.0",
      "verdaccio",
      (webServer) => {
        webServer.listen(port, () => {
          if (isDone) return;
          isDone = true;
          resolve(webServer);
        });
      }
    );
  });

export = async (): Promise<void> => {
  const port = await detectFreePort(4186);
  const verdaccioServer = await startVerdaccioServer(port);
  global.__verdaccioServer = verdaccioServer;
  console.log("Verdaccio registry started", {
    url: `http://localhost:${port}/`,
  });
};
