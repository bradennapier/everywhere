/* @flow */

/**
 * IDEX WebSocket FlowTypes
 */

import type { IDEXWebSocketClient } from '../ws';

export type WebSocketState = {
  connected: boolean,
  syncing: void | boolean,
  ws: void | WebSocket,

  queue: Array<*>,
  sendQueue: Array<*>,
  map: Object,

  hasSyncedGasPrice: boolean,
};

export type SupportEmailPayload = {};

export type PayloadType = {
  method?: string,
  payload?: string | SupportEmailPayload,
};

export type SignedPayloadType = {
  +id: string,
} & PayloadType;

export interface IDEXRequests {
  logout: (client: IDEXWebSocketClient) => Promise<void | SignedPayloadType>;
  syncGasPrice: (
    client: IDEXWebSocketClient,
  ) => Promise<void | SignedPayloadType>;
  getGasPrice: (
    client: IDEXWebSocketClient,
  ) => Promise<void | SignedPayloadType>;
  ping: (client: IDEXWebSocketClient) => Promise<void | SignedPayloadType>;
  registerAddress: (
    client: IDEXWebSocketClient,
    address: string,
  ) => Promise<void | SignedPayloadType>;
  unregisterAddress: (
    client: IDEXWebSocketClient,
    address: string,
  ) => Promise<void | SignedPayloadType>;
  getTransactionGraph: (
    client: IDEXWebSocketClient,
  ) => Promise<void | SignedPayloadType>;
  sendEmail: (
    client: IDEXWebSocketClient,
    payload: SupportEmailPayload,
  ) => Promise<void | SignedPayloadType>;
  getServerBlock: (
    client: IDEXWebSocketClient,
  ) => Promise<void | SignedPayloadType>;
  getEthPrice: (
    client: IDEXWebSocketClient,
  ) => Promise<void | SignedPayloadType>;
}
