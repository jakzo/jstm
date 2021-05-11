const stopVerdaccioServer = (): Promise<void> =>
  new Promise((resolve, reject) => {
    global.__verdaccioServer.close((err) => {
      if (err) reject(err);
      else resolve();
    });
  });

export = async (): Promise<void> => {
  await stopVerdaccioServer();
  console.log("Verdaccio registry stopped");
};
