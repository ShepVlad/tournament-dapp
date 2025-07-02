import { useEffect, useState } from 'react';
import { BrowserProvider, type Signer, Contract, ethers } from 'ethers';
import { getContract } from './web3/contract';

const getNickname = (address: string) =>
  localStorage.getItem(`nickname:${address}`) || address.slice(0, 6);

const ensureNickname = (address: string) => {
  const key = `nickname:${address}`;
  if (!localStorage.getItem(key)) {
    const nick = prompt('Enter a nickname (display name)') || address.slice(0, 6);
    localStorage.setItem(key, nick);
  }
};

export default function App() {
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [signer, setSigner] = useState<Signer | null>(null);
  const [account, setAccount] = useState<string | null>(null);

  const [owner, setOwner] = useState<string | null>(null);
  const [players, setPlayers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const connectWallet = async () => {
    if (!window.ethereum) return alert('MetaMask not detected');
    const _provider = new BrowserProvider(window.ethereum);
    await _provider.send('eth_requestAccounts', []);
    const _signer = await _provider.getSigner();
    const _addr = await _signer.getAddress();

    setProvider(_provider);
    setSigner(_signer);
    setAccount(_addr);

    ensureNickname(_addr);
  };

  const refresh = async (_runner: BrowserProvider | Signer) => {
    const c: Contract = getContract(_runner);
    const [own, list] = await Promise.all([c.owner(), c.getPlayers()]);
    setOwner(own.toLowerCase());
    setPlayers(list);
  };

  useEffect(() => {
    if (!provider) return;
    refresh(provider);
  }, [provider]);

  const join = async () => {
    if (!signer) return;
    try {
      setLoading(true);
      const c = getContract(signer);
      const tx = await c.register({ value: ethers.parseEther('0.01') });
      await tx.wait();
      await refresh(signer);
    } catch (e: unknown) {
      if (e instanceof Error) {
        alert(e.message);

      }
      else {
        alert('unknown Error')
      }
    } finally {
      setLoading(false);
    }
  };

  /* ───── Send prize (owner only) ───── */
  const sendPrize = async (winner: string) => {
    if (!signer) return;
    const ok = confirm(`Send all funds to ${winner}?`);
    if (!ok) return;
    try {
      setLoading(true);
      const c = getContract(signer);
      const tx = await c.sendPrizeToWinner(winner);
      await tx.wait();
      setPlayers([]); 
    } catch (e: unknown) {
      if (e instanceof Error) {
        alert(e.message);

      }
      else {
        alert('unknown Error')
      }
    } finally {
      setLoading(false);
    }
  };

  /* ───── UI ───── */
  /* 0) not connected */
  if (!account)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6">
        <h1 className="text-3xl font-bold">Tournament dApp</h1>
        <button
          onClick={connectWallet}
          className="border px-6 py-3 rounded hover:bg-gray-100"
        >
          Connect Wallet
        </button>
      </div>
    );

  /* 1) connected */
  const isOwner = account.toLowerCase() === owner;
  const isPlayer = players.map(a => a.toLowerCase()).includes(account.toLowerCase());

  return (
    <div className="p-6 max-w-xl mx-auto space-y-6">
      <header className="flex justify-between items-center border-b pb-4">
        <span className="font-medium">
          Hi {getNickname(account)} ({account.slice(0, 6)}…)
        </span>
        <button onClick={() => window.location.reload()} className="text-sm text-gray-500">
          Disconnect
        </button>
      </header>

      {/* join or list */}
      {!isPlayer ? (
        <button
          disabled={loading}
          onClick={join}
          className="border px-4 py-2 rounded w-full hover:bg-gray-100"
        >
          {loading ? 'Joining…' : 'Join tournament (0.01 ETH)'}
        </button>
      ) : (
        <>
          <h2 className="text-xl font-semibold">Players</h2>
          <ul className="space-y-2">
            {players.map(addr => (
              <li
                key={addr}
                className="flex justify-between items-center border p-2 rounded"
              >
                <span>
                  {getNickname(addr)} — {addr.slice(0, 6)}…
                </span>

                {isOwner && (
                  <button
                    onClick={() => sendPrize(addr)}
                    className="text-blue-600 text-sm hover:underline"
                  >
                    Send prize
                  </button>
                )}
              </li>
            ))}
          </ul>
          {players.length === 0 && <p>No players yet.</p>}
        </>
      )}
    </div>
  );
}
