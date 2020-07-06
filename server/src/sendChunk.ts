import PubSub from "pubsub-js";
import ConnectionChunk from "./ConnectionChunk";
import { CustomWebSocket } from "./handleSignal";
import sendSignal from "./sendSignal";

const sendChunk = (
  ws: CustomWebSocket,
  connectionChunk: ConnectionChunk,
  userId: string
) => {
  const { id, signals } = connectionChunk;
  sendSignal(ws, { type: "offerAccepted", id, userId });
  PubSub.publish(`signal/user/${userId}`, {
    type: "accept",
    signals,
    id,
    userId: ws.context.userId,
  });
  // forward future connection requests to the peer
  ws.context.connectedPeers[id] = userId;
};

export default sendChunk;
