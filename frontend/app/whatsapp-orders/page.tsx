'use client';

import { useCallback, useEffect, useState } from 'react';
import { Check, MessageCircle, Package, RefreshCw, X } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import api from '@/lib/api';

interface WhatsAppOrderItem {
  productName: string;
  quantity: number;
}

interface SalesOrder {
  id: string;
  orderNumber: string;
  channel: string;
  status: string;
  orderDate: string;
  customerName?: string | null;
  whatsappNumber?: string | null;
  shippingAddress?: string | null;
  notes?: string | null;
  items: WhatsAppOrderItem[];
}

type Decision = 'confirm' | 'reject';

export default function WhatsAppOrdersPage() {
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [activeAction, setActiveAction] = useState<{
    orderId: string;
    decision: Decision;
  } | null>(null);

  const loadOrders = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setLoadError('');

    try {
      const response = await api.get<{ data: SalesOrder[] }>('/sales-orders');
      setOrders(
        response.data.data.filter(
          (order) =>
            order.channel === 'WHATSAPP' &&
            order.status === 'PENDING_REVIEW'
        )
      );
    } catch {
      setLoadError('Unable to load WhatsApp orders. Check your connection and try again.');
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  const decideOrder = async (order: SalesOrder, decision: Decision) => {
    setActiveAction({ orderId: order.id, decision });
    setActionError('');
    setFeedback('');

    try {
      await api.post(`/sales-orders/${order.id}/${decision}`);
      setFeedback(
        decision === 'confirm'
          ? `${order.orderNumber} confirmed.`
          : `${order.orderNumber} rejected.`
      );
      await loadOrders(false);
    } catch {
      setActionError(
        `Unable to ${decision} ${order.orderNumber}. The order may still be pending; refresh and check its status.`
      );
    } finally {
      setActiveAction(null);
    }
  };

  return (
    <AppLayout>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <MessageCircle
              className="h-5 w-5"
              aria-hidden="true"
              style={{ color: 'var(--accent)' }}
            />
            <h1
              className="text-2xl font-bold"
              style={{ color: 'var(--text-heading)' }}
            >
              WhatsApp Orders
            </h1>
          </div>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
            Review customer requests before confirming or rejecting them.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadOrders()}
          disabled={loading || activeAction !== null}
          className="btn-secondary inline-flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
        >
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          Refresh
        </button>
      </div>

      <div className="mb-4 flex items-center gap-2 text-sm" aria-live="polite">
        <span className="badge-warning font-medium">PENDING_REVIEW</span>
        <span style={{ color: 'var(--text-muted)' }}>
          {orders.length} order{orders.length === 1 ? '' : 's'} awaiting review
        </span>
      </div>

      {feedback && (
        <p
          className="mb-4 text-sm"
          role="status"
          style={{ color: 'var(--success)' }}
        >
          {feedback}
        </p>
      )}
      {actionError && (
        <p
          className="mb-4 text-sm"
          role="alert"
          style={{ color: 'var(--danger)' }}
        >
          {actionError}
        </p>
      )}

      {loading ? (
        <div
          className="card flex min-h-40 items-center justify-center"
          role="status"
          aria-label="Loading WhatsApp orders"
        >
          <div
            className="h-6 w-6 animate-spin rounded-full border-2 border-t-transparent"
            style={{
              borderColor: 'var(--accent)',
              borderTopColor: 'transparent',
            }}
          />
        </div>
      ) : loadError ? (
        <div
          className="card flex flex-col items-start gap-3"
          role="alert"
          style={{ color: 'var(--text-primary)' }}
        >
          <p>{loadError}</p>
          <button
            type="button"
            onClick={() => void loadOrders()}
            className="btn-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
          >
            Try again
          </button>
        </div>
      ) : orders.length === 0 ? (
        <div className="card flex min-h-52 flex-col items-center justify-center text-center">
          <Package
            className="mb-3 h-8 w-8"
            aria-hidden="true"
            style={{ color: 'var(--text-muted)' }}
          />
          <h2
            className="font-semibold"
            style={{ color: 'var(--text-heading)' }}
          >
            No WhatsApp orders need review
          </h2>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
            New customer requests will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4" aria-label="WhatsApp orders awaiting review">
          {orders.map((order) => {
            const busy = activeAction?.orderId === order.id;
            const actionsDisabled = activeAction !== null;

            return (
              <article key={order.id} className="card">
                <div className="flex flex-wrap items-start justify-between gap-4 border-b pb-4"
                  style={{ borderColor: 'var(--bg-border)' }}>
                  <div>
                    <p
                      className="text-xs font-medium uppercase tracking-wide"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      Order number
                    </p>
                    <h2
                      className="mt-1 text-lg font-semibold"
                      style={{ color: 'var(--text-heading)' }}
                    >
                      {order.orderNumber}
                    </h2>
                  </div>
                  <span className="badge-warning font-medium">PENDING_REVIEW</span>
                </div>

                <div className="grid gap-x-8 gap-y-5 py-4 sm:grid-cols-2">
                  <section aria-label="Customer details">
                    <h3
                      className="mb-2 text-sm font-semibold"
                      style={{ color: 'var(--text-heading)' }}
                    >
                      Customer
                    </h3>
                    <p style={{ color: 'var(--text-primary)' }}>
                      {order.customerName || 'Name not provided'}
                    </p>
                    <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
                      {order.whatsappNumber || 'WhatsApp number not provided'}
                    </p>
                    <p className="mt-2 text-sm" style={{ color: 'var(--text-muted)' }}>
                      Ordered {new Date(order.orderDate).toLocaleString()}
                    </p>
                  </section>

                  <section aria-label="Order items">
                    <h3
                      className="mb-2 text-sm font-semibold"
                      style={{ color: 'var(--text-heading)' }}
                    >
                      Items
                    </h3>
                    {order.items.length > 0 ? (
                      <ul className="space-y-1">
                        {order.items.map((item, index) => (
                          <li
                            key={`${item.productName}-${index}`}
                            className="text-sm"
                            style={{ color: 'var(--text-primary)' }}
                          >
                            {item.quantity} × {item.productName}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                        No item snapshots available.
                      </p>
                    )}
                  </section>

                  {(order.shippingAddress || order.notes) && (
                    <section className="sm:col-span-2" aria-label="Delivery information">
                      <h3
                        className="mb-2 text-sm font-semibold"
                        style={{ color: 'var(--text-heading)' }}
                      >
                        Delivery information
                      </h3>
                      {order.shippingAddress && (
                        <p className="whitespace-pre-wrap text-sm" style={{ color: 'var(--text-primary)' }}>
                          <span className="font-medium">Shipping address: </span>
                          {order.shippingAddress}
                        </p>
                      )}
                      {order.notes && (
                        <p className="mt-2 whitespace-pre-wrap text-sm" style={{ color: 'var(--text-primary)' }}>
                          <span className="font-medium">Notes: </span>
                          {order.notes}
                        </p>
                      )}
                    </section>
                  )}
                </div>

                <div
                  className="flex flex-wrap justify-end gap-2 border-t pt-4"
                  style={{ borderColor: 'var(--bg-border)' }}
                >
                  <button
                    type="button"
                    onClick={() => void decideOrder(order, 'reject')}
                    disabled={actionsDisabled}
                    aria-label={`Reject order ${order.orderNumber}`}
                    className="btn-danger inline-flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                    {busy && activeAction?.decision === 'reject' ? 'Rejecting...' : 'Reject'}
                  </button>
                  <button
                    type="button"
                    onClick={() => void decideOrder(order, 'confirm')}
                    disabled={actionsDisabled}
                    aria-label={`Confirm order ${order.orderNumber}`}
                    className="btn-primary inline-flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                  >
                    <Check className="h-4 w-4" aria-hidden="true" />
                    {busy && activeAction?.decision === 'confirm' ? 'Confirming...' : 'Confirm'}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </AppLayout>
  );
}
