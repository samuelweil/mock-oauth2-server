import express from "express";
import * as http from "http";
import * as bodyParser from "body-parser";

const log =
  process.env["NODE_ENV"]?.toLowerCase() === "debug"
    ? (msg: string) => process.stdout.write(msg)
    : (msg: string) => {};

function Server(app: express.Express): http.Server {
  return http.createServer(app);
}

function btoa(s: string): string {
  return Buffer.from(s).toString("base64");
}

function atob(s: string): string {
  return Buffer.from(s, "base64").toString();
}

function encodeToken(token: any): string {
  return btoa(JSON.stringify(token));
}

function decodeToken<T = any>(s: string): T {
  return JSON.parse(atob(s));
}

function authorize(req: express.Request, res: express.Response): void {
  log("Authorizing...");

  const { response_type } = req.query;

  let response: { [index: string]: any } = {};
  response[response_type || "id_token"] = encodeToken(req.body);
  res.send(response);

  log("Done\n");
}

function introspect(req: express.Request, res: express.Response): void {
  log("Inspecting token...");

  const { token } = req.body;
  try {
    const response = {
      active: true,
      ...decodeToken(token)
    };
    res.send(response);
  } catch (error) {
    res.send({ active: false });
  }

  log("Done");
}

const port = process.env["PORT"] || 3001;
const hostname = process.env["HOSTNAME"] || `http://localhost:${port}`;

const endpoints = {
  authorization_endpoint: `${hostname}/authorize`,
  introspection_endpoint: `${hostname}/introspect`,
  token_endpoint: `${hostname}/token`
};

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.get("/.well-known/openid-configuration", (req, res) => {
  res.send(endpoints);
});

app.post("/authorize", authorize);
app.post("/token", authorize);
app.post("/introspect", introspect);

const server = Server(app);
server.keepAliveTimeout = 1000;

process.on("SIGINT", () => {
  server.close(() => {
    log("Closed server");
  });
});

server.listen(port, () => {
  log(`Started server ${hostname} on port ${port}`);
});
