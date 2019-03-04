const rp= require('request-promise-native');

exports.getBalance = (address,network) => {
  let url='';
  (network==='mainnet')?url=`https://api.blockcypher.com/v1/btc/mainnet/addrs/${address}/balance`:url=`https://api.blockcypher.com/v1/btc/test3/addrs/${address}/balance`;
  const getUnspentOptions = {
    method:'GET',
    uri:url,
    json: true // Automatically parses the JSON string in the response
  };
  return rp(getUnspentOptions);
};

exports.getUnspent = (address,network) => {
  let url='';
  (network==='mainnet')?url=`https://api.blockcypher.com/v1/btc/mainnet/addrs/${address}?unspentOnly=true`:url=`https://api.blockcypher.com/v1/btc/test3/addrs/${address}?unspentOnly=true`;
  const getUnspentOptions = {
    method:'GET',
    uri:url,
    json: true // Automatically parses the JSON string in the response
  };
  return rp(getUnspentOptions);
};

exports.getTXHistory = (address,network) => {
  let url='';
  (network==='mainnet')?url=`https://api.blockcypher.com/v1/btc/mainnet/addrs/${address}/full`:url=`https://api.blockcypher.com/v1/btc/test3/addrs/${address}/full`;
  const getTXHistoryOptions = {
    method:'GET',
    uri:url,
    json: true // Automatically parses the JSON string in the response
  };
  return rp(getTXHistoryOptions);
};

const pushTX = (rawTX) => {
  return new Promise(async (resolve, reject) => {
    try {
      let url='';
      (network==='mainnet')?url=`https://api.blockcypher.com/v1/btc/mainnet/pushtx`:url=`https://api.blockcypher.com/v1/btc/test3/pushtx`;
      const postOptions = {
        method: 'POST',
        uri:url,
        body: {
          rawtx: rawTX
        },
        json: true
      };
      await rp(postOptions);
      resolve();
    } catch (e) {
      reject(e);
    }
  });
}