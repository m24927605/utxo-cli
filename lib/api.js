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

const pushTX = (rawTX) => {
  return new Promise(async (resolve, reject) => {
    try {
      const postOptions = {
        method: 'POST',
        uri:`https://live.blockcypher.com/btc-testnet/pushtx`,
        //uri: 'https://route.cbx.io/api/proxy/litcoin/tx/send',
        body: {
          rawtx: rawTX
        },
        /*headers: {
          'authkey': 'd579bf4a2883cecf610785c49623ff'
        },*/
        json: true
      };
      await rp(postOptions);
      resolve();
    } catch (e) {
      reject(e);
    }
  });
}