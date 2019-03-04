const bitcoin = require('bitcoinjs-lib');
const rp = require('request-promise-native');
const omniSend = require('omni-simple-send');
const apiService=require('./api');


const genRawTXdata = (coinType,prikey, unspentArray,changeAddress, toAddress, btcSendValue,feeValue,network,omniPropertyId,omniSendValue) => {
  return new Promise((resolve, reject) => {
    try {
      if (unspentArray.length < 0) {
        throw new Error('No unspent.');
      }
      const totalUnspent  = unspentArray.reduce((summ, { value }) => summ + value, 0);
      const changeValue     = totalUnspent - btcSendValue - feeValue;
      const txb = new bitcoin.TransactionBuilder(network);
      
      unspentArray.forEach(({ tx_hash, tx_output_n }) => txb.addInput(tx_hash, tx_output_n));
      txb.addOutput(toAddress, btcSendValue);
      if(coinType==='omni'){
        const token = omniPropertyId;  
        const amount = omniSendValue;
        const omniData = omniSend(token, amount);
        const data = Buffer.from(omniData, "hex");
  
        const omniOutput = bitcoin.script.compile([
          bitcoin.opcodes.OP_RETURN,
          data
        ])
        txb.addOutput(omniOutput, 0);
      }
      if(changeValue>0){
        txb.addOutput(changeAddress, changeValue);
      }
      for (let [index, unspentItem] of unspentArray.entries()) {
        let keyPair = bitcoin.ECPair.fromWIF(prikey, network);
        let pubKey = keyPair.getPublicKeyBuffer();
        let pubKeyHash = bitcoin.crypto.hash160(pubKey);
        let redeemScript = bitcoin.script.witnessPubKeyHash.output.encode(pubKeyHash);
        let unspentSatoshis = unspentItem.value;
        txb.sign(index, keyPair, redeemScript, null, unspentSatoshis);
      }
      const pushTX = txb.build().toHex();
      resolve(pushTX);
    } catch (e) {
      reject(e);
    }
  });
}


const postTX = async (pushTX, address) => {
  return new Promise(async (resolve, reject) => {
    try {
      const postOptions = {
        method: 'POST',
        uri:`https://live.blockcypher.com/btc-testnet/pushtx`,
        body: {
          rawtx: pushTX
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

exports.doTX =  (pickWalletData,network,toAddress,changeAddress) => {
  return new Promise(async()=>{
    try {
      const getUnspentArray=[];

      for(let i=0;i<pickWalletData.length;i++){
        getUnspentArray.push(apiService.getUnspent(pickWalletData[i].address));
      }
      let unspentArray=await Promise.all(getUnspentArray);
      console.log('unspentArray',unspentArray);
      if (unspentArray.length > 0) {
        const sendValue     = 80000 
        const feeValue      = 5000;
        const totalUnspent  = unspentArray.reduce((summ, { value }) => summ + value, 0);
        const changeValue     = totalUnspent - sendValue - feeValue;
        const signedTX = await genRawTXdata( pickWalletData,address, toAddress, sendValue,changeValue);
        console.log('signedTX',signedTX);
      }
    } 
    catch (e) {
      reject(e);
    }
  }) 
}


/*
if(!unspentResult.txrefs){
          console.error('Unspent is not existed.');
        }
        if(unspentResult.unconfirmed_txrefs){
          console.error('There are some unconfirmed transactions.');
        }
        if(!unspentResult.txrefs && unspentResult.unconfirmed_txrefs){
          console.error('There is no unspent and no unconfirmed transaction.');
           return;
        }
*/