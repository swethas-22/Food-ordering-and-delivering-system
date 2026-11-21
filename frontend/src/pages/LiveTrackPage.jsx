import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Clock, MapPin, ChevronDown, ChevronUp, Phone, MessageSquare, 
  RotateCcw, ShieldAlert, Sparkles, Navigation, CheckCircle2, AlertOctagon 
} from 'lucide-react';
import { orderService } from '../services/parceloServices';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const LiveTrackPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, openAuthModal } = useAuth();
  const { showToast } = useToast();

  const [trackingData, setTrackingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [advancing, setAdvancing] = useState(false);
  const [summaryExpanded, setSummaryExpanded] = useState(false);

  const fetchTracking = async () => {
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }

    try {
      let targetId = id;
      // If "latest", find user's latest order
      if (id === 'latest' || !id) {
        const listRes = await orderService.getOrders();
        if (listRes.data.length > 0) {
          targetId = listRes.data[0].id;
        } else {
          setLoading(false);
          return;
        }
      }

      const res = await orderService.getOrderTracking(targetId);
      setTrackingData(res.data);
    } catch (err) {
      showToast('Could not load order tracking.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTracking();
    // FR-6.3: Poll every 10 seconds to refresh status
    const interval = setInterval(fetchTracking, 10000);
    return () => clearInterval(interval);
  }, [id, isAuthenticated]);

  const handleCancelOrder = async () => {
    if (!trackingData?.order?.id) return;
    setCancelling(true);
    try {
      await orderService.cancelOrder(trackingData.order.id);
      showToast(`Order #${trackingData.order.order_number} has been cancelled.`);
      fetchTracking();
    } catch (err) {
      showToast(err.response?.data?.detail || 'Cancellation refused.');
    } finally {
      setCancelling(false);
    }
  };

  const handleAdvanceSimulation = async () => {
    if (!trackingData?.order?.id) return;
    setAdvancing(true);
    try {
      const res = await orderService.advanceStage(trackingData.order.id);
      showToast(`Development simulation: Advanced status to "${res.data.status}".`);
      fetchTracking();
    } catch (err) {
      showToast('Could not advance simulation status.');
    } finally {
      setAdvancing(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-12 h-12 rounded-full border-2 border-amber-400 border-t-transparent animate-spin mx-auto" />
        <p className="text-xs theme-text-secondary">Loading live order tracking telemetry...</p>
      </div>
    );
  }

  if (!trackingData || !trackingData.order) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center space-y-4">
        <div className="w-16 h-16 rounded-3xl theme-bg-card border theme-border mx-auto flex items-center justify-center text-amber-400">
          <Navigation className="w-8 h-8" />
        </div>
        <h3 className="font-serif text-3xl font-bold">No Active Order Found</h3>
        <p className="text-xs theme-text-secondary leading-relaxed">
          You have no orders currently in delivery. Explore our flagship menus and place an order to track live!
        </p>
        <button
          onClick={() => navigate('/restaurants')}
          className="px-6 py-2.5 rounded-2xl theme-accent-bg text-xs font-bold shadow-md hover:scale-105 transition-transform"
        >
          Explore Menus
        </button>
      </div>
    );
  }

  const { order, stages, current_stage_index, can_cancel, rider } = trackingData;
  const isCancelled = order.status === 'cancelled';
  const isDelivered = order.status === 'delivered';

  // Coordinate interpolation for illustrative vector map (FR-6.4)
  const currentCoords = stages[Math.max(0, current_stage_index)]?.coords || [120, 140];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Title & ETA Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold theme-accent-text tracking-wider uppercase">
              Order #{order.order_number}
            </span>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
              isDelivered ? 'bg-emerald-500/20 text-emerald-400' : (isCancelled ? 'bg-rose-500/20 text-rose-400' : 'theme-accent-bg')
            }`}>
              {order.status_display}
            </span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold mt-1">
            {isDelivered ? 'Delivered • Bon Appétit!' : (isCancelled ? 'Order Cancelled' : `Arriving in ~${order.eta_minutes} mins`)}
          </h1>
        </div>

        {/* Development Control: Advance Simulated Stage (FR-6.7) */}
        {!isCancelled && !isDelivered && (
          <div className="p-2 rounded-2xl theme-bg-card border theme-border flex items-center gap-2 self-start sm:self-auto">
            <span className="text-[10px] font-bold theme-text-secondary uppercase tracking-wider pl-1">
              Dev Mode:
            </span>
            <button
              onClick={handleAdvanceSimulation}
              disabled={advancing}
              className="px-3 py-1.5 rounded-xl theme-accent-bg text-[11px] font-bold shadow-sm hover:scale-105 transition-transform cursor-pointer"
            >
              {advancing ? 'Advancing...' : 'Simulate Next Stage →'}
            </button>
          </div>
        )}
      </div>

      {/* Illustrative Vector Map Panel (FR-6.4) */}
      <div className="relative h-72 sm:h-96 rounded-3xl overflow-hidden border theme-border theme-shadow bg-neutral-950">
        <svg className="w-full h-full" viewBox="0 0 900 450" preserveAspectRatio="none">
          {/* Map Land Background */}
          <rect width="900" height="450" fill="var(--map-land, #171717)" />

          {/* Map Roads & Blocks */}
          <path d="M 0,100 L 900,100 M 0,220 L 900,220 M 0,350 L 900,350" stroke="var(--map-road, #2B2B2B)" strokeWidth="16" />
          <path d="M 180,0 L 180,450 M 460,0 L 460,450 M 740,0 L 740,450" stroke="var(--map-road, #2B2B2B)" strokeWidth="14" />
          <path d="M 0,260 Q 450,200 900,380" stroke="var(--map-road, #2B2B2B)" strokeWidth="18" fill="none" />

          {/* Active Delivery Route dashed path */}
          <path
            d="M 120,140 C 260,180 420,240 780,390"
            stroke="var(--accent-primary, #D4AF37)"
            strokeWidth="5"
            strokeDasharray="8 6"
            fill="none"
            opacity="0.85"
          />

          {/* Restaurant Marker (Kitchen) */}
          <g transform="translate(120, 140)">
            <circle r="18" fill="var(--accent-primary, #D4AF37)" />
            <circle r="26" fill="var(--accent-primary, #D4AF37)" opacity="0.25" />
            <text y="5" textAnchor="middle" fill="#000" fontSize="11" fontWeight="bold">🍽️</text>
            <text y="-26" textAnchor="middle" fill="var(--text-primary, #fff)" fontSize="11" fontWeight="bold">
              {order.restaurant_name}
            </text>
          </g>

          {/* Delivery Destination Marker (Customer Home) */}
          <g transform="translate(780, 390)">
            <circle r="18" fill="#10B981" />
            <circle r="26" fill="#10B981" opacity="0.25" />
            <text y="5" textAnchor="middle" fill="#fff" fontSize="11" fontWeight="bold">📍</text>
            <text y="-26" textAnchor="middle" fill="var(--text-primary, #fff)" fontSize="11" fontWeight="bold">
              Your Villa
            </text>
          </g>

          {/* Animated Rider Scooter Marker (FR-6.4) */}
          {!isCancelled && (
            <g
              transform={`translate(${currentCoords[0]}, ${currentCoords[1]})`}
              className="transition-transform duration-1000 ease-in-out"
            >
              <circle r="22" fill="#000" stroke="var(--accent-primary, #D4AF37)" strokeWidth="3" />
              <circle r="30" fill="var(--accent-primary, #D4AF37)" opacity="0.3" className="animate-ping" />
              <text y="5" textAnchor="middle" fill="var(--accent-primary, #D4AF37)" fontSize="12" fontWeight="bold">
                🛵
              </text>
              <text y="-28" textAnchor="middle" fill="var(--accent-primary, #D4AF37)" fontSize="10" fontWeight="bold">
                {rider.name}
              </text>
            </g>
          )}
        </svg>

        {/* Map Watermark & Illustrative Notice (FR-6.4) */}
        <div className="absolute bottom-3 left-4 text-[10px] theme-text-secondary bg-black/60 backdrop-blur-md px-3 py-1 rounded-xl">
          Illustrative Route Telemetry • Real GPS is simulated
        </div>
      </div>

      {/* 5-Step Order Progress Bar (FR-6.1, FR-6.2) */}
      {!isCancelled && (
        <div className="p-6 rounded-3xl theme-bg-card border theme-border theme-shadow space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider theme-accent-text">
              Status Progression
            </span>
            <span className="text-xs font-semibold theme-text-secondary">
              {stages[Math.max(0, current_stage_index)]?.pill}
            </span>
          </div>

          {/* Horizontal Progress Bars */}
          <div className="grid grid-cols-5 gap-2">
            {stages.map((st, idx) => (
              <div
                key={st.key}
                className={`h-2.5 rounded-full transition-all duration-500 ${
                  idx <= current_stage_index ? 'theme-accent-bg' : 'bg-neutral-600/30'
                }`}
              />
            ))}
          </div>

          {/* Step Labels */}
          <div className="grid grid-cols-5 text-center text-[10px] sm:text-xs font-bold">
            {stages.map((st, idx) => (
              <span
                key={st.key}
                className={`truncate ${
                  idx <= current_stage_index ? 'theme-accent-text' : 'theme-text-secondary opacity-60'
                }`}
              >
                {st.label}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Split Details: Rider Card & Collapsible Order Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Valet Delivery Partner Card (FR-6.5) */}
        <div className="p-6 rounded-3xl theme-bg-card border theme-border theme-shadow space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <span className="text-[10px] font-bold uppercase tracking-wider theme-text-secondary">
              White-Glove Delivery Valet
            </span>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl theme-bg-secondary border theme-border flex items-center justify-center font-serif text-2xl font-bold theme-accent-text shrink-0">
                {rider.name.charAt(0)}
              </div>
              <div>
                <h4 className="font-serif text-2xl font-bold leading-tight">{rider.name}</h4>
                <div className="flex items-center gap-2 text-xs font-semibold theme-text-secondary mt-0.5">
                  <span className="text-amber-400 font-bold">★ {rider.rating} Rating</span>
                  <span>•</span>
                  <span>{rider.vehicle}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Call & Message Telephony - Disabled until real telephony exists (FR-6.5) */}
          <div className="pt-4 border-t theme-border flex gap-2">
            <button
              onClick={() => showToast('Direct telephony disabled in simulation mode.')}
              className="flex-1 py-2.5 rounded-2xl theme-bg-secondary border theme-border text-xs font-bold flex items-center justify-center gap-1.5 opacity-70 cursor-not-allowed"
            >
              <Phone className="w-3.5 h-3.5" /> Call Valet
            </button>
            <button
              onClick={() => showToast('Direct messaging disabled in simulation mode.')}
              className="flex-1 py-2.5 rounded-2xl theme-bg-secondary border theme-border text-xs font-bold flex items-center justify-center gap-1.5 opacity-70 cursor-not-allowed"
            >
              <MessageSquare className="w-3.5 h-3.5" /> Message Valet
            </button>
          </div>
        </div>

        {/* Collapsible Order Summary & Actions (FR-6.2, FR-6.6) */}
        <div className="p-6 rounded-3xl theme-bg-card border theme-border theme-shadow space-y-4 flex flex-col justify-between">
          <div>
            <div
              onClick={() => setSummaryExpanded(!summaryExpanded)}
              className="flex items-center justify-between cursor-pointer pb-2 border-b theme-border"
            >
              <span className="text-xs font-bold uppercase tracking-wider theme-accent-text">
                Order Summary ({order.items?.length || 0} items)
              </span>
              <button className="theme-text-secondary">
                {summaryExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>

            {/* Dishes in order */}
            <div className={`space-y-2 pt-3 text-xs ${summaryExpanded ? '' : 'max-h-24 overflow-hidden'}`}>
              {order.items?.map((item) => (
                <div key={item.id} className="flex justify-between items-start">
                  <div className="pr-2">
                    <span className="font-bold">{item.quantity}× {item.name}</span>
                    {item.options_summary && (
                      <span className="block text-[11px] theme-text-secondary">{item.options_summary}</span>
                    )}
                  </div>
                  <span className="font-semibold shrink-0">₹{item.line_total}</span>
                </div>
              ))}
            </div>

            <div className="pt-3 mt-3 border-t theme-border flex justify-between text-sm font-extrabold">
              <span>Total Paid:</span>
              <span className="theme-accent-text font-serif text-base">₹{order.total}</span>
            </div>
            <div className="text-[11px] theme-text-secondary mt-1">
              Destination: {order.delivery_address}
            </div>
          </div>

          {/* Cancel Order Action (FR-6.6: Allowed ONLY until Preparing Food) */}
          <div className="pt-2">
            {can_cancel ? (
              <button
                onClick={handleCancelOrder}
                disabled={cancelling}
                className="w-full py-2.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold hover:bg-rose-500/20 transition-colors cursor-pointer"
              >
                {cancelling ? 'Cancelling with Kitchen...' : 'Cancel Active Order'}
              </button>
            ) : (
              <div className="text-[11px] theme-text-secondary text-center italic">
                {isCancelled
                  ? 'This order has been cancelled.'
                  : (isDelivered ? 'Order completed and delivered.' : 'Kitchen preparation underway. Cancellation locked.')}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
