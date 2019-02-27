const bitcoin = require('bitcoinjs-lib');
const testnet = bitcoin.networks.testnet;
const rp = require('request-promise-native');
const omniSend = require('omni-simple-send');

exports.genRawTXdata = (coinType,prikey, unspentArray,fromAddress, toAddress, btcSendValue,feeValue,network,omniPropertyId,omniSendValue) => {
  return new Promise((resolve, reject) => {
    try {
      if (unspentArray.length < 0) {
        throw new Error('No unspents');
      }
      const totalUnspent  = unspentArray.reduce((summ, { value }) => summ + value, 0);
      const changeValue     = totalUnspent - btcSendValue - feeValue;
      const txb = new bitcoin.TransactionBuilder(network);
      const keyPair = bitcoin.ECPair.fromWIF(prikey, network);
      const pubKey = keyPair.getPublicKeyBuffer();
      const pubKeyHash = bitcoin.crypto.hash160(pubKey);
      const redeemScript = bitcoin.script.witnessPubKeyHash.output.encode(pubKeyHash);
      
      unspentArray.forEach(({ tx_hash, tx_output_n }) => txb.addInput(tx_hash, tx_output_n));
      txb.addOutput(toAddress, btcSendValue);
      if(coinType==='omni'){
        const token = omniPropertyId;  
        const amount = omniSendValue;
        const omniData = omniSend(token, amount);
        const data = Buffer.from(omniData, "hex");
  
        const omniOutput = bitcoin.script.compile([
          bitcoin.opcodes.OP_RETURN,
          // payload for OMNI PROTOCOL:
          data
        ])
        txb.addOutput(omniOutput, 0);
      }
      if(changeValue>0){
        txb.addOutput(fromAddress, changeValue);
      }
      for (let [index, unspentItem] of unspentArray.entries()) {
        let unspentSatoshis = unspentItem.value;
        txb.sign(index, keyPair, redeemScript, null, unspentSatoshis);
      }
      const pushTX = txb.build().toHex();
      resolve(pushTX);
    } catch (e) {
      console.error(`收款地址：${toAddress} [buildPushTX] 失敗 ${e}`);
      reject(`[buildPushTX] ${e}`);
    }
  });
}


const postTX = async (pushTX, address) => {
  return new Promise(async (resolve, reject) => {
    try {
      console.log(`發送轉帳交易`)
      const postOptions = {
        method: 'POST',
        uri:`https://live.blockcypher.com/btc-testnet/pushtx`,
        //uri: 'https://route.cbx.io/api/proxy/litcoin/tx/send',
        body: {
          rawtx: pushTX
        },
        /*headers: {
          'authkey': 'd579bf4a2883cecf610785c49623ff'
        },*/
        json: true
      };
      await rp(postOptions);
      resolve();
    } catch (e) {
      console.error(`地址：${address} [postTX] 失敗`);
      reject(`[postTX] ${e}`);
    }
  });
}

exports.doTX = async (prikey,fromAddress,toAddress) => {
  try {
    const address = fromAddress;
    const unspentResult = await getUnspent(address);
    const unspentArray=unspentResult.txrefs;

    if(!unspentResult.txrefs){
      console.error('unspent 不存在');
    }
    if(unspentResult.unconfirmed_txrefs){
      console.error('有unconfirmed 交易');
    }
    if(!unspentResult.txrefs && unspentResult.unconfirmed_txrefs){
      console.error('尚無法交易');
       return;
    }

    if (unspentArray.length > 0) {
      console.log(address + ' 進行轉帳');
      const sendValue     = 80000 
      const feeValue      = 5000;
      const totalUnspent  = unspentArray.reduce((summ, { value }) => summ + value, 0);
      const changeValue     = totalUnspent - sendValue - feeValue;
      
      console.log('prikey',prikey);
      console.log('toAddress',toAddress);
      console.log('sendValue',sendValue);
      console.log('unspentArray',unspentArray)

      const signedTX = await buildPushTX(prikey, unspentArray,address, toAddress, sendValue,changeValue);
      //await postTX(signedTX, address);
      console.log('signedTX',signedTX);
    }
  } 
  catch (e) {
    console.error(e);
  }
}
