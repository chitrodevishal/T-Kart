import { Link } from 'react-router-dom';
import { CalendarDays, Check, CreditCard, PackageCheck, PartyPopper } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

const formatDate = (value) => {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('en-IN', { dateStyle: 'long' });
};

export function OrderSuccessModal({ order, payment }) {
  const date = formatDate(order.paymentInfo?.paidAt || payment?.createdAt || order.createdAt);
  const estimatedDelivery = formatDate(order.estimatedDeliveryDate || order.delivery?.estimatedDate);
  const rawMethod = payment?.paymentMethod || order.paymentInfo?.method || 'Payment';
  const method = rawMethod === 'mock_card'
    ? `Card ending ${payment?.gatewayResponse?.simulatedCardLast4 || '4242'}`
    : rawMethod.replaceAll('_', ' ');

  return (
    <div className="order-success-backdrop fixed inset-0 z-[100] grid place-items-center overflow-y-auto bg-slate-950/55 p-4 backdrop-blur-sm sm:p-6">
      <div role="dialog" aria-modal="true" aria-labelledby="order-success-title" className="order-success-dialog relative my-auto w-full max-w-lg overflow-hidden rounded-3xl border border-white/70 bg-white p-6 shadow-2xl shadow-emerald-950/20 sm:p-9">
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-36 overflow-hidden">
          <span className="order-success-confetti left-[14%] top-8 bg-emerald-300" />
          <span className="order-success-confetti left-[28%] top-3 bg-amber-300 [animation-delay:90ms]" />
          <span className="order-success-confetti left-[72%] top-5 bg-teal-300 [animation-delay:140ms]" />
          <span className="order-success-confetti left-[86%] top-10 bg-emerald-400 [animation-delay:40ms]" />
        </div>

        <div className="relative mx-auto grid h-20 w-20 place-items-center rounded-full bg-emerald-50 text-emerald-700 ring-8 ring-emerald-50/60">
          <span className="order-success-checkmark absolute inset-0 rounded-full border-2 border-emerald-200" />
          <Check size={38} strokeWidth={3} className="order-success-check relative" aria-hidden="true" />
        </div>

        <div className="relative mt-6 text-center">
          <p className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-800"><PartyPopper size={13} /> Order confirmed</p>
          <h1 id="order-success-title" className="mt-4 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Payment Successful!</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">Your order has been placed successfully.</p>
        </div>

        <dl className="relative mt-7 divide-y divide-slate-100 rounded-2xl border border-slate-100 bg-slate-50/80 px-4 sm:px-5">
          <div className="flex items-start justify-between gap-4 py-3.5 text-sm">
            <dt className="flex items-center gap-2 text-slate-500"><PackageCheck size={16} /> Order ID</dt>
            <dd className="max-w-[58%] break-all text-right text-xs font-semibold text-slate-800 sm:text-sm">{order.orderNumber || order._id}</dd>
          </div>
          <div className="flex items-center justify-between gap-4 py-3.5 text-sm">
            <dt className="flex items-center gap-2 text-slate-500"><CreditCard size={16} /> Payment method</dt>
            <dd className="text-right text-sm font-semibold capitalize text-slate-800">{method}</dd>
          </div>
          <div className="flex items-center justify-between gap-4 py-3.5 text-sm">
            <dt className="text-slate-500">Total amount</dt>
            <dd className="text-sm font-bold text-slate-900">{formatCurrency(order.totalAmount || 0)}</dd>
          </div>
          {date && <div className="flex items-center justify-between gap-4 py-3.5 text-sm">
            <dt className="flex items-center gap-2 text-slate-500"><CalendarDays size={16} /> Order date</dt>
            <dd className="text-right text-sm font-medium text-slate-800">{date}</dd>
          </div>}
          {estimatedDelivery && <div className="flex items-center justify-between gap-4 py-3.5 text-sm">
            <dt className="text-slate-500">Estimated delivery</dt>
            <dd className="text-right text-sm font-semibold text-emerald-800">{estimatedDelivery}</dd>
          </div>}
        </dl>

        <div className="relative mt-6 grid gap-3 sm:grid-cols-2">
          <Link to={`/orders/${order._id}`} className="inline-flex min-h-12 items-center justify-center rounded-full bg-emerald-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800">Track Order</Link>
          <Link to="/products" className="inline-flex min-h-12 items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800">Continue Shopping</Link>
        </div>
      </div>
    </div>
  );
}
