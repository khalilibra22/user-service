import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import path from "path";

export let PROTO_PATH = path.join(__dirname, "../../../proto/user.proto");
if (__dirname.includes("dist")) {
  PROTO_PATH = path.join(process.cwd(), "proto/user.proto");
}
console.log("PROTO_PATH:", PROTO_PATH);
export const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

export const userProto = grpc.loadPackageDefinition(packageDefinition)
  .user as any;
