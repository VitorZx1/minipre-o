import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Banknote, Barcode, CreditCard, Minus, Plus, Printer, QrCode,
  ReceiptText, ShoppingCart, Trash2, X, CircleCheckBig, Pencil, LockKeyhole, Scale,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { localServer } from '../services/localServer';
import ReceiptLogo from '../components/ReceiptLogo';
import { QRCodeSVG } from 'qrcode.react';
import note2 from '../assets/currency/note-2.png';
import note5 from '../assets/currency/note-5.png';
import note10 from '../assets/currency/note-10.png';
import note20 from '../assets/currency/note-20.png';
import note50 from '../assets/currency/note-50.png';
import note100 from '../assets/currency/note-100.png';
import note200 from '../assets/currency/note-200.png';
import coin001 from '../assets/currency/coin-001.png';
import coin005 from '../assets/currency/coin-005.png';
import coin010 from '../assets/currency/coin-010.png';
import coin025 from '../assets/currency/coin-025.png';
import coin050 from '../assets/currency/coin-050.png';
import coin100 from '../assets/currency/coin-100.png';

const money = value => Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

function playCheckoutSound(kind = 'success') {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    const context = new AudioContextClass();
    const tones = kind === 'success' ? [740, 990] : kind === 'approved' ? [660, 880, 1100] : [220, 165];
    tones.forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.0001, context.currentTime + index * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.12, context.currentTime + index * 0.1 + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + index * 0.1 + 0.09);
      oscillator.connect(gain).connect(context.destination);
      oscillator.start(context.currentTime + index * 0.1);
      oscillator.stop(context.currentTime + index * 0.1 + 0.1);
    });
    setTimeout(() => context.close(), 700);
  } catch { /* O aviso visual continua funcionando caso o navegador bloqueie áudio. */ }
}

const banknoteImages = {
  2: note2,
  5: note5,
  10: note10,
  20: note20,
  50: note50,
  100: note100,
  200: note200,
};

const coinImages = {
  0.01: coin001,
  0.05: coin005,
  0.1: coin010,
  0.25: coin025,
  0.5: coin050,
  1: coin100,
};

function cashBreakdown(value) {
  let cents = Math.round(Math.max(0, Number(value) || 0) * 100);
  const denominations = [20000, 10000, 5000, 2000, 1000, 500, 200, 100, 50, 25, 10, 5, 1];
  return denominations.flatMap(denomination => {
    const quantity = Math.floor(cents / denomination);
    cents %= denomination;
    return quantity ? [{ value: denomination / 100, quantity, coin: denomination < 200 }] : [];
  });
}

function isValidTradeBarcode(value) {
  if (!/^\d{8}$|^\d{12}$|^\d{13}$|^\d{14}$/.test(value)) return false;
  const digits = [...value].map(Number);
  const checkDigit = digits.pop();
  const sum = digits.reverse().reduce((total, digit, index) => total + digit * (index % 2 === 0 ? 3 : 1), 0);
  return (10 - (sum % 10)) % 10 === checkDigit;
}

function CheckoutCartLoader({ size = 'small' }) {
  return (
    <span className={`checkout-cart-loader checkout-cart-loader-${size}`} aria-hidden="true">
      <span className="checkout-cart-speed"><i /><i /><i /></span>
      <svg viewBox="0 0 76 52" className="checkout-cart-svg">
        <path d="M16 11h55l-7 24H20z" fill="currentColor" opacity=".13" />
        <g className="checkout-groceries" stroke="currentColor" strokeLinejoin="round">
          {/* Sacola de pão */}
          <path d="M20 32V10l3-4h12l3 4v22z" fill="currentColor" opacity=".9" strokeWidth="1.5" />
          <path d="M24 7c1-4 3-5 5-2 2-3 4-2 5 2" fill="none" strokeWidth="1.5" />
          <path d="M25 15c3-4 7-4 9 0-2 5-7 5-9 0Z" fill="#fff" opacity=".78" stroke="none" />
          <path d="M27 15h5" fill="none" stroke="#dc2626" strokeWidth="1" />
          {/* Garrafa */}
          <path d="M40 32V11c0-3 2-4 3-5V2h6v4c2 1 3 2 3 5v21z" fill="currentColor" opacity=".82" strokeWidth="1.3" />
          <path d="M43 4h6M42 17h9" fill="none" stroke="#fff" strokeWidth="1.2" opacity=".8" />
          {/* Caixa de mantimento */}
          <path d="M53 32V7h11v25z" fill="currentColor" opacity=".95" strokeWidth="1.4" />
          <path d="M55 11h7v8h-7z" fill="#fff" opacity=".78" stroke="none" />
          <path d="M57 14h3M57 16h3" fill="none" stroke="#dc2626" strokeWidth=".8" />
          {/* Baguete */}
          <path d="M62 31 67 5c1-4 6-3 6 1l-4 25z" fill="currentColor" opacity=".8" strokeWidth="1.2" />
          <path d="m67 12 4 1m-5 5 4 1m-5 5 4 1" fill="none" stroke="#fff" strokeWidth="1" opacity=".8" />
        </g>
        <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 8h8l5 27h42c3 0 5-2 6-5l5-19H16" strokeWidth="4" />
          <path d="M20 35c1 5 5 8 10 8h31" strokeWidth="3.5" />
          <g className="checkout-cart-wheel"><circle cx="29" cy="47" r="4" strokeWidth="3" /><path d="M29 43v8M25 47h8" strokeWidth="1" /></g>
          <g className="checkout-cart-wheel"><circle cx="57" cy="47" r="4" strokeWidth="3" /><path d="M57 43v8M53 47h8" strokeWidth="1" /></g>
        </g>
      </svg>
    </span>
  );
}

function CashChangeCard({ change, breakdown }) {
  return (
    <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
      <div className="flex justify-between text-lg">
        <span>Troco a entregar</span>
        <strong className="text-emerald-700">{money(change)}</strong>
      </div>
      {change === 0 ? (
        <p className="mt-3 text-sm text-emerald-700">Não há troco.</p>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-3">
          {breakdown.map(item => (
            <div key={item.value} className="relative flex min-h-16 items-center justify-center rounded-lg border border-emerald-200 bg-white p-2 shadow-sm">
              {item.coin ? (
                <img src={coinImages[item.value]} alt={`Moeda de ${money(item.value)}`} className="h-16 w-16 object-contain drop-shadow-md" />
              ) : (
                <img src={banknoteImages[item.value]} alt={`Cédula de ${money(item.value)}`} className="h-auto w-full max-w-36 rounded-sm object-contain shadow-md" />
              )}
              {item.quantity > 1 && <strong className="absolute -right-2 -top-2 inline-flex min-w-7 items-center justify-center rounded-full bg-emerald-700 px-2 py-1 text-sm text-white shadow">×{item.quantity}</strong>}
            </div>
          ))}
        </div>
      )}
      <p className="mt-3 text-center text-[11px] text-gray-500">Imagens ilustrativas das cédulas e moedas do Real.</p>
    </div>
  );
}

export default function PDV() {
  const { products, finalizeSale, receiptSettings, showToast, user, authorizeManager, addAudit, customers, customerLedger } = useApp();
  const scanRef = useRef(null);
  const renewingPixRef = useRef(false);
  const [query, setQuery] = useState('');
  const savedDraft = (() => { try { return JSON.parse(localStorage.getItem('mini-preco-pdv-draft')) || {}; } catch { return {}; } })();
  const [cart, setCart] = useState(() => Array.isArray(savedDraft.cart) ? savedDraft.cart : []);
  const [discount, setDiscount] = useState(() => Number(savedDraft.discount) || 0);
  const [paymentOpen, setPaymentOpen] = useState(() => Boolean(savedDraft.paymentTransaction?.status === 'pending'));
  const [paymentGroup, setPaymentGroup] = useState(() => savedDraft.paymentGroup || 'Manual');
  const [paymentMethod, setPaymentMethod] = useState(() => savedDraft.paymentMethod || 'Dinheiro');
  const [received, setReceived] = useState('');
  const [cashChangeConfirmed, setCashChangeConfirmed] = useState(false);
  const [lastSale, setLastSale] = useState(null);
  const [saleSuccess, setSaleSuccess] = useState(null);
  const [machines, setMachines] = useState([]);
  const [selectedMachineId, setSelectedMachineId] = useState('');
  const [mpCheckout, setMpCheckout] = useState(null);
  const [paymentTransaction, setPaymentTransaction] = useState(() => savedDraft.paymentTransaction?.status === 'pending' ? savedDraft.paymentTransaction : null);
  const [paymentBusy, setPaymentBusy] = useState(false);
  const [cancellingPayment, setCancellingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [paymentKeyboardZone, setPaymentKeyboardZone] = useState('methods');
  const [paymentActionIndex, setPaymentActionIndex] = useState(1);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [weightProduct, setWeightProduct] = useState(null);
  const [weightValue, setWeightValue] = useState('');
  const [lastAddedId, setLastAddedId] = useState('');
  const [confirmAction, setConfirmAction] = useState(null);
  const [authorization, setAuthorization] = useState(null);
  const [authorizationLogin, setAuthorizationLogin] = useState('adm');
  const [authorizationPassword, setAuthorizationPassword] = useState('');
  const [authorizationError, setAuthorizationError] = useState('');
  const [discountDraft, setDiscountDraft] = useState('');
  const [discountOpen, setDiscountOpen] = useState(false);
  const [pixSeconds, setPixSeconds] = useState(600);

  useEffect(() => {
    if (cart.length) localStorage.setItem('mini-preco-pdv-draft', JSON.stringify({ cart, discount, paymentOpen, paymentGroup, paymentMethod, paymentTransaction: paymentTransaction?.status === 'pending' ? paymentTransaction : null, updatedAt: new Date().toISOString() }));
    else localStorage.removeItem('mini-preco-pdv-draft');
    window.dispatchEvent(new CustomEvent('pdv-sale-state', { detail: cart.length > 0 }));
  }, [cart, discount, paymentOpen, paymentGroup, paymentMethod, paymentTransaction]);

  useEffect(() => {
    const protectSale = event => {
      if (!cart.length && paymentTransaction?.status !== 'pending') return;
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', protectSale);
    return () => window.removeEventListener('beforeunload', protectSale);
  }, [cart.length, paymentTransaction?.status]);

  useEffect(() => {
    if (paymentMethod !== 'PIX' || paymentTransaction?.status !== 'pending') return undefined;
    const created = new Date(paymentTransaction.createdAt || Date.now()).getTime();
    const update = () => setPixSeconds(Math.max(0, 600 - Math.floor((Date.now() - created) / 1000)));
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [paymentMethod, paymentTransaction]);

  useEffect(() => {
    if (paymentOpen || weightProduct || lastSale || saleSuccess || confirmAction || authorization || discountOpen) return undefined;

    let focusTimer;
    const focusScanner = () => {
      if (!paymentOpen && !weightProduct && !lastSale && !saleSuccess && !confirmAction && !authorization && !discountOpen) scanRef.current?.focus();
    };
    const focusScannerAfterNavigation = () => {
      clearTimeout(focusTimer);
      setTimeout(focusScanner, 0);
    };
    const scheduleScannerFocus = event => {
      clearTimeout(focusTimer);
      if (event?.target === scanRef.current) return;
      focusTimer = setTimeout(focusScanner, 3000);
    };
    const focusScannerWhenVisible = () => {
      if (document.visibilityState === 'visible') focusScannerAfterNavigation();
    };

    focusTimer = setTimeout(focusScanner, 0);
    document.addEventListener('pointerdown', scheduleScannerFocus);
    document.addEventListener('keydown', scheduleScannerFocus);
    document.addEventListener('visibilitychange', focusScannerWhenVisible);
    window.addEventListener('focus', focusScannerAfterNavigation);
    window.addEventListener('pdv-focus-scanner', focusScannerAfterNavigation);

    return () => {
      clearTimeout(focusTimer);
      document.removeEventListener('pointerdown', scheduleScannerFocus);
      document.removeEventListener('keydown', scheduleScannerFocus);
      document.removeEventListener('visibilitychange', focusScannerWhenVisible);
      window.removeEventListener('focus', focusScannerAfterNavigation);
      window.removeEventListener('pdv-focus-scanner', focusScannerAfterNavigation);
    };
  }, [paymentOpen, weightProduct, lastSale, saleSuccess, confirmAction, authorization, discountOpen]);

  useEffect(() => {
    const handlePdvShortcuts = event => {
      const pressedKey = event.code?.startsWith('F') ? event.code : event.key;
      const hasBlockingDialog = weightProduct || lastSale || saleSuccess || confirmAction || authorization || discountOpen;
      if (['F1', 'F2', 'F3', 'F4', 'F5'].includes(pressedKey)) {
        event.preventDefault();
        event.stopPropagation();
      }
      if (pressedKey === 'F1' && !paymentOpen && !hasBlockingDialog) {
        scanRef.current?.focus();
        scanRef.current?.select();
        return;
      }
      if (pressedKey === 'F2' && !paymentOpen && !hasBlockingDialog) {
        if (cart.length) openPayment();
        else showToast('Adicione pelo menos um produto antes de finalizar a venda.', 'warning');
        return;
      }
      if (paymentOpen && !hasBlockingDialog && paymentTransaction?.status !== 'pending' && paymentTransaction?.status !== 'approved') {
        const groupByKey = { F3: 'Manual', F4: 'PIX', F5: 'Cartão' };
        if (groupByKey[pressedKey]) {
          choosePaymentGroup(groupByKey[pressedKey]);
          return;
        }
      }
    };
    window.addEventListener('keydown', handlePdvShortcuts, true);
    return () => window.removeEventListener('keydown', handlePdvShortcuts, true);
  }, [paymentOpen, weightProduct, lastSale, saleSuccess, confirmAction, authorization, discountOpen, cart.length, paymentGroup, paymentTransaction?.status]);

  useEffect(() => {
    localServer.getSetting('card-machines').then(({ value }) => setMachines(Array.isArray(value) ? value.filter(machine => machine.active) : [])).catch(() => setMachines([]));
    localServer.getSetting('mercado-pago-checkout').then(({ value }) => setMpCheckout(value || null)).catch(() => setMpCheckout(null));
  }, []);

  useEffect(() => {
    if (!paymentTransaction || paymentTransaction.status !== 'pending') return;
    let stopped = false;
    const poll = async () => {
      try {
        const updated = await localServer.getPayment(paymentTransaction.id);
        if (stopped) return;
        setPaymentTransaction(updated);
        if (updated.status === 'approved') {
          showToast('Pagamento confirmado pelo Mercado Pago!');
          playCheckoutSound('approved');
        }
        else if (updated.status === 'expired' && paymentMethod === 'PIX' && !renewingPixRef.current) {
          renewingPixRef.current = true;
          setPaymentBusy(true);
          setPaymentError('QR Code expirado. Gerando um novo automaticamente...');
          try {
            const replacement = await localServer.createPayment('PIX', total);
            if (!stopped) {
              setPaymentTransaction(replacement);
              setPaymentError('');
              showToast('O QR Code expirou e foi renovado automaticamente.', 'info');
            }
          } catch (error) {
            if (!stopped) setPaymentError(`Não foi possível renovar o QR Code: ${error.message}`);
          } finally {
            renewingPixRef.current = false;
            if (!stopped) setPaymentBusy(false);
          }
        } else if (['declined', 'cancelled', 'expired'].includes(updated.status)) {
          playCheckoutSound('error');
          addAudit('PDV', 'Pagamento', paymentTransaction.id, `Pagamento ${updated.status}.`);
          setPaymentError(`Pagamento ${updated.status === 'expired' ? 'expirado' : updated.status === 'cancelled' ? 'cancelado' : 'não aprovado'}.`);
        }
      } catch (error) { if (!stopped) { playCheckoutSound('error'); setPaymentError(error.message); } }
    };
    const timer = setInterval(poll, 2500);
    return () => { stopped = true; clearInterval(timer); };
  }, [paymentTransaction]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!lastSale || !receiptSettings.autoPrint) return;
    const printDelay = setTimeout(() => window.print(), 350);
    return () => clearTimeout(printDelay);
  }, [lastSale, receiptSettings.autoPrint]);

  const availableProducts = products.filter(product => product.status === 'Ativo' && Number(product.stock) > 0);
  const suggestions = query.trim().length > 1
    ? availableProducts.filter(product => product.id.toLowerCase().includes(query.toLowerCase()) || String(product.internalCode || '').toLowerCase().includes(query.toLowerCase()) || product.name.toLowerCase().includes(query.toLowerCase())).slice(0, 6)
    : [];

  const subtotal = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.quantity, 0), [cart]);
  const validDiscount = Math.min(Math.max(Number(discount) || 0, 0), subtotal);
  const total = Math.max(0, subtotal - validDiscount);
  const change = paymentMethod === 'Dinheiro' ? Math.max(0, (Number(received) || 0) - total) : 0;
  const changeBreakdown = useMemo(() => cashBreakdown(change), [change]);
  const capability = { PIX: 'acceptsPix', 'Cartão de débito': 'acceptsDebit', 'Cartão de crédito': 'acceptsCredit', Ticket: 'acceptsTicket' }[paymentMethod];
  const compatibleMachines = useMemo(() => capability ? machines.filter(machine => machine[capability]) : [], [machines, capability]);
  const accountCustomers = useMemo(() => customers.filter(customer => (customer.status || 'Ativo') === 'Ativo' && (!customerSearch || [customer.name, customer.phone, customer.cpf].some(value => String(value || '').toLowerCase().includes(customerSearch.toLowerCase())))), [customers, customerSearch]);
  const selectedCustomer = customers.find(customer => customer.id === selectedCustomerId);
  const selectedCustomerBalance = selectedCustomer ? customerLedger.filter(entry => entry.customerId === selectedCustomer.id).reduce((sum, entry) => sum + (entry.type === 'purchase' ? Number(entry.value) : -Number(entry.value)), 0) : 0;
  const checkoutStep = paymentTransaction?.status === 'approved' ? 4 : paymentTransaction?.status === 'pending' ? 3 : paymentBusy ? 2 : 1;

  useEffect(() => {
    if (paymentMethod === 'Dinheiro') return;
    if (compatibleMachines.length === 1) setSelectedMachineId(compatibleMachines[0].id);
    else if (!compatibleMachines.some(machine => machine.id === selectedMachineId)) setSelectedMachineId('');
  }, [paymentMethod, compatibleMachines, selectedMachineId]);

  function isWeightedProduct(product) {
    return product.soldByWeight === true || product.unit === 'kg';
  }

  function requestProduct(product) {
    if (isWeightedProduct(product)) {
      setWeightProduct(product);
      setWeightValue('');
      setQuery('');
      return;
    }
    addProduct(product);
  }

  function addProduct(product, weight = null) {
    const weighted = isWeightedProduct(product);
    const amount = weighted ? Number(weight) : 1;
    const currentItem = cart.find(item => item.productId === product.id);
    if (!product.stockOverride && currentItem && currentItem.quantity + amount > Number(product.stock)) {
      playCheckoutSound('error');
      requestManagerAuthorization(`Venda de ${product.name} acima do estoque`, manager => {
        addAudit('PDV', 'Autorização', product.id, `${manager} autorizou venda acima do estoque.`);
        addProduct({ ...product, stock: 999999, stockOverride: true }, weight);
      });
      return;
    }
    setCart(current => {
      const existing = current.find(item => item.productId === product.id);
      if (existing) {
        return current.map(item => item.productId === product.id ? { ...item, quantity: Number((item.quantity + amount).toFixed(3)), stockOverride: item.stockOverride || product.stockOverride } : item);
      }
      return [...current, { productId: product.id, name: product.name, price: Number(product.price), quantity: amount, stock: Number(product.stock), soldByWeight: weighted, unit: weighted ? 'kg' : product.unit }];
    });
    playCheckoutSound('success');
    setLastAddedId(product.id);
    setTimeout(() => setLastAddedId(current => current === product.id ? '' : current), 1800);
    showToast(`${product.name} adicionado · ${money(Number(product.price) * amount)}`);
    setQuery('');
    setTimeout(() => scanRef.current?.focus(), 0);
  }

  function scan(event) {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    const value = query.trim().toLowerCase();
    const raw = query.trim();
    // Busca em TODOS os produtos (não só disponíveis) para encontrar por barcode
    const allProducts = products || [];
    let product = allProducts.find(item => item.id.toLowerCase() === value || String(item.internalCode || '').toLowerCase() === value || item.barcode === raw);
    // Alguns leitores repetem o conteúdo. Só aproveitamos um sufixo que seja
    // simultaneamente um EAN/UPC/GTIN válido e um produto realmente cadastrado.
    // (alguns leitores de barras enviam o código duplicado)
    if (!product && /^\d+$/.test(raw) && raw.length > 14) {
      for (const len of [14, 13, 12, 8]) {
        const suffix = raw.slice(-len);
        if (!isValidTradeBarcode(suffix)) continue;
        product = allProducts.find(item => item.barcode === suffix);
        if (product) break;
      }
    }

    const nameMatches = allProducts.some(item => item.name.toLocaleLowerCase('pt-BR').includes(value));
    const productCode = allProducts.some(item => item.id.toLowerCase() === value || String(item.internalCode || '').toLowerCase() === value);
    const looksLikeQrCode = !product && !nameMatches && !productCode && (
      raw.startsWith('000201') ||
      /^https?:\/\//i.test(raw) ||
      raw.length > 14 ||
      (raw.length >= 8 && !/^\d+$/.test(raw)) ||
      (/^\d+$/.test(raw) && raw.length >= 8 && !isValidTradeBarcode(raw))
    );
    if (looksLikeQrCode) {
      playCheckoutSound('error');
      showToast('QR Code ignorado. O caixa aceita somente código de barras EAN/UPC/GTIN de produtos.', 'warning');
      setQuery('');
      return;
    }
    if (!product && suggestions.length === 1) product = suggestions[0];
    if (!product) {
      playCheckoutSound('error');
      showToast('Produto não localizado. Digite o código interno, o código de barras ou pesquise pelo nome.', 'error');
      return;
    }
    if (product.status !== 'Ativo') {
      playCheckoutSound('error');
      showToast(`Produto "${product.name}" está inativo.`, 'error');
      return;
    }
    if (Number(product.stock) <= 0) {
      playCheckoutSound('error');
      requestManagerAuthorization(`Venda de ${product.name} sem estoque`, manager => {
        addAudit('PDV', 'Autorização', product.id, `${manager} autorizou venda sem estoque.`);
        requestProduct({ ...product, stock: 999999, stockOverride: true });
      });
      return;
    }
    requestProduct(product);
  }

  function changeQuantity(productId, amount) {
    const item = cart.find(entry => entry.productId === productId);
    if (!item) return;
    if (amount < 0) {
      setConfirmAction({ title: 'Diminuir quantidade?', message: `Deseja diminuir uma unidade de ${item.name}?`, confirmLabel: 'Sim, diminuir', action: () => setCart(current => current.map(entry => entry.productId === productId ? { ...entry, quantity: entry.quantity - 1 } : entry).filter(entry => entry.quantity > 0)) });
      return;
    }
    if (item.quantity + amount > item.stock) {
      requestManagerAuthorization(`Venda de ${item.name} acima do estoque`, manager => {
        addAudit('PDV', 'Autorização', productId, `${manager} autorizou venda acima do estoque.`);
        setCart(current => current.map(entry => entry.productId === productId ? { ...entry, quantity: entry.quantity + amount, stockOverride: true } : entry));
      });
      return;
    }
    setCart(current => current.map(entry => entry.productId === productId ? { ...entry, quantity: entry.quantity + amount } : entry));
  }

  function requestManagerAuthorization(reason, action) {
    setAuthorization({ reason, action });
    setAuthorizationLogin('adm');
    setAuthorizationPassword('');
    setAuthorizationError('');
  }

  function confirmManagerAuthorization() {
    const result = authorizeManager(authorizationLogin, authorizationPassword);
    if (!result.success) { setAuthorizationError(result.error); playCheckoutSound('error'); return; }
    const action = authorization.action;
    setAuthorization(null);
    setAuthorizationPassword('');
    action(result.manager);
  }

  function requestRemoveItem(item) {
    setConfirmAction({ title: 'Excluir produto da venda?', message: `Tem certeza de que deseja retirar ${item.name}?`, confirmLabel: 'Sim, excluir', action: () => setCart(current => current.filter(entry => entry.productId !== item.productId)) });
  }

  function applyDiscount() {
    const requested = Math.min(Math.max(Number(String(discountDraft).replace(',', '.')) || 0, 0), subtotal);
    const commit = manager => {
      setDiscount(requested);
      setDiscountOpen(false);
      if (manager) addAudit('PDV', 'Autorização', 'Desconto', `${manager} autorizou desconto de ${money(requested)}.`);
    };
    if (subtotal > 0 && requested / subtotal > 0.1) {
      requestManagerAuthorization(`Desconto de ${money(requested)} (${((requested / subtotal) * 100).toFixed(1)}%)`, commit);
      return;
    }
    commit(null);
  }

  function openPayment() {
    const shortage = cart.find(item => {
      const product = products.find(candidate => candidate.id === item.productId);
      return !item.stockOverride && (!product || item.quantity > Number(product.stock));
    });
    if (shortage) {
      requestManagerAuthorization(`Finalizar venda com estoque insuficiente de ${shortage.name}`, manager => {
        addAudit('PDV', 'Autorização', shortage.productId, `${manager} autorizou a finalização sem estoque suficiente.`);
        setCart(current => current.map(item => item.productId === shortage.productId ? { ...item, stockOverride: true } : item));
        setPaymentOpen(true);
      });
      return;
    }
    setPaymentOpen(true);
  }

  function completeSale(machine = null, automaticPayment = null, options = {}) {
    const completed = finalizeSale({
      date: new Date().toLocaleDateString('pt-BR'),
      items: cart,
      subtotal,
      discount: validDiscount,
      total,
      payments: [{
        method: paymentMethod,
        amount: total,
        status: options.saleData?.onAccount ? 'Pendente na conta do cliente' : automaticPayment ? 'Confirmado automaticamente' : 'Confirmado manualmente',
        machineId: machine?.id || null,
        machineName: machine?.name || null,
        machineOperator: machine?.operator || null,
        approvedAt: automaticPayment?.approvedAt || new Date().toISOString(),
        provider: automaticPayment ? 'Mercado Pago' : null,
        providerOrderId: automaticPayment?.providerOrderId || null,
      }],
      change,
      terminal: 'Caixa principal',
      ...(options.saleData || {}),
    });
    if (options.showConfirmation !== false) setSaleSuccess(completed);
    setCart([]);
    setDiscount(0);
    setReceived('');
    setPaymentOpen(false);
    setSelectedMachineId('');
    setPaymentTransaction(null);
    setPaymentError('');
    showToast('Venda finalizada e estoque atualizado!');
    playCheckoutSound('approved');
    return completed;
  }

  function finishApprovedPayment(printReceipt = false) {
    if (paymentTransaction?.status !== 'approved') return;
    const completed = completeSale(null, paymentTransaction, { showConfirmation: false });
    if (printReceipt) {
      setLastSale(completed);
      if (!receiptSettings.autoPrint) setTimeout(() => window.print(), 350);
    }
  }

  function finishCashSale() {
    if (Number(received) < total) return showToast('O valor recebido é menor que o total.', 'error');
    if (!cashChangeConfirmed) {
      setCashChangeConfirmed(true);
      return;
    }
    completeSale();
  }

  async function closePayment() {
    if (paymentBusy) return;
    if (paymentTransaction?.status === 'pending') {
      setCancellingPayment(true);
      setPaymentBusy(true);
      try {
        await Promise.all([
          localServer.cancelPayment(paymentTransaction.id),
          new Promise(resolve => setTimeout(resolve, 900)),
        ]);
        addAudit('PDV', 'Pagamento', paymentTransaction.id, 'Cobrança cancelada pelo operador.');
      }
      catch (error) { setPaymentError(`${error.message} Se a cobrança já apareceu na maquininha, cancele nela.`); setPaymentBusy(false); setCancellingPayment(false); return; }
      setPaymentBusy(false);
      setCancellingPayment(false);
    }
    setSelectedMachineId('');
    setPaymentTransaction(null);
    setPaymentError('');
    setPaymentOpen(false);
    setTimeout(() => {
      scanRef.current?.focus();
      scanRef.current?.select();
    }, 50);
  }

  function choosePaymentMethod(method) {
    if (paymentTransaction?.status === 'pending') return;
    setPaymentMethod(method);
    setSelectedMachineId('');
    setPaymentError('');
    setReceived('');
    setCashChangeConfirmed(false);
  }

  function moveManualPaymentSelection(direction) {
    if (paymentTransaction?.status === 'pending') return;
    const methods = ['Dinheiro', 'Máquina Cielo (preta)', 'Máquina Laranjinha (laranja)', 'Ticket', 'Conta do cliente'];
    setPaymentMethod(currentMethod => {
      const currentIndex = methods.includes(currentMethod) ? methods.indexOf(currentMethod) : 0;
      return methods[(currentIndex + direction + methods.length) % methods.length];
    });
    setSelectedMachineId('');
    setPaymentError('');
    setReceived('');
    setCashChangeConfirmed(false);
  }

  function choosePaymentGroup(group) {
    if (paymentTransaction?.status === 'pending') return;
    setPaymentGroup(group);
    setPaymentMethod(group === 'Manual' ? 'Dinheiro' : group === 'PIX' ? 'PIX' : 'Cartão de débito');
    setPaymentKeyboardZone(group === 'Cartão' ? 'methods' : group === 'PIX' ? 'actions' : 'methods');
    setPaymentActionIndex(1);
    setReceived('');
    setCashChangeConfirmed(false);
    setPaymentError('');
  }

  function handlePaymentModalKeyboard(event) {
    if (paymentBusy || paymentTransaction?.status === 'pending' || paymentTransaction?.status === 'approved') return;
    const key = event.code || event.key;
    const isArrow = ['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight'].includes(key);
    if (paymentGroup === 'Manual' && (key === 'ArrowDown' || key === 'ArrowUp')) {
      event.preventDefault();
      event.stopPropagation();
      moveManualPaymentSelection(key === 'ArrowDown' ? 1 : -1);
      return;
    }
    if (!['PIX', 'Cartão'].includes(paymentGroup)) return;
    if (isArrow) {
      event.preventDefault();
      event.stopPropagation();
      if (paymentGroup === 'Cartão' && paymentKeyboardZone === 'methods') {
        choosePaymentMethod(paymentMethod === 'Cartão de débito' ? 'Cartão de crédito' : 'Cartão de débito');
      } else if (paymentGroup === 'Cartão' && paymentKeyboardZone === 'actions' && key === 'ArrowUp') {
        setPaymentKeyboardZone('methods');
      } else {
        setPaymentActionIndex(current => current === 0 ? 1 : 0);
      }
      return;
    }
    if (key !== 'Enter') return;
    event.preventDefault();
    event.stopPropagation();
    if (paymentGroup === 'Cartão' && paymentKeyboardZone === 'methods') {
      setPaymentKeyboardZone('actions');
      setPaymentActionIndex(1);
      return;
    }
    if (paymentActionIndex === 0) {
      closePayment();
      return;
    }
    const cannotStart = !mpCheckout?.terminalId || (paymentMethod === 'PIX' && !mpCheckout?.externalPosId);
    if (!cannotStart) startAutomaticPayment();
  }

  function finishManualSale() {
    if (paymentMethod === 'Conta do cliente') {
      const customer = customers.find(item => item.id === selectedCustomerId);
      if (!customer) return showToast('Selecione o cliente que ficará com a compra na conta.', 'error');
      const currentBalance = customerLedger.filter(entry => entry.customerId === customer.id).reduce((sum, entry) => sum + (entry.type === 'purchase' ? Number(entry.value) : -Number(entry.value)), 0);
      const limit = Number(customer.creditLimit) || 0;
      const commit = manager => {
        if (manager) addAudit('PDV', 'Autorização', customer.id, `${manager} autorizou ultrapassar o limite da conta de ${customer.name}.`);
        completeSale(null, null, { saleData: { onAccount: true, customer }, showConfirmation: true });
      };
      if (limit > 0 && currentBalance + total > limit) {
        requestManagerAuthorization(`Conta de ${customer.name} ultrapassará o limite de ${money(limit)}`, commit);
        return;
      }
      commit(null);
      return;
    }
    if (paymentMethod === 'Dinheiro') return finishCashSale();
    if (!Number.isFinite(Number(received)) || Number(received) < total) return showToast('O valor recebido é menor que o total da venda.', 'error');
    const machine = paymentMethod.startsWith('Máquina Cielo')
      ? { name: 'Máquina Cielo (preta)', operator: 'Cielo' }
      : paymentMethod.startsWith('Máquina Laranjinha')
        ? { name: 'Máquina Laranjinha (laranja)', operator: 'Rede' }
        : { name: 'Ticket manual', operator: 'Ticket' };
    completeSale(machine);
  }

  function changeReceivedValue(event) {
    const digits = event.target.value.replace(/\D/g, '').slice(0, 12);
    setReceived(digits ? String(Number(digits) / 100) : '');
    setCashChangeConfirmed(false);
  }

  async function startAutomaticPayment() {
    setPaymentBusy(true); setPaymentError('');
    try { const transaction = await localServer.createPayment(paymentMethod, total); setPaymentTransaction(transaction); addAudit('PDV', 'Pagamento', transaction.id, `Cobrança ${paymentMethod} criada no valor de ${money(total)}.`); }
    catch (error) { playCheckoutSound('error'); setPaymentError(error.message); addAudit('PDV', 'Pagamento', 'Falha', `Falha ao criar cobrança: ${error.message}`); }
    finally { setPaymentBusy(false); }
  }

  async function configurePix() {
    setPaymentBusy(true); setPaymentError('');
    try {
      const result = await localServer.configureMercadoPagoPix(mpCheckout?.posId);
      setMpCheckout(result.checkout);
      showToast('Pix dinâmico configurado para este caixa.');
    } catch (error) { setPaymentError(error.message); }
    finally { setPaymentBusy(false); }
  }

  function cancelSale() {
    if (!cart.length) return;
    setConfirmAction({ title: 'Cancelar esta venda?', message: 'Todos os produtos desta venda serão retirados. Essa ação ficará registrada.', confirmLabel: 'Sim, cancelar venda', action: () => { addAudit('PDV', 'Cancelamento', 'Venda em andamento', `Venda com ${cart.length} item(ns) cancelada.`); setCart([]); setDiscount(0); setQuery(''); showToast('Venda atual cancelada.', 'info'); } });
  }

  return (
    <div className="h-full flex flex-col gap-4">
      <div className="flex items-center">
        <div>
          <div className="flex items-center gap-2"><ShoppingCart className="w-6 h-6 text-red-600" /><h1 className="text-2xl font-bold text-gray-800">Caixa Mini Preço</h1></div>
          <p className="text-sm text-gray-500">Caixa principal · Operador: {user?.name}</p>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4 flex-1 min-h-0">
        <section className="col-span-8 bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col min-h-0">
          <div className="p-4 border-b border-gray-100 relative">
            <div className="relative">
              <Barcode className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-red-500" />
              <input ref={scanRef} autoFocus value={query} onChange={event => setQuery(event.target.value)} onKeyDown={scan} placeholder="Bipe o produto ou digite o código / nome..." className="w-full pl-14 pr-36 py-4 text-lg border-2 border-red-200 rounded-xl outline-none focus:border-red-500 focus:ring-4 focus:ring-red-50" />
              <button type="button" onClick={() => { scanRef.current?.focus(); scanRef.current?.select(); }} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-red-50 hover:text-red-700"><span className="mr-1.5 rounded border border-gray-300 bg-white px-1.5 py-0.5 font-bold">F1</span> Buscar produto</button>
            </div>
            {suggestions.length > 0 && (
              <div className="absolute z-20 left-4 right-4 top-[78px] bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
                {suggestions.map(product => (
                  <button key={product.id} onClick={() => requestProduct(product)} className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-red-50 border-b border-gray-100 last:border-0">
                    <div><p className="text-sm font-semibold text-gray-800">{product.name}</p><p className="text-xs text-gray-500">{product.internalCode || product.id} · Estoque: {product.stock}{isWeightedProduct(product) ? ' kg' : ''}</p></div>
                    <strong className="text-red-600">{money(product.price)}{isWeightedProduct(product) ? '/kg' : ''}</strong>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-[80px_1fr_150px_150px_48px] gap-3 px-5 py-3 bg-gray-50 text-xs font-bold uppercase text-gray-500 border-b border-gray-200">
            <span>Código</span><span>Produto</span><span>Quantidade</span><span className="text-right">Total</span><span />
          </div>
          <div className="flex-1 overflow-auto">
            {cart.length === 0 ? (
              <div className="h-full min-h-64 flex flex-col items-center justify-center text-gray-400"><Barcode className="w-16 h-16 mb-3 text-gray-200" /><p className="font-medium">Aguardando o primeiro produto</p><p className="text-sm">Bipe um produto ou digite seu código interno e pressione Enter</p></div>
            ) : cart.map(item => (
              <div key={item.productId} className={`grid grid-cols-[80px_1fr_150px_150px_48px] gap-3 items-center px-5 py-3 border-b transition-colors ${lastAddedId === item.productId ? 'border-emerald-300 bg-emerald-50' : item.soldByWeight ? 'border-blue-100 bg-blue-50/40 hover:bg-blue-50' : 'border-gray-100 hover:bg-gray-50'}`}>
                <span className="text-xs text-gray-500">{item.productId}</span>
                <div><p className="font-semibold text-gray-900">{item.name}</p><p className="text-xs text-gray-500">{money(item.price)} {item.soldByWeight ? 'por kg' : 'por unidade'}</p></div>
                {item.soldByWeight ? <button onClick={() => { setWeightProduct({ ...item, id: item.productId, _editing: true }); setWeightValue(String(item.quantity).replace('.', ',')); }} title="Alterar peso" className="flex items-center justify-center gap-2 rounded-lg border border-blue-200 bg-white px-2 py-2 text-sm font-bold text-blue-700 hover:bg-blue-50"><Scale className="h-4 w-4" />{Number(item.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 3, maximumFractionDigits: 3 })} kg<Pencil className="h-3.5 w-3.5" /></button> : <div className="flex items-center justify-center gap-2"><button onClick={() => changeQuantity(item.productId, -1)} className="p-1.5 rounded-md border border-gray-200 hover:bg-gray-100"><Minus className="w-3.5 h-3.5" /></button><strong className="w-6 text-center">{item.quantity}</strong><button onClick={() => changeQuantity(item.productId, 1)} className="p-1.5 rounded-md border border-gray-200 hover:bg-gray-100"><Plus className="w-3.5 h-3.5" /></button></div>}
                <div className="text-right"><strong className="block text-base text-gray-900">{money(item.price * item.quantity)}</strong><span className="text-[11px] text-gray-400">subtotal</span></div>
                <button onClick={() => requestRemoveItem(item)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Excluir produto"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
        </section>

        <aside className="col-span-4 min-h-0 bg-slate-900 text-white rounded-xl shadow-lg p-4 flex flex-col">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-700"><ReceiptText className="w-5 h-5 text-red-400" /><h2 className="font-semibold">Resumo da venda</h2></div>
          <div className="py-3 space-y-2 text-sm border-b border-slate-700">
            <div className="flex justify-between text-slate-300"><span>Produtos diferentes</span><strong className="text-white">{cart.length}</strong></div>
            <div className="flex justify-between text-slate-300"><span>Unidades</span><strong className="text-white">{cart.filter(item => !item.soldByWeight).reduce((sum, item) => sum + item.quantity, 0)}</strong></div>
            <div className="flex justify-between text-slate-300"><span>Peso total</span><strong className="text-white">{cart.filter(item => item.soldByWeight).reduce((sum, item) => sum + item.quantity, 0).toLocaleString('pt-BR', { minimumFractionDigits: 3, maximumFractionDigits: 3 })} kg</strong></div>
            <div className="flex justify-between text-slate-300"><span>Subtotal</span><strong className="text-white">{money(subtotal)}</strong></div>
            <button disabled={!cart.length} onClick={() => { setDiscountDraft(String(discount || '')); setDiscountOpen(true); }} className="flex w-full items-center justify-between text-slate-300 disabled:opacity-40"><span>Desconto</span><span className="rounded-lg bg-slate-800 px-3 py-2 font-semibold text-white">{money(validDiscount)} <Pencil className="ml-1 inline h-3.5 w-3.5" /></span></button>
            {validDiscount > 0 && <div className="flex justify-between rounded-lg bg-emerald-500/10 px-3 py-2 text-emerald-300"><span>Economia</span><strong>{money(validDiscount)} ({subtotal ? ((validDiscount / subtotal) * 100).toFixed(1) : 0}%)</strong></div>}
            {cart.length > 0 && <div className="rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Último produto</p><p className="truncate text-sm font-semibold text-white">{cart.at(-1).name}</p><p className="text-xs text-slate-300">{money(cart.at(-1).price * cart.at(-1).quantity)}</p></div>}
          </div>
          <div className="py-4"><p className="text-xs font-bold uppercase tracking-[0.16em] text-red-300">Total a pagar</p><p className="mt-1 text-4xl font-black tracking-tight text-white">{money(total)}</p></div>
          <div className="mt-auto space-y-2">
            <button disabled={!cart.length} onClick={openPayment} className="w-full py-3 bg-red-600 hover:bg-red-700 disabled:bg-slate-700 disabled:text-slate-500 rounded-xl font-bold text-base shadow-lg">Finalizar venda <span className="text-xs font-normal ml-1">F2</span></button>
            <button disabled={!cart.length} onClick={cancelSale} className="w-full py-2 border border-slate-700 hover:bg-slate-800 disabled:opacity-40 rounded-lg text-sm text-slate-300">Cancelar venda</button>
          </div>
        </aside>
      </div>

      {confirmAction && <div className="fixed inset-0 z-[70] flex items-center justify-center p-4"><div className="absolute inset-0 bg-black/60" onClick={() => setConfirmAction(null)} /><div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl"><div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50"><Trash2 className="h-6 w-6 text-red-600" /></div><h2 className="text-xl font-bold text-gray-900">{confirmAction.title}</h2><p className="mt-2 text-sm leading-6 text-gray-600">{confirmAction.message}</p><div className="mt-6 flex justify-end gap-3"><button onClick={() => setConfirmAction(null)} className="rounded-lg px-4 py-2.5 text-gray-600 hover:bg-gray-100">Não, voltar</button><button onClick={() => { const action = confirmAction.action; setConfirmAction(null); action(); }} className="rounded-lg bg-red-600 px-4 py-2.5 font-semibold text-white hover:bg-red-700">{confirmAction.confirmLabel}</button></div></div></div>}

      {discountOpen && <div className="fixed inset-0 z-[60] flex items-center justify-center p-4"><div className="absolute inset-0 bg-black/60" onClick={() => setDiscountOpen(false)} /><div className="relative w-full max-w-sm rounded-2xl bg-white shadow-2xl"><div className="border-b px-6 py-4"><h2 className="text-xl font-bold">Aplicar desconto</h2><p className="text-sm text-gray-500">Acima de 10% exige autorização do dono.</p></div><div className="p-6"><label className="text-sm font-semibold text-gray-700">Valor do desconto</label><input autoFocus type="number" min="0" max={subtotal} step="0.01" value={discountDraft} onChange={event => setDiscountDraft(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') applyDiscount(); }} className="mt-2 w-full rounded-xl border-2 border-gray-200 px-4 py-4 text-2xl font-bold outline-none focus:border-red-500" placeholder="0,00" /><p className="mt-3 text-sm text-gray-500">Novo total: <strong>{money(subtotal - Math.min(Number(discountDraft) || 0, subtotal))}</strong></p></div><div className="flex justify-end gap-3 border-t bg-gray-50 px-6 py-4"><button onClick={() => setDiscountOpen(false)} className="px-4 py-2.5 text-gray-600">Cancelar</button><button onClick={applyDiscount} className="rounded-lg bg-emerald-600 px-5 py-2.5 font-semibold text-white">Aplicar desconto</button></div></div></div>}

      {authorization && <div className="fixed inset-0 z-[80] flex items-center justify-center p-4"><div className="absolute inset-0 bg-black/70" /><div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl"><div className="border-b px-6 py-4"><div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-100"><LockKeyhole className="h-5 w-5 text-amber-700" /></span><div><h2 className="text-xl font-bold">Autorização do responsável</h2><p className="text-sm text-gray-500">Administrador, CEO ou dono do comércio</p></div></div></div><div className="space-y-4 p-6"><div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"><strong>Motivo:</strong> {authorization.reason}</div><label className="block text-sm font-semibold text-gray-700">Usuário<input autoFocus value={authorizationLogin} onChange={event => setAuthorizationLogin(event.target.value)} className="mt-1.5 w-full rounded-lg border px-3 py-3 font-normal outline-none focus:border-red-500" /></label><label className="block text-sm font-semibold text-gray-700">Senha<input type="password" value={authorizationPassword} onChange={event => setAuthorizationPassword(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') confirmManagerAuthorization(); }} className="mt-1.5 w-full rounded-lg border px-3 py-3 font-normal outline-none focus:border-red-500" /></label>{authorizationError && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{authorizationError}</p>}</div><div className="flex justify-end gap-3 border-t bg-gray-50 px-6 py-4"><button onClick={() => setAuthorization(null)} className="px-4 py-2.5 text-gray-600">Cancelar</button><button onClick={confirmManagerAuthorization} className="rounded-lg bg-red-600 px-5 py-2.5 font-semibold text-white">Autorizar</button></div></div></div>}

      {weightProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setWeightProduct(null)} />
          <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b px-6 py-4"><div><h2 className="text-xl font-bold">Informar peso</h2><p className="text-sm text-gray-500">{weightProduct.name}</p></div><button onClick={() => setWeightProduct(null)} className="rounded-lg p-2 hover:bg-gray-100"><X className="h-5 w-5" /></button></div>
            <div className="space-y-4 p-6">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4"><p className="text-sm text-emerald-800">Preço por quilograma</p><strong className="text-2xl text-emerald-700">{money(weightProduct.price)} / kg</strong></div>
              <label className="block"><span className="mb-1.5 block text-sm font-semibold text-gray-700">Peso mostrado na balança (kg)</span><div className="relative"><input autoFocus inputMode="decimal" value={weightValue} onChange={event => setWeightValue(event.target.value.replace(/[^0-9,.]/g, ''))} onKeyDown={event => { if (event.key === 'Enter') document.getElementById('confirm-weight')?.click(); }} placeholder="Ex.: 0,650" className="w-full rounded-xl border-2 border-red-200 px-4 py-4 pr-14 text-2xl font-bold outline-none focus:border-red-500 focus:ring-4 focus:ring-red-50" /><span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-gray-500">kg</span></div></label>
              <div className="rounded-xl bg-gray-50 p-4 text-center"><p className="text-sm text-gray-500">Valor calculado</p><strong className="text-3xl text-gray-900">{money((Number(weightValue.replace(',', '.')) || 0) * Number(weightProduct.price))}</strong></div>
            </div>
            <div className="flex justify-end gap-3 border-t bg-gray-50 px-6 py-4"><button onClick={() => setWeightProduct(null)} className="px-5 py-2.5 text-gray-600">Cancelar</button><button id="confirm-weight" onClick={() => { const weight = Number(weightValue.replace(',', '.')); if (!weight || weight <= 0) { showToast('Informe um peso maior que zero.', 'warning'); return; } if (weight > Number(weightProduct.stock) && !weightProduct.stockOverride) { requestManagerAuthorization(`Peso de ${weightProduct.name} acima do estoque`, manager => { addAudit('PDV', 'Autorização', weightProduct.productId || weightProduct.id, `${manager} autorizou peso acima do estoque.`); if (weightProduct._editing) setCart(current => current.map(item => item.productId === weightProduct.productId ? { ...item, quantity: weight, stockOverride: true } : item)); else addProduct({ ...weightProduct, stock: 999999, stockOverride: true }, weight); setWeightProduct(null); }); return; } if (weightProduct._editing) { setCart(current => current.map(item => item.productId === weightProduct.productId ? { ...item, quantity: weight } : item)); } else addProduct(weightProduct, weight); setWeightProduct(null); }} className="rounded-lg bg-emerald-600 px-5 py-2.5 font-semibold text-white hover:bg-emerald-700">{weightProduct._editing ? 'Atualizar peso' : 'Confirmar peso e adicionar'}</button></div>
          </div>
        </div>
      )}

      {paymentOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-3"><div className="absolute inset-0 bg-black/60" onClick={paymentTransaction?.status === 'approved' ? undefined : closePayment} /><div onKeyDownCapture={handlePaymentModalKeyboard} className={`relative flex max-h-[calc(100vh-1rem)] w-full flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ${paymentMethod === 'PIX' && paymentTransaction?.pixPayload ? 'max-w-md' : 'max-w-3xl'}`}>
          <div className="flex shrink-0 items-center justify-between border-b px-5 py-3"><div><h2 className="text-xl font-bold">Receber pagamento</h2><p className="text-sm text-gray-500">Total da venda: <strong className="text-red-600">{money(total)}</strong></p></div><button disabled={paymentBusy || paymentTransaction?.status === 'approved'} onClick={closePayment} className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-30"><X className="w-5 h-5" /></button></div>
          <div className="grid shrink-0 grid-cols-4 border-b bg-gray-50 px-5 py-2">{['Escolher método', 'Preparando', 'Aguardando cliente', 'Confirmado'].map((label, index) => <div key={label} className={`flex items-center text-[11px] font-semibold ${index + 1 <= checkoutStep ? 'text-emerald-700' : 'text-gray-400'}`}><span className={`mr-2 flex h-6 w-6 items-center justify-center rounded-full ${index + 1 < checkoutStep ? 'bg-emerald-600 text-white' : index + 1 === checkoutStep ? 'bg-red-600 text-white ring-4 ring-red-100' : 'bg-gray-200'}`}>{index + 1 < checkoutStep ? '✓' : index + 1}</span><span className="hidden sm:inline">{label}</span></div>)}</div>
          <div className={`min-h-0 flex-1 overflow-hidden p-4 ${paymentMethod === 'PIX' && paymentTransaction?.pixPayload ? 'block' : 'grid grid-cols-1 items-start gap-4 md:grid-cols-2'}`}>
            {!(paymentMethod === 'PIX' && paymentTransaction?.pixPayload) && <div className="space-y-3">
              {[['Manual', Banknote, 'F3'], ['PIX', QrCode, 'F4'], ['Cartão', CreditCard, 'F5']].map(([group, Icon, shortcut]) => <button key={group} onClick={() => choosePaymentGroup(group)} className={`w-full flex items-center gap-4 p-4 border-2 rounded-xl text-left ${paymentGroup === group ? 'border-red-500 bg-red-50 text-red-700' : 'border-gray-200 hover:border-gray-300'}`}><Icon className="w-6 h-6" /><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-3"><strong>{group}</strong><span className="rounded border border-current/20 bg-white/70 px-2 py-0.5 text-[11px] font-bold">{shortcut}</span></div><p className="text-xs opacity-70">{group === 'Manual' ? 'Dinheiro, máquinas não cadastradas ou ticket' : group === 'PIX' ? 'QR Code confirmado automaticamente' : 'Débito ou crédito pela Point cadastrada'}</p></div></button>)}
              {paymentGroup === 'Manual' && paymentMethod === 'Dinheiro' && cashChangeConfirmed && <CashChangeCard change={change} breakdown={changeBreakdown} />}
            </div>}
            <div className={`bg-gray-50 rounded-xl p-4 flex flex-col justify-center ${paymentMethod === 'PIX' && paymentTransaction?.pixPayload ? 'min-h-[300px]' : ''}`}>
              {paymentGroup === 'Manual' && <div className="space-y-2"><div className="flex items-center justify-between gap-3"><p className="text-sm font-semibold text-gray-700">Como o cliente pagará?</p><span className="text-[11px] font-medium text-gray-500">Use ↑ e ↓</span></div>{['Dinheiro', 'Máquina Cielo (preta)', 'Máquina Laranjinha (laranja)', 'Ticket', 'Conta do cliente'].map(method => <button key={method} onClick={() => choosePaymentMethod(method)} className={`w-full rounded-lg border-2 px-3 py-2.5 text-left text-sm font-medium ${paymentMethod === method ? 'border-red-500 bg-red-50 text-red-700' : 'border-gray-200 bg-white'}`}>{method}</button>)}{paymentMethod === 'Conta do cliente' ? <div className="space-y-2 pt-1"><label className="block text-sm font-medium text-gray-700">Localizar cliente</label><input autoFocus value={customerSearch} onChange={event => setCustomerSearch(event.target.value)} placeholder="Nome, telefone ou CPF" className="w-full rounded-lg border px-3 py-2.5 outline-none focus:border-red-500" /><select value={selectedCustomerId} onChange={event => setSelectedCustomerId(event.target.value)} className="w-full rounded-lg border bg-white px-3 py-2.5 outline-none focus:border-red-500"><option value="">Selecione o cliente</option>{accountCustomers.map(customer => <option key={customer.id} value={customer.id}>{customer.name} · {customer.phone}</option>)}</select>{selectedCustomer && <div className="rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-900"><div className="flex justify-between"><span>Saldo atual</span><strong>{money(Math.max(0, selectedCustomerBalance))}</strong></div><div className="mt-1 flex justify-between"><span>Após esta compra</span><strong>{money(Math.max(0, selectedCustomerBalance) + total)}</strong></div>{selectedCustomer.creditLimit ? <div className="mt-1 flex justify-between"><span>Limite</span><strong>{money(selectedCustomer.creditLimit)}</strong></div> : <p className="mt-1 text-amber-700">Sem limite definido</p>}</div>}</div> : <><label className="block pt-2 text-sm font-medium text-gray-700">{paymentMethod === 'Dinheiro' ? 'Valor entregue pelo cliente' : 'Valor recebido'}</label><input autoFocus type="text" inputMode="numeric" value={received === '' ? '' : money(received)} onChange={changeReceivedValue} className="w-full rounded-lg border border-gray-300 px-4 py-3 text-xl outline-none focus:ring-2 focus:ring-red-500" placeholder="R$ 0,00" /></>}</div>}
              {paymentGroup === 'Cartão' && <div className="space-y-4">{paymentTransaction?.status === 'approved' ? <div className="space-y-4 text-center"><CircleCheckBig className="mx-auto h-24 w-24 text-emerald-500" /><div><p className="text-2xl font-bold text-emerald-700">Pagamento confirmado!</p><p className="text-sm text-gray-600">A maquininha confirmou {money(total)}.</p></div><button onClick={() => finishApprovedPayment(true)} className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-5 py-3 font-semibold text-white"><Printer className="h-5 w-5" /> Imprimir comprovante</button><button onClick={() => finishApprovedPayment(false)} className="w-full rounded-lg border border-emerald-600 px-5 py-3 font-semibold text-emerald-700">Concluir sem imprimir</button></div> : paymentTransaction?.status === 'pending' ? <div className="py-8 text-center"><div className="mb-3 flex justify-center"><CheckoutCartLoader size="large" /></div><p className="text-xl font-bold text-gray-900">Aguardando o cliente</p><p className="mt-2 text-sm text-gray-600">Insira, aproxime ou passe o cartão na maquininha.</p><p className="mt-4 inline-flex items-center gap-2 rounded-full bg-red-50 py-1.5 pl-2 pr-4 text-sm font-semibold text-red-700"><CheckoutCartLoader /><span className="payment-consulting-pulse">Aguardando resposta da maquininha</span></p></div> : <><div className="flex items-center justify-between"><p className="text-sm font-semibold text-gray-700">Selecione o tipo do cartão</p><span className="text-[11px] text-gray-500">↑ ↓ e Enter</span></div>{['Cartão de débito', 'Cartão de crédito'].map(method => <button key={method} onClick={() => { choosePaymentMethod(method); setPaymentKeyboardZone('methods'); }} className={`w-full p-4 rounded-lg border-2 text-left font-medium ${paymentMethod === method ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 bg-white'} ${paymentKeyboardZone === 'methods' && paymentMethod === method ? 'ring-2 ring-blue-300 ring-offset-1' : ''}`}>{method}</button>)}<p className="text-xs text-emerald-700 bg-emerald-50 rounded-lg p-3">O valor será enviado para a maquininha principal e confirmado automaticamente.</p></>}{paymentError && <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">{paymentError}</p>}</div>}
              {paymentGroup === 'PIX' && <div className="space-y-4 text-center">
                {paymentBusy ? <div className="py-5"><div className="flex justify-center"><CheckoutCartLoader size="large" /></div><p className={`mt-3 font-semibold ${cancellingPayment ? 'payment-consulting-pulse text-red-700' : 'text-gray-700'}`}>{cancellingPayment ? 'Cancelando cobrança...' : 'Preparando cobrança segura...'}</p>{cancellingPayment && <p className="mt-2 text-xs text-gray-500">Aguarde a confirmação antes de fechar esta tela.</p>}</div> : paymentMethod === 'PIX' && paymentTransaction?.pixPayload ? <>{paymentTransaction.status === 'approved' ? <CircleCheckBig className="mx-auto h-20 w-20 text-emerald-500" /> : <div className="relative mx-auto inline-block rounded-xl border bg-white p-3 shadow-sm"><span className="absolute -inset-2 -z-10 animate-pulse rounded-2xl bg-blue-100" /><QRCodeSVG value={paymentTransaction.pixPayload} size={190} /></div>}</> : <QrCode className="w-14 h-14 mx-auto text-blue-500" />}
                {!paymentBusy && (paymentTransaction?.status === 'approved' ? <div className="space-y-4"><div><p className="text-2xl font-bold text-emerald-700">Pagamento confirmado!</p><p className="mt-1 text-sm text-gray-600">O Mercado Pago confirmou o recebimento de {money(total)}.</p></div><div className="grid gap-3"><button type="button" onClick={() => finishApprovedPayment(true)} className="flex items-center justify-center gap-2 rounded-lg bg-red-600 px-5 py-3 font-semibold text-white hover:bg-red-700"><Printer className="h-5 w-5" /> Imprimir comprovante</button><button type="button" onClick={() => finishApprovedPayment(false)} className="rounded-lg border border-emerald-600 bg-white px-5 py-3 font-semibold text-emerald-700 hover:bg-emerald-50">Concluir venda sem imprimir</button></div></div> : <div>{paymentTransaction?.status === 'pending' ? <><p className="text-base font-bold">Aguardando o cliente pagar o QR Code</p><p className="mt-2 inline-flex items-center gap-2 rounded-full bg-red-50 py-1.5 pl-2 pr-4 text-sm text-red-700"><CheckoutCartLoader /><span className="payment-consulting-pulse font-semibold">Consultando pagamento automaticamente</span></p><p className={`mt-3 text-sm font-semibold ${pixSeconds <= 60 ? 'text-red-600' : 'text-gray-600'}`}>Este QR Code expira em {String(Math.floor(pixSeconds / 60)).padStart(2, '0')}:{String(pixSeconds % 60).padStart(2, '0')}</p></> : <p className="text-sm font-semibold">Gerar Pix real de {money(total)}</p>}</div>)}
                {!(paymentMethod === 'PIX' && paymentTransaction?.pixPayload) && (mpCheckout?.terminalId ? <p className="text-xs text-emerald-700 bg-emerald-50 rounded-lg p-3">Point principal vinculada ao caixa.</p> : <p className="text-xs text-red-700 bg-red-50 rounded-lg p-3">Defina a Point principal em Armazenamento local antes de cobrar.</p>)}
                {paymentMethod === 'PIX' && !mpCheckout?.externalPosId && <div className="text-xs text-amber-800 bg-amber-50 rounded-lg p-3 space-y-2"><p>O caixa Mercado Pago ainda não possui o identificador necessário para gerar o Pix na tela. Cartão já pode usar a Point.</p><button type="button" onClick={configurePix} disabled={paymentBusy || !mpCheckout?.posId} className="px-3 py-2 bg-amber-600 text-white rounded-lg font-semibold disabled:opacity-50">{paymentBusy ? 'Configurando...' : 'Configurar Pix na tela'}</button></div>}
                {paymentError && <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg p-3 text-left">{paymentError}</p>}
                {!(paymentMethod === 'PIX' && paymentTransaction?.pixPayload) && <p className="text-xs text-gray-500">A venda só será concluída quando o Mercado Pago confirmar o pagamento como creditado.</p>}
              </div>}
            </div>
          </div>
          {paymentTransaction?.status !== 'approved' && <div className="flex shrink-0 items-center justify-end gap-3 border-t bg-gray-50 px-5 py-3">{['PIX', 'Cartão'].includes(paymentGroup) && !paymentBusy && !paymentTransaction?.status && <span className="mr-auto hidden text-[11px] font-medium text-gray-500 sm:inline">Use as setas e Enter para confirmar</span>}<button disabled={paymentBusy} onClick={closePayment} className={`flex items-center gap-2 rounded-lg px-5 py-2.5 text-gray-600 disabled:opacity-60 ${['PIX', 'Cartão'].includes(paymentGroup) && paymentKeyboardZone === 'actions' && paymentActionIndex === 0 ? 'bg-white ring-2 ring-red-400 ring-offset-1' : ''}`}>{cancellingPayment && <CheckoutCartLoader size="button" />}{cancellingPayment ? 'Cancelando cobrança...' : paymentTransaction?.status === 'pending' ? 'Cancelar cobrança' : 'Voltar'}</button>{!(paymentMethod === 'PIX' && paymentTransaction?.pixPayload) && (paymentGroup === 'Manual' ? <button onClick={finishManualSale} className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold">{paymentMethod === 'Dinheiro' ? cashChangeConfirmed ? 'Finalizar venda' : 'Confirmar dinheiro recebido e gerar troco' : paymentMethod === 'Conta do cliente' ? 'Lançar na conta do cliente' : 'Confirmar pagamento manual'}</button> : <button onClick={startAutomaticPayment} disabled={paymentBusy || paymentTransaction?.status === 'pending' || !mpCheckout?.terminalId || (paymentMethod === 'PIX' && !mpCheckout?.externalPosId)} className={`flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 font-semibold text-white disabled:bg-blue-300 ${paymentKeyboardZone === 'actions' && paymentActionIndex === 1 ? 'ring-2 ring-blue-400 ring-offset-2' : ''}`}>{paymentBusy && !cancellingPayment && <CheckoutCartLoader size="button" />}{paymentBusy ? 'Preparando...' : paymentMethod === 'PIX' ? 'Gerar QR Code' : 'Enviar para a maquininha'}</button>)}</div>}
        </div></div>
      )}

      {saleSuccess && <div className="fixed inset-0 z-[65] flex items-center justify-center p-6"><div className="absolute inset-0 bg-black/65" /><div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white text-center shadow-2xl"><div className="bg-emerald-50 px-8 py-8"><div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-emerald-100"><CircleCheckBig className="h-16 w-16 text-emerald-600" /></div><h2 className="mt-5 text-3xl font-black text-emerald-800">Venda confirmada!</h2><p className="mt-2 text-gray-600">{saleSuccess.payments?.[0]?.method} · {money(saleSuccess.total)}</p><p className="mt-1 text-xs text-gray-500">{saleSuccess.id}</p></div><div className="grid gap-3 p-6"><button onClick={() => { const sale = saleSuccess; setSaleSuccess(null); setLastSale(sale); if (!receiptSettings.autoPrint) setTimeout(() => window.print(), 350); }} className="flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 font-semibold text-white hover:bg-red-700"><Printer className="h-5 w-5" /> Imprimir comprovante</button><button onClick={() => setSaleSuccess(null)} className="rounded-xl border border-emerald-600 px-5 py-3 font-semibold text-emerald-700 hover:bg-emerald-50">Concluir sem imprimir</button></div></div></div>}

      {lastSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6"><div className="absolute inset-0 bg-black/60" onClick={() => setLastSale(null)} /><div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
<div className="thermal-receipt p-7 text-gray-800 font-mono" style={{ width: receiptSettings.paperWidth === '58' ? '58mm' : '80mm', maxWidth: '100%' }}><div className="text-center border-b border-dashed border-gray-500 pb-4"><ReceiptLogo settings={receiptSettings} /><h2 className="text-xl font-black">{receiptSettings.companyName}</h2>{receiptSettings.legalName && <p className="text-[10px]">{receiptSettings.legalName}</p>}{receiptSettings.cnpj && <p className="text-[10px]">CNPJ: {receiptSettings.cnpj}</p>}{receiptSettings.address && <p className="text-[10px]">{receiptSettings.address}</p>}{receiptSettings.city && <p className="text-[10px]">{receiptSettings.city}</p>}{receiptSettings.phone && <p className="text-[10px]">Tel.: {receiptSettings.phone}</p>}</div><div className="py-3 text-xs border-b border-dashed border-gray-500"><p>{lastSale.id}</p><p>{new Date(lastSale.createdAt).toLocaleString('pt-BR')} · {lastSale.terminal}</p>{receiptSettings.showOperator && <p>Operador: {lastSale.operator}</p>}</div><div className="py-3 space-y-2 border-b border-dashed border-gray-500">{lastSale.items.map(item => <div key={item.productId} className="text-xs"><p className="font-semibold">{receiptSettings.showProductCode && `${item.productId} · `}{item.name}</p><div className="flex justify-between"><span>{item.soldByWeight ? `${Number(item.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 3, maximumFractionDigits: 3 })} kg` : item.quantity} x {money(item.price)}</span><span>{money(item.quantity * item.price)}</span></div></div>)}</div><div className="py-3 text-sm space-y-1"><div className="flex justify-between"><span>Subtotal</span><span>{money(lastSale.subtotal)}</span></div><div className="flex justify-between"><span>Desconto</span><span>{money(lastSale.discount)}</span></div><div className="flex justify-between text-lg font-black"><span>TOTAL</span><span>{money(lastSale.total)}</span></div><div className="flex justify-between"><span>{lastSale.payments[0].method}</span><span>{money(lastSale.total)}</span></div>{lastSale.change > 0 && <div className="flex justify-between"><span>Troco</span><span>{money(lastSale.change)}</span></div>}</div><div className="text-xs text-center pt-3 border-t border-dashed border-gray-500"><p className="whitespace-pre-line">{receiptSettings.footerMessage}</p><p className="font-bold mt-3">COMPROVANTE NÃO FISCAL</p><p>NÃO É DOCUMENTO FISCAL</p></div></div>
          <div className="receipt-actions flex gap-3 p-4 bg-gray-50 border-t"><button onClick={() => setLastSale(null)} className="flex-1 py-2.5 border rounded-lg">Fechar</button><button onClick={() => window.print()} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-600 text-white rounded-lg"><Printer className="w-4 h-4" /> Imprimir comprovante</button></div>
        </div></div>
      )}
    </div>
  );
}
