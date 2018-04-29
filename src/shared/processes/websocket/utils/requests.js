/* @flow */

/**
 * IDEX WebSocket API Requests
 *  Any requests that will be made of of the IDEX API should be
 *  made through the requests proxy object.  This provides a level
 *  of organization to all outgoing requests and allows us to provide
 *  a mechanism to easily organize and maintain the requests that
 *  may be made at any given point in time.
 *
 *  Similar to state reducers, these requests should never have side effects
 *  or contain any logic.  They simply take a payload and client and send the
 *  appropriate request through to the WebSocket via the clients send method.
 *
 *  All requests return a "signed" version of the request which includes the
 *  requests specific uuid via the "id" parameter.
 *
 *  Signed requests that are returned are "Read Only" and should never be
 *  mutated. Due to this, they will be returned as Frozen Immutable Objects and
 *  Flow will complain of any attempts to mutate them.
 */
import type {
  IDEXRequests,
  PayloadType,
  SupportEmailPayload,
  SignedPayloadType,
} from '../shared/types';

// import type { IDEXWebSocketClient } from './ws';

/**
 * IDEX WebSocket API Requests
 */
const requests: IDEXRequests = {
  /**
   * [logout description]
   * @type {[type]}
   */
  logout: async (
    client: IDEXWebSocketClient,
  ): Promise<void | SignedPayloadType> =>
    client.send({
      method: 'chatLogout',
    }),

  /**
   * [syncGasPrice description]
   * @type {[type]}
   */
  syncGasPrice: async (
    client: IDEXWebSocketClient,
  ): Promise<void | SignedPayloadType> =>
    !client.state.hasSyncedGasPrice
      ? client
        .send({
          method: 'getGasPrice',
        })
        .then(payload => {
          client.setState({
            hasSyncedGasPrice: true,
          });
          return payload;
        })
      : undefined,

  /**
   * [getGasPrice description]
   * @type {[type]}
   */
  getGasPrice: async (
    client: IDEXWebSocketClient,
  ): Promise<void | SignedPayloadType> =>
    client.send({
      method: 'getGasPrice',
    }),

  /**
   * [ping description]
   * @type {[type]}
   */
  ping: async (
    client: IDEXWebSocketClient,
  ): Promise<void | SignedPayloadType> =>
    client.send({
      method: 'ping',
    }),

  /**
   * [registerAddress description]
   * @type {[type]}
   */
  registerAddress: async (
    client: IDEXWebSocketClient,
    address: string,
  ): Promise<void | SignedPayloadType> =>
    client.send({
      method: 'subscribeEthereumAddress',
      payload: address.toLowerCase(),
    }),

  /**
   * [unregisterAddress description]
   * @type {[type]}
   */
  unregisterAddress: async (
    client: IDEXWebSocketClient,
    address: string,
  ): Promise<void | SignedPayloadType> =>
    client.send({
      method: 'unsubscribeEthereumAddress',
      payload: address.toLowerCase(),
    }),

  /**
   * [getTransactionGraph description]
   * @type {[type]}
   */
  getTransactionGraph: async (
    client: IDEXWebSocketClient,
  ): Promise<void | SignedPayloadType> =>
    client.send({
      method: 'getTransactionGraph',
    }),

  /**
   * [sendEmail description]
   * @type {[type]}
   */
  sendEmail: async (
    client: IDEXWebSocketClient,
    payload: SupportEmailPayload,
  ): Promise<void | SignedPayloadType> =>
    client.send({
      method: 'sendSupportEmail',
      payload,
    }),

  /**
   * [getServerBlock description]
   * @type {[type]}
   */
  getServerBlock: async (
    client: IDEXWebSocketClient,
  ): Promise<void | SignedPayloadType> =>
    client.send({
      method: 'getServerBlock',
    }),

  /**
   * [getEthPrice description]
   * @type {[type]}
   */
  getEthPrice: async (
    client: IDEXWebSocketClient,
  ): Promise<void | SignedPayloadType> =>
    client.send({
      method: 'getEthPrice',
    }),

  /**
   * [makeOrder description]
   * @type {[type]}
   */
  makeOrder: async (
    client: IDEXWebSocketClient,
    payload: PayloadType,
  ): Promise<void | SignedPayloadType> =>
    client.send({
      method: 'makeOrder',
      payload,
    }),

  /**
   * [makeCancel description]
   * @type {[type]}
   */
  makeCancel: async (
    client: IDEXWebSocketClient,
    payload: PayloadType,
  ): Promise<void | SignedPayloadType> =>
    client.send({
      method: 'makeCancel',
      payload,
    }),

  /**
   * [makeCancelAll description]
   * @type {[type]}
   */
  makeCancelAll: async (
    client: IDEXWebSocketClient,
    payload: PayloadType,
  ): Promise<void | SignedPayloadType> =>
    client.send({
      method: 'makeCancelAll',
      payload,
    }),

  /**
   * [makeCancelSet description]
   * @type {[type]}
   */
  makeCancelSet: async (
    client: IDEXWebSocketClient,
    payload: PayloadType,
  ): Promise<void | SignedPayloadType> =>
    client.send({
      method: 'makeCancelSet',
      payload,
    }),

  /**
   * [makeWithdrawal description]
   * @type {[type]}
   */
  makeWithdrawal: async (
    client: IDEXWebSocketClient,
    payload: PayloadType,
  ): Promise<void | SignedPayloadType> =>
    client.send({
      method: 'makeWithdrawal',
      payload,
    }),

  /**
   * [makeTrade description]
   * @type {[type]}
   */
  makeTrade: async (
    client: IDEXWebSocketClient,
    payload: PayloadType,
  ): Promise<void | SignedPayloadType> =>
    client.send({
      method: 'makeTrade',
      payload,
    }),

  /**
   * [makeInvalidate description]
   * @type {[type]}
   */
  makeInvalidate: async (
    client: IDEXWebSocketClient,
    payload: PayloadType,
  ): Promise<void | SignedPayloadType> =>
    client.send({
      method: 'invalidateCancelledOrders',
      payload,
    }),

  /**
   * [requestHighestCancelledOrderNonce description]
   * @type {[type]}
   */
  requestHighestCancelledOrderNonce: async (
    client: IDEXWebSocketClient,
    payload: PayloadType,
  ): Promise<void | SignedPayloadType> =>
    client.send({
      method: 'requestHighestCancelledOrderNonce',
      payload,
    }),

  /**
   * [getOrders description]
   * @type {[type]}
   */
  getOrders: async (
    client: IDEXWebSocketClient,
    payload: PayloadType,
  ): Promise<void | SignedPayloadType> =>
    client.send({
      method: 'getOrders',
      payload,
    }),

  /**
   * [doSync description]
   * @type {[type]}
   */
  doSync: async (
    client: IDEXWebSocketClient,
    payload: PayloadType,
  ): Promise<void | SignedPayloadType> =>
    client.send({
      method: 'doSync',
      payload,
    }),

  /**
   * [postMessage description]
   * @type {[type]}
   */
  postMessage: async (
    client: IDEXWebSocketClient,
    payload: PayloadType,
  ): Promise<void | SignedPayloadType> =>
    client.send({
      method: 'postMessage',
      payload,
    }),

  /**
   * [doSyncWithdrawals description]
   * @type {[type]}
   */
  doSyncWithdrawals: async (
    client: IDEXWebSocketClient,
    payload: PayloadType,
  ): Promise<void | SignedPayloadType> =>
    client.send({
      method: 'syncWithdrawals',
      payload,
    }),

  /**
   * [doSyncDeposits description]
   * @type {[type]}
   */
  doSyncDeposits: async (
    client: IDEXWebSocketClient,
    payload: PayloadType,
  ): Promise<void | SignedPayloadType> =>
    client.send({
      method: 'syncDeposits',
      payload,
    }),
  /**
   * [doSyncTrades description]
   * @type {[type]}
   */
  doSyncTrades: async (
    client: IDEXWebSocketClient,
    payload: PayloadType,
  ): Promise<void | SignedPayloadType> =>
    client.send({
      method: 'doTradeSync',
      payload,
    }),

  /**
   * [doSyncCancels description]
   * @type {[type]}
   */
  doSyncCancels: async (
    client: IDEXWebSocketClient,
    payload: PayloadType,
  ): Promise<void | SignedPayloadType> =>
    client.send({
      method: 'doCancelSync',
      payload,
    }),
};

export default requests;
