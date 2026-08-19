import { useApp } from '../context/AppContext';
import { CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';

const icons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const colors = {
  success: 'bg-emerald-500',
  error: 'bg-red-500',
  warning: 'bg-amber-500',
  info: 'bg-blue-500',
};

export default function Toast() {
  const { toast } = useApp();
  if (!toast) return null;

  const Icon = icons[toast.type] || icons.success;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-slideIn">
      <div className={`flex items-center gap-3 px-5 py-3 rounded-xl text-white shadow-2xl ${colors[toast.type] || colors.success}`}>
        <Icon className="w-5 h-5 flex-shrink-0" />
        <span className="text-sm font-medium">{toast.message}</span>
      </div>
    </div>
  );
}
