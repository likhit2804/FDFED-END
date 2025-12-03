import React, { useEffect, useState } from 'react';
import '../../assets/css/Manager/Dashboard.css';

export const SubscriptionPlans = () => {
  const [plans, setPlans] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [community, setCommunity] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [card, setCard] = useState({
    name: '',
    number: '',
    expiry: '',
    cvv: ''
  });
  const [cardErrors, setCardErrors] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [plansRes, detailsRes] = await Promise.all([
          fetch('http://localhost:3000/manager/subscription-plans', { credentials: 'include' }),
          fetch('http://localhost:3000/manager/community-details', { credentials: 'include' }),
        ]);
        const plansJson = await plansRes.json();
        const detailsJson = await detailsRes.json();
        if (!plansJson.success) throw new Error(plansJson.message || 'Failed to fetch plans');
        setPlans(plansJson.plans || {});
        setCommunity(detailsJson || null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSubscribe = async (planKey) => {
    if (!community) return;
    setSubmitting(true);
    setSelectedPlan(planKey);
    try {
      const amount = plans[planKey]?.price || 0;
      // Basic client-side validation for card when method is card
      if (paymentMethod === 'card') {
        const errs = {};
        const num = card.number.replace(/\s+/g, '');
        if (!card.name.trim()) errs.name = 'Name on card is required';
        if (!/^\d{16}$/.test(num)) errs.number = 'Card number must be 16 digits';
        if (!/^\d{2}\/\d{2}$/.test(card.expiry)) errs.expiry = 'Expiry must be MM/YY';
        if (!/^\d{3}$/.test(card.cvv)) errs.cvv = 'CVV must be 3 digits';
        setCardErrors(errs);
        if (Object.keys(errs).length) throw new Error('Please fix card details');
      }
      const res = await fetch('http://localhost:3000/manager/subscription-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          communityId: community?._id,
          subscriptionPlan: planKey,
          amount,
          paymentMethod,
          planDuration: plans[planKey]?.duration || 'monthly',
          paymentDate: new Date().toISOString(),
          // Optional card metadata for backend auditing
          cardMeta: paymentMethod === 'card' ? {
            brand: 'VISA/Mastercard',
            last4: card.number.replace(/\s+/g, '').slice(-4),
            expiry: card.expiry,
            name: card.name
          } : undefined
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Payment failed');
      alert(`Subscribed to ${json.planName}. Transaction ${json.transactionId}`);
      // Refresh community details after payment
      try {
        const detailsRes = await fetch('http://localhost:3000/manager/community-details', { credentials: 'include' });
        const detailsJson = await detailsRes.json();
        setCommunity(detailsJson || null);
      } catch {}
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
      setSelectedPlan(null);
    }
  };

  if (loading) return <div style={{ padding: 24 }}>Loading plans...</div>;
  if (error) return <div style={{ padding: 24, color: 'red' }}>Error: {error}</div>;

  const planEntries = Object.entries(plans);

  return (
    <div style={{ padding: 24 }}>
      <h2>Subscription Plans</h2>
      {community && (
        <div style={{ marginBottom: 16, color: '#555' }}>
          Current status: <strong>{community.subscriptionStatus || 'inactive'}</strong>
          {community.subscriptionPlan && (
            <> — Plan: <strong>{community.subscriptionPlan}</strong></>
          )}
          {community.planEndDate && (
            <> — Expires: <strong>{new Date(community.planEndDate).toLocaleDateString()}</strong></>
          )}
        </div>
      )}
      {paymentMethod === 'card' && (
        <div style={{ border: '1px solid #eee', borderRadius: 8, padding: 16, marginBottom: 16, background: '#fafafa' }}>
          <h4 style={{ marginTop: 0 }}>Card Details</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ gridColumn: '1 / span 2' }}>
              <label>Name on card</label>
              <input value={card.name} onChange={(e)=>setCard({...card, name: e.target.value})} style={{ width: '100%', padding: 8 }} />
              {cardErrors.name && <div style={{ color: 'red', fontSize: 12 }}>{cardErrors.name}</div>}
            </div>
            <div>
              <label>Card number</label>
              <input value={card.number} onChange={(e)=>setCard({...card, number: e.target.value})} placeholder="1234 5678 9012 3456" style={{ width: '100%', padding: 8 }} />
              {cardErrors.number && <div style={{ color: 'red', fontSize: 12 }}>{cardErrors.number}</div>}
            </div>
            <div>
              <label>Expiry (MM/YY)</label>
              <input value={card.expiry} onChange={(e)=>setCard({...card, expiry: e.target.value})} placeholder="MM/YY" style={{ width: '100%', padding: 8 }} />
              {cardErrors.expiry && <div style={{ color: 'red', fontSize: 12 }}>{cardErrors.expiry}</div>}
            </div>
            <div>
              <label>CVV</label>
              <input value={card.cvv} onChange={(e)=>setCard({...card, cvv: e.target.value})} placeholder="123" style={{ width: '100%', padding: 8 }} />
              {cardErrors.cvv && <div style={{ color: 'red', fontSize: 12 }}>{cardErrors.cvv}</div>}
            </div>
          </div>
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
        {planEntries.map(([key, p]) => (
          <div key={key} style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16, background: '#fff' }}>
            <h3 style={{ marginTop: 0 }}>{p.name}</h3>
            <div style={{ fontSize: 24, margin: '8px 0' }}>₹{p.price} / {p.duration}</div>
            <ul style={{ paddingLeft: 18 }}>
              {(p.features || []).map((f, i) => (
                <li key={i}>{f}</li>
              ))}
            </ul>
            <div style={{ marginTop: 12 }}>
              <label>
                Payment Method:
                <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} style={{ marginLeft: 8 }}>
                  <option value="card">Card</option>
                  <option value="upi">UPI</option>
                  <option value="netbanking">NetBanking</option>
                </select>
              </label>
            </div>
            <button
              disabled={submitting && selectedPlan === key}
              onClick={() => handleSubscribe(key)}
              style={{ marginTop: 12, padding: '10px 16px', background: '#1976d2', color: '#fff', border: 0, borderRadius: 6 }}
            >
              {submitting && selectedPlan === key ? 'Processing...' : 'Choose Plan'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SubscriptionPlans;
