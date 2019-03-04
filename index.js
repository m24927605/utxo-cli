const inquirer = require("inquirer");
const chalk = require("chalk");
const figlet = require("figlet");
const shell = require("shelljs");
const bitcoin = require('bitcoinjs-lib');
const { Observable } = require('rxjs');
const _=require('lodash');
const addrService=require('./lib/addr');
const apiService=require('./lib/api');
const TXService=require('./lib/tx');
let NETWORK='';
let COINTYPE='';

const init = () => {
  console.log(
    chalk.green(
      figlet.textSync("UTXO CLI", {
        font: "Ghost",
        horizontalLayout: "default",
        verticalLayout: "default"
      })
    )
  );
}

const walletObserve =  Observable.create((obs) => {
  obs.next({
    name: "cryptoCoinType",
    type: 'list',
    message: "Please choose the coin type(btc or omni layer coin).",
    choices:[{ name: 'BTC', value: 'btc' },{ name: 'OMNI-LAYER coin', value: 'omni' },{ name: 'BCH', value: 'bch' },{ name: 'LTC', value: 'ltc' }]
  });

  obs.next({
    name: "mnemonic",
    type: 'password',
    message: "What is your mnemonic seed?"
  });

  obs.next({
    name: "addressType",
    type: 'list',
    message: "Please choose the address type like p2pkh or p2sh.",
    choices:[{ name: 'p2pkh', value: 'p2pkh' },{ name: 'p2sh', value: 'p2sh' }]
  });

  obs.next({
    name: "addressCount",
    type: "number",
    message: "How many addresses do you want to list?"
  });

  obs.next({
    name: "network",
    type: 'list',
    message: "Please choose the network type like mainnet or testnet.",
    choices: [{ name: 'mainnet', value: 'mainnet' },{ name: 'testnet', value: 'testnet' }]
  });
  obs.complete();
});

const serviceObserve =  Observable.create((obs) => {
  obs.next({
    name: "serviceType",
    type: 'list',
    message: 'What services do you want?',
    choices: [{ name: 'API services', value: 'API' },{ name: 'do Transaction', value: 'doTX' }]
  });

  obs.complete();
});

const featureKindObserve =  Observable.create((obs) => {
  obs.next({
    name: "featureKind",
    type: 'list',
    message: 'What feature do you want to do?',
    choices: [{ name: 'Show balance', value: 'balance' },{ name: 'Show unspent', value: 'unspent' },{ name: 'Show transaction history', value: 'TXHistory' }]
  });

  obs.complete();
});

const pickAddressObserve = (addresses) =>{
  let addressArray=[];
  for(let i=0;i<addresses.length;i++){
    addressArray.push(addresses[i].address);
  }
  return Observable.create((obs) => {
    obs.next({
      name: "mutiAddress",
      type: 'checkbox',
      message: 'Please pick address to be fromAddress in transaction:',
      choices: addressArray
    });
  
    obs.complete();
  });
}

const pickOneAddressObserve = (addresses) =>{
  let addressArray=[];
  for(let i=0;i<addresses.length;i++){
    addressArray.push(addresses[i].address);
  }
  return Observable.create((obs) => {
    obs.next({
      name: "oneAddress",
      type: 'list',
      message: 'Please pick address to be fromAddress in transaction:',
      choices: addressArray
    });
  
    obs.complete();
  });
}

const changeAddressObserve = (addresses)=>{
  let addressArray=[];
  for(let i=0;i<addresses.length;i++){
    addressArray.push(addresses[i].address);
  }
  return Observable.create((obs) => {
    obs.next({
      name: "changeAddress",
      type: 'list',
      message: 'Please pick one address to be change receive address in transaction:',
      choices: addressArray
    });
  
    obs.complete();
  });
}

const toAddressObserve =  Observable.create((obs) => {
  obs.next({
    name: "toAddress",
    type:'input',
    message: 'Please key in receive address'
  });

  obs.complete();
});

const servicePrompt=()=>{
  return new Promise(async(resolve,reject)=>{
    let {serviceType} =await inquirer.prompt(serviceObserve);
    console.log(serviceType)
    resolve(serviceType);
  })
}

const featureKindPrompt=()=>{
  return new Promise(async(resolve,reject)=>{
    let data=await inquirer.prompt(featureKindObserve);
    const { featureKind} = data;
    resolve(featureKind);
  })
}

const walletPrompt=()=>{
  return new Promise((resolve,reject)=>{
    try{
      inquirer.prompt(walletObserve)
      .then(async(answers) => {
        const { mnemonic,addressType, addressCount ,network,cryptoCoinType} = answers;
        COINTYPE=cryptoCoinType;
        (network==='mainnet')?NETWORK='mainnet':NETWORK='testnet';
        (network==='mainnet')?netType=bitcoin.networks.bitcoin:netType=bitcoin.networks.testnet;
        let addrArray= await addrService.genAddress(mnemonic,addressCount,netType,addressType);
        for(let i=0;i<addrArray.length;i++){
          console.log(chalk.green(`${i} WIF Private Key:${addrArray[i].wif} address:${addrArray[i].address}`));
        }
        resolve({coinType:cryptoCoinType,addresses:addrArray});
      })
    }catch(e){
      reject(e);
    }
  })
}

const pickOneAddressPrompt=(addresses)=>{
  return new Promise(async(resolve,reject)=>{
    try{
      let {oneAddress}=await inquirer.prompt(pickOneAddressObserve(addresses));
      console.log('You pick address:'+address);
      resolve(oneAddress);
    }catch(e){
      reject(e);
    }
  })
}

const pickAddressPrompt=(addresses)=>{
  return new Promise(async(resolve,reject)=>{
    try{
      let { mutiAddress}=await inquirer.prompt(pickAddressObserve(addresses));
      console.log('You pick address:'+address);
      resolve(mutiAddress);
    }catch(e){
      reject(e);
    }
  })
}

const APIfeatureService=(feature,address,network)=>{
  return new Promise(async(resolve,reject)=>{
    try{
      let data=null;
      switch (feature) {
        case 'balance':
          data= await apiService.getBalance(address,network);
          break;
        case 'unspent':
          data= await apiService.getUnspent(address,network);
          break;
        case 'TXHistory':
          data= await apiService.getTXHistory(address,network);
          break;
        default:
          break;
      }
      resolve(data);
    }catch(e){
      reject(e);
    }
  })
}

const main =async () => {
  try{
    init();
    let walletData= await walletPrompt();
    let serviceType = await servicePrompt();
    if(serviceType==='API'){
      let address=await pickOneAddressPrompt(walletData.addresses);
      console.log(address);
      let feature= await featureKindPrompt();
      let APIData= await APIfeatureService(feature,address,NETWORK);
      console.log(APIData);
    }
    else if (serviceType==='doTX'){
      let address= await pickAddressPrompt(walletData.addresses);
      console.log(address);
      const conditionArray=[];
      for(let i=0;i<address.length;i++){
        conditionArray.push({address:address[i]});
      }
      let pickWalletData= _.intersectionBy(walletData.addresses, conditionArray, 'address');
      let {toAddress}=await inquirer.prompt(toAddressObserve);
      let {changeAddress}=await inquirer.prompt(changeAddressObserve);
       await TXService.doTX(pickWalletData,network,toAddress,changeAddress);
    }

  }catch(e){
    console.log(chalk.red(e.message));
  }
};

main();