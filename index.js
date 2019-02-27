const inquirer = require("inquirer");
const chalk = require("chalk");
const figlet = require("figlet");
const shell = require("shelljs");
const bitcoin = require('bitcoinjs-lib');
const { Observable } = require('rxjs');
const addrService=require('./lib/addr');

const walletObserve =  Observable.create((obs) => {

  obs.next({
    name: "cryptoCoinType",
    type: 'list',
    message: "Please choose the coin type(btc or omni layer coin).",
    choices:[{ name: 'btc', value: 'btc' },{ name: 'omni-layer coin', value: 'omni' }]
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
    message: "How many addresses do you want to generate?"
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
    choices: [{ name: 'API', value: 'API' },{ name: 'wallet', value: 'wallet' }]
  });

  obs.complete();
});

const txObserve =  Observable.create((obs) => {

  obs.next({
    name: "wantTX",
    message: 'Do you want to do a trasaction?',
    default: false
  });

  obs.complete();
});

const init = () => {
  console.log(
    chalk.green(
      figlet.textSync("BTC/OMNI CLI", {
        font: "Ghost",
        horizontalLayout: "default",
        verticalLayout: "default"
      })
    )
  );
}

const servicePrompt=()=>{
  return new Promise(async(resolve,reject)=>{
    let service=await inquirer.prompt(serviceObserve);
    const { serviceType} = service;
    if(serviceType==='API'){
      reject(new Error('not yet'));
    }
    resolve();
  })
}

const walletPrompt=()=>{
  return new Promise((resolve,reject)=>{
    try{
      inquirer.prompt(walletObserve)
      .then(async(answers) => {
        const { mnemonic,addressType, addressCount ,network,cryptoCoinType} = answers;
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

const tx=()=>{
  return new Promise((resolve,reject)=>{
    inquirer.prompt(txObserve)
    .then((yesOrnot)=>{
      if(yesOrnot){
      
      }
    })
  })
}

const main =async () => {
  try{
    init();
    await servicePrompt();
    let data= await walletPrompt();
    console.log(data);
  }catch(e){
    console.log(chalk.red(e.message));
  }
};

main();
