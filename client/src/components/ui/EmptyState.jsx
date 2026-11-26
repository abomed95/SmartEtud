import { Inbox } from 'lucide-react';

export default function EmptyState({ icon: Icon = Inbox, title = 'Aucun résultat', description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center animate-fade-in">
      <Icon size={44} strokeWidth={1.5} className="text-slate-300 mb-3" />
      <h3 className="text-[17px] font-semibold text-slate-700">{title}</h3>
      {description && <p className="text-[14px] text-slate-400 max-w-xs mt-1">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
