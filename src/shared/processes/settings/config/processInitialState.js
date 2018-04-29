import Immutable from 'seamless-immutable';

export const getInitialThemeSettings = () =>
  Immutable.from({
    theme: 'light',
  });

export const getInitialMarketSettings = () =>
  Immutable.from({
    minimumGasTx: 22000,
    maxInfuraCalls: 50,
    ethereumPanelTimeout: 7000,
    fullPrecision: 18,
    rationalPrecision: 8,
    reducedPrecision: 4,
    getAccountsTimeout: 6000,
    pendingExpiration: 300000,
    pollTimeout: 45000,
    retryTimeout: 8000,
    syncChunkSize: 1000,
    pingTimeout: 3000,
    blockPollInterval: 5000,
    avgEthDepositGas: '50000',
    avgErc20DepositGas: '80000',
    maxDepositGas: '250000',
    gasPriceOverride: '40000000000',
    dateFormat: 'YYYY-MM-DD HH:mm:ss',
    rewardsDateFormat: 'YYYY-MM-DD',
    accountPollInterval: 5000,
    walletRehash: 2048,
    loginAfterCreate: false,
    marketOrderRetry: 5,
    chatDateFormat: 'DD-MM-YY HH:mm',
    rowEnterDuration: 300,
    rowLeaveDuration: 200,
    tradeReachPerQueryDays: 7,
    maxTradeResults: 10000,
    defaultGasPrice: '40',
    tradeMatchTolerance: 0.00001,
    noPriceDataPlaceholder: '',
  });

export const getInitialState = () =>
  Immutable.from({
    theme: getInitialThemeSettings(),
    market: getInitialMarketSettings(),
  });
