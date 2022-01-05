import React, { useEffect, useState } from 'react';
import './App.css';

// Blockchain Imports 
import { CONTRACT_ADDRESS, transformCharacterData } from './constants';
import generationOmega from './utils/GenerationOmega.json';
import { ethers } from 'ethers';

// Custom Components
import ExploreWasteland from './components/ExploreWasteland';
import LoadingIndicator from './components/LoadingIndicator';
import Navbar from './components/Navbar';
import MintCharacter from './components/MintCharacter';
import SelectCharacter from './components/SelectCharacter';



// Constants
import twitterLogo from './assets/twitter-logo.svg';
const TWITTER_HANDLE = 'GenerationOmega';
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;

const App = () => {
  // State
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(null);
  const [currentAccount, setCurrentAccount] = useState(null);
  const [characterList, setCharacterList] = useState([]);
  const [characterNFT, setCharacterNFT] = useState(null);
  const [location, setLocation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const checkIfWalletIsConnected = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        console.log('Make sure you have MetaMask!');
        return;
      } else {
        console.log('We have the ethereum object', ethereum);
        /*
         * Check if we're authorized to access the user's wallet
         */
        const accounts = await ethereum.request({ method: 'eth_accounts' });

        /*
         * User can have multiple authorized accounts, we grab the first one if its there!
         */
        if (accounts.length !== 0) {
          const account = accounts[0];
          console.log('Found an authorized account:', account);
          setCurrentAccount(account);
        } else {
          console.log('No authorized account found');
        }


        /*
         * Check if we are on the correct network verison
         */
        const networkVersion = await ethereum.request({ method: 'eth_chainId' });
        if (networkVersion === '0x4') {
          console.log('Client connected to CORRECT Network Version: ' + networkVersion);
          setIsCorrectNetwork(true);
        } else {
          console.log('Client connected to INCORRECT Network Version: ' + networkVersion);
          setIsCorrectNetwork(false);
        }
      }
    } catch (error) {
      console.log(error);
    }
  };

  const connectWalletAction = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert('Get MetaMask!');
        return;
      }

      /*
       * Fancy method to request access to account.
       */
      const accounts = await ethereum.request({
        method: 'eth_requestAccounts',
      });

      /*
       * Boom! This should print out public address once we authorize Metamask.
       */
      console.log('Connected', accounts[0]);
      setCurrentAccount(accounts[0]);
    } catch (error) {
      console.log(error);
    }
  };

  // Render Methods
  const renderContent = () => {
    console.log("Location:" + location);
    if (isLoading) {
      return <LoadingIndicator />;
    }  

    /*
    * Scenario #0: Wrong Network Not Connected
    */
    if (!isCorrectNetwork) {
      return (
        <div className="select-character-container">
          <h2>You are on the wrong network! Please connect to Rinkeby to continue.</h2>
        </div>
      );
    }

    /*
    * Scenario #1: Account Not Connected
    */
    else if (!currentAccount) {
      return (
        <div className="connect-wallet-container">
          <img
            src="http://pa1.narvii.com/6335/113796f7ded0f179eee7ea4ae68db23ca97412ce_hq.gif"
            alt="Sword Art Online Gif"
          />
          <button
            className="cta-button connect-wallet-button"
            onClick={connectWalletAction}
          >
            Connect Wallet To Get Started
          </button>
        </div>
      );
    }
    /*
    * Scenario #2: Connected Wallet but no Player NFT
    */
    else if (location === "MintCharacter") {
        return <MintCharacter setCharacterNFT={setCharacterNFT} />;
    }
    /*
    * Scenario #3: If there is a connected wallet and list of characters and NO selected charaters,
    * show your list of characters to select!
    */
    else if (location === "SelectCharacter") {
      return <SelectCharacter characterList={characterList} setCharacterNFT={setCharacterNFT} setLocation={setLocation}  />;
    }
    /*
    * Scenario #4: If there is a connected wallet and selected characterNFT, it's time to battle!
    */
    else if (location === "ExploreWasteland") {
        return <ExploreWasteland characterNFT={characterNFT} />;
    }
  };

  useEffect(() => {
    setIsLoading(true);
    checkIfWalletIsConnected();
  }, []);

  useEffect(() => {
    /*
    * The function we will call that interacts with out smart contract
    */
    const fetchNFTMetadata = async () => {
      console.log('Checking for Character NFT on address:', currentAccount);

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const gameContract = new ethers.Contract(
        CONTRACT_ADDRESS,
        generationOmega, // myEpicGame.abi,
        signer
      );

      try {
        const remainingTokens = await gameContract.remainingTokens()
        const mintedSoFar = 5000 - remainingTokens.toNumber()
        const accountNFTs = []
        for (let i = 0; i < mintedSoFar; i++) {
          // const ownerAddress = transformOwnerData(await gameContract.ownerClaim(i))
          // if ( currentAccount === ownerAddress){
            const characterDataRaw = (await gameContract.tokenURI(i))
            if (characterDataRaw) {
              console.log('User has Character NFT #' + i);
              const characterData = transformCharacterData(characterDataRaw)
              accountNFTs.push(characterData)
            } else {
              console.log('No character NFT found!');
            }       
          // }
        }
        setCharacterList(accountNFTs);
        if (accountNFTs.length > 0){
          setLocation("SelectCharacter")
        }
        else {
          setLocation("MintCharacter")
        }
      } catch (error) {
        if (error.toString().includes("URI query for nonexistent token")){
          console.log("CONTRACT ERROR: URI query for nonexistent token");
        }
        // console.log("Full Error: " + error.toString()); // DEBUG
      }
       setIsLoading(false);
    };

    /*
    * We only want to run this, if we have a connected wallet
    */
    if (currentAccount) {
      console.log('CurrentAccount:', currentAccount);
      fetchNFTMetadata();
    }
  }, [currentAccount, ]);

  return (
    <div className="App">
      <Navbar setLocation={setLocation}/>
      <div className="container">
        <div className="header-container">
          <p className="header gradient-text">Generation Omega</p>
          <p className="sub-text">Can you survive in this post-apocalyptic world?</p>
          {renderContent()}
        </div>
        <div className="footer-container">
          <img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
          <a
            className="footer-text"
            href={TWITTER_LINK}
            target="_blank"
            rel="noreferrer"
          >{`Twitter -> @${TWITTER_HANDLE}`}</a>
        </div>
      </div>
    </div>
  );
};

export default App;