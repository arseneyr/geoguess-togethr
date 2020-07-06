import { CustomWebSocket } from "./handleSignal";
import sendSignal from "./sendSignal";

interface PublishToClientPayload {
  type: "pubToClient";
  payload: any;
}

const handlePublishToClient = (
  ws: CustomWebSocket,
  data: PublishToClientPayload
) => {
  sendSignal(ws, data.payload);
};

export default handlePublishToClient;
