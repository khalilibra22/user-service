import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import path from 'path';


export const PROTO_PATH = path.join(__dirname, '../../../proto/user.proto');
export const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

export const userProto = grpc.loadPackageDefinition(packageDefinition).user as any;