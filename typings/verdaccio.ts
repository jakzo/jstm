declare module "verdaccio" {
  import http from "http";
  import https from "https";

  const startVerdaccio: (
    config: Record<string, unknown>,
    cliListen: string,
    configPath: string,
    pkgVersion: string,
    pkgName: string,
    callback: (webServer: http.Server | https.Server) => void
  ) => void;

  export default startVerdaccio;
}
