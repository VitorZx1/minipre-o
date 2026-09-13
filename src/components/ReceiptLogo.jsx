import logo from '../assets/mini-preco-logo-v2.png';

export default function ReceiptLogo({ settings }) {
  if (settings.logo === null) return null;
  return <img src={settings.logo || logo} alt="Logotipo da empresa" className="receipt-logo" />;
}
