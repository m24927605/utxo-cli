const bip32 = require('bip32');
const bip39 = require('bip39');
const bitcoin = require('bitcoinjs-lib');

exports.genAddress=(mnemonic,addressCount,network,addrType)=>{
  return new Promise((resolve,reject)=>{
    try{
      const seed = bip39.mnemonicToSeed(mnemonic);
      const node = bip32.fromSeed(seed,network);
      let result=[];
      for(let i=0;i<addressCount;i++){
        let obj={};
        let child = node.derivePath(`m/44'/0'/0'/0/${i}`);
        let wif= child.toWIF(); 
        let keyPair = bitcoin.ECPair.fromWIF(wif,network);
        obj.wif=wif;
        switch (addrType) {
          case 'p2sh':
            let pubKey = keyPair.getPublicKeyBuffer();
            let redeemScript = bitcoin.script.witnessPubKeyHash.output.encode(bitcoin.crypto.hash160(pubKey));
            let scriptPubKey = bitcoin.script.scriptHash.output.encode(bitcoin.crypto.hash160(redeemScript));
            let address = bitcoin.address.fromOutputScript(scriptPubKey, network);
            obj.address=address;
            break;
          case 'p2pkh':
          obj.address = keyPair.getAddress();
            break;
          default:
            throw new Error('Please choose the address type like p2pkh or p2sh.');
        }
        result.push(obj);
      }
      resolve(result);
    }catch(e){
      console.error(e);
      reject(e);
    }
  })
}