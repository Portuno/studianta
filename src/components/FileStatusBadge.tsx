import { CheckCircle, Clock, AlertCircle, Loader2 } from "lucide-react";

interface FileStatusBadgeProps {
  status: 'completed' | 'processing' | 'error' | 'pending';
  size?: 'sm' | 'md' | 'lg';
}

const statusConfig = {
  completed: {
    icon: CheckCircle,
    text: 'Completed',
    className: 'bg-green-100 text-green-700 border-green-200'
  },
  processing: {
    icon: Loader2,
    text: 'Processing',
    className: 'bg-blue-100 text-blue-700 border-blue-200'
  },
  error: {
    icon: AlertCircle,
    text: 'Error',
    className: 'bg-red-100 text-red-700 border-red-200'
  },
  pending: {
    icon: Clock,
    text: 'Pending',
    className: 'bg-yellow-100 text-yellow-700 border-yellow-200'
  }
};

const sizeConfig = {
  sm: 'px-2 py-1 text-xs',
  md: 'px-3 py-1.5 text-sm',
  lg: 'px-4 py-2 text-base'
};

export const FileStatusBadge = ({ status, size = 'sm' }: FileStatusBadgeProps) => {
  const config = statusConfig[status];
  const Icon = config.icon;
  const isProcessing = status === 'processing';

  return (
    <div className={`inline-flex items-center gap-1.5 rounded-full border ${config.className} ${sizeConfig[size]}`}>
      <Icon 
        size={size === 'sm' ? 12 : size === 'md' ? 14 : 16} 
        className={isProcessing ? 'animate-spin' : ''}
      />
      <span className="font-medium">{config.text}</span>
    </div>
  );
}; 