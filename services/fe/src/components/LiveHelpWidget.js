import React, {useContext, useEffect, useMemo, useRef, useState} from 'react';
import {useHistory, useLocation} from 'react-router-dom';
import AppContext from '../AppContext';
import CartService, {CART_UPDATED_EVENT} from '../service/CartService';
import UserActivityService from '../service/UserActivityService';

const CART_HELP_TOPICS = [
    {id: 'cart-status', labelKey: 'liveHelp.cartTopicStatus', fallback: 'Sepetimdeki ürünler'},
    {id: 'cart-campaign', labelKey: 'liveHelp.cartTopicCampaign', fallback: 'İndirim / kampanya'},
    {id: 'cart-payment', labelKey: 'liveHelp.cartTopicPayment', fallback: 'Ödeme adımı'}
];

const ORDER_HELP_TOPICS = [
    {id: 'order-status', labelKey: 'liveHelp.orderTopicStatus', fallback: 'Sipariş durumu'},
    {id: 'order-cargo', labelKey: 'liveHelp.orderTopicCargo', fallback: 'Kargo süreci'},
    {id: 'order-return', labelKey: 'liveHelp.orderTopicReturn', fallback: 'İade / değişim'}
];

const TOPIC_MESSAGE_MAP = {
    'cart-status': {labelKey: 'liveHelp.cartTopicStatus', fallback: 'Sepetimdeki ürünler', messageKey: 'liveHelp.questionCartStatus', messageFallback: 'Sepetinizdeki ürünlerle ilgili tam olarak hangi konuda destek almak istiyorsunuz? Ürün bilgisi, stok ya da adet güncelleme konusunda yardımcı olabilirim.'},
    'cart-campaign': {labelKey: 'liveHelp.cartTopicCampaign', fallback: 'İndirim / kampanya', messageKey: 'liveHelp.questionCartCampaign', messageFallback: 'Sepetinizde uygulanan indirim veya kampanya ile ilgili hangi detayı kontrol etmemizi istersiniz?'},
    'cart-payment': {labelKey: 'liveHelp.cartTopicPayment', fallback: 'Ödeme adımı', messageKey: 'liveHelp.questionCartPayment', messageFallback: 'Ödeme adımında yaşadığınız durumu kısaca paylaşın. Kart, taksit veya onay sürecinde size destek olalım.'},
    'order-status': {labelKey: 'liveHelp.orderTopicStatus', fallback: 'Sipariş durumu', messageKey: 'liveHelp.questionOrderStatus', messageFallback: 'Siparişinizin güncel durumunu mu kontrol etmek istiyorsunuz, yoksa hazırlanma süreciyle ilgili bilgi mi almak istiyorsunuz?'},
    'order-cargo': {labelKey: 'liveHelp.orderTopicCargo', fallback: 'Kargo süreci', messageKey: 'liveHelp.questionOrderCargo', messageFallback: 'Kargo süreciyle ilgili hangi konuda yardımcı olmamızı istersiniz? Teslimat tarihi, takip bilgisi veya dağıtım durumu olabilir.'},
    'order-return': {labelKey: 'liveHelp.orderTopicReturn', fallback: 'İade / değişim', messageKey: 'liveHelp.questionOrderReturn', messageFallback: 'İade veya değişim talebiniz için ürün ve sebebi kısaca belirtin, sizi doğru adımlara yönlendirelim.'}
};

const LIVE_HELP_SESSION_KEY = 'tb_live_help_session_v1';

export const LiveHelpWidget = () => {
    const history = useHistory();
    const location = useLocation();
    const appContext = useContext(AppContext);
    const t = appContext?.t || ((key, fallback) => fallback || key);
    const safeText = (key, fallback) => {
        const value = t(key);
        return value === key ? fallback : value;
    };
    const [isOpen, setIsOpen] = useState(false);
    const [cartItems, setCartItems] = useState([]);
    const [orderHistory, setOrderHistory] = useState([]);
    const [selectedCartTopic, setSelectedCartTopic] = useState(null);
    const [selectedOrderTopic, setSelectedOrderTopic] = useState(null);
    const [conversationMessages, setConversationMessages] = useState([]);
    const [draftMessage, setDraftMessage] = useState('');
    const conversationEndRef = useRef(null);
    const pathname = location?.pathname || '';
    const isMobile = Boolean(appContext?.isMobile);

    let routeClassName = 'is-desktop';
    if (isMobile) {
        routeClassName = 'is-mobile-default';
        if (pathname.startsWith('/sepetim')) {
            routeClassName = 'has-bottom-cart-bar';
        } else if (pathname.startsWith('/detail/')) {
            routeClassName = 'has-bottom-product-bar';
        }
    }

    useEffect(() => {
        const syncContextData = () => {
            setCartItems(CartService.getCartItems().slice(0, 3));
            setOrderHistory(UserActivityService.getOrders().slice(0, 3));
        };

        syncContextData();
        window.addEventListener(CART_UPDATED_EVENT, syncContextData);
        window.addEventListener('storage', syncContextData);

        return () => {
            window.removeEventListener(CART_UPDATED_EVENT, syncContextData);
            window.removeEventListener('storage', syncContextData);
        };
    }, []);

    useEffect(() => {
        try {
            const raw = sessionStorage.getItem(LIVE_HELP_SESSION_KEY);
            if (!raw) {
                return;
            }

            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed?.conversationMessages)) {
                setConversationMessages(parsed.conversationMessages);
            }
            setSelectedCartTopic(parsed?.selectedCartTopic || null);
            setSelectedOrderTopic(parsed?.selectedOrderTopic || null);
        } catch (error) {
            // ignore broken session payloads
        }
    }, []);

    useEffect(() => {
        try {
            sessionStorage.setItem(LIVE_HELP_SESSION_KEY, JSON.stringify({
                conversationMessages,
                selectedCartTopic,
                selectedOrderTopic
            }));
        } catch (error) {
            // ignore storage failures
        }
    }, [conversationMessages, selectedCartTopic, selectedOrderTopic]);

    const lastOrder = orderHistory[0];
    const orderTotalLabel = useMemo(() => {
        const total = Number(lastOrder?.summary?.total || 0);
        return total > 0
            ? total.toLocaleString('tr-TR', {minimumFractionDigits: 2, maximumFractionDigits: 2}) + ' TL'
            : '';
    }, [lastOrder]);

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        requestAnimationFrame(() => {
            if (conversationEndRef.current) {
                conversationEndRef.current.scrollIntoView({
                    block: 'end',
                    behavior: 'smooth'
                });
            }
        });
    }, [conversationMessages, isOpen]);

    const openHelpPanel = () => {
        setIsOpen(true);
        setDraftMessage('');
    };

    const createAssistantReply = (text) => {
        const normalized = String(text || '').trim().toLocaleLowerCase('tr-TR');

        if (!normalized) {
            return null;
        }

        if (normalized.includes('kargo') || normalized.includes('teslimat') || normalized.includes('takip')) {
            return {
                message: safeText('liveHelp.replyCargo', 'Kargo ve teslimat sürecini birlikte kontrol edebiliriz. İstersen sizi siparişlerim ekranına yönlendireyim ve son siparişinizin durumunu oradan takip edin.'),
                actionLabel: safeText('liveHelp.goOrders', 'Siparişlerime Git'),
                actionTo: '/hesabım/Siparislerim'
            };
        }

        if (normalized.includes('iade') || normalized.includes('değişim')) {
            return {
                message: safeText('liveHelp.replyReturn', 'İade veya değişim işlemleri için sipariş detayından ilgili ürünü seçmeniz gerekir. Sizi siparişlerim alanına yönlendirebilirim.'),
                actionLabel: safeText('liveHelp.goOrders', 'Siparişlerime Git'),
                actionTo: '/hesabım/Siparislerim'
            };
        }

        if (normalized.includes('ödeme') || normalized.includes('kart') || normalized.includes('taksit')) {
            return {
                message: safeText('liveHelp.replyPayment', 'Ödeme adımında sorun yaşıyorsanız kart bilgileri, limit veya 3D güvenlik adımını birlikte kontrol etmenizi öneririm. İsterseniz sizi sepet ekranındaki ödeme adımına yönlendireyim.'),
                actionLabel: safeText('liveHelp.goCart', 'Sepetime Git'),
                actionTo: '/sepetim'
            };
        }

        if (normalized.includes('adres')) {
            return {
                message: safeText('liveHelp.replyAddress', 'Adres güncellemesi veya yeni adres ekleme işlemini hesap bilgileriniz içinden yapabilirsiniz.'),
                actionLabel: safeText('liveHelp.goAddress', 'Adreslerime Git'),
                actionTo: '/hesabım/KullaniciBilgilerim?section=address'
            };
        }

        if (normalized.includes('sepet') || normalized.includes('ürün') || normalized.includes('stok')) {
            return {
                message: safeText('liveHelp.replyCart', 'Sepetinizdeki ürün, stok veya adet güncelleme konusunda destek almak için ilgili ürünleri sepet ekranında yeniden kontrol etmeniz en hızlı yol olur.'),
                actionLabel: safeText('liveHelp.goCart', 'Sepetime Git'),
                actionTo: '/sepetim'
            };
        }

        if (normalized.includes('favori')) {
            return {
                message: safeText('liveHelp.replyFavorites', 'Favori ürünlerinizi görüntülemek veya düzenlemek için favorilerim ekranına yönlendirebilirim.'),
                actionLabel: safeText('liveHelp.goFavorites', 'Favorilerime Git'),
                actionTo: '/favoriler'
            };
        }

        if (normalized.includes('giriş') || normalized.includes('şifre') || normalized.includes('hesap')) {
            return {
                message: safeText('liveHelp.replyAccount', 'Hesap, giriş veya şifre güncelleme konuları için giriş ekranından veya hesap bilgilerim alanından devam edebilirsiniz.'),
                actionLabel: safeText('liveHelp.goLogin', 'Giriş Ekranına Git'),
                actionTo: '/login'
            };
        }

        return {
            message: safeText('liveHelp.replyDefault', 'Anladım. Sipariş, kargo, ödeme, iade, adres veya hesap konularından birini yazarsanız sizi doğru adıma yönlendirebilirim.')
        };
    };

    const handleTopicSelect = (topicId, group) => {
        const topicConfig = TOPIC_MESSAGE_MAP[topicId];
        if (!topicConfig) {
            return;
        }

        if (group === 'cart') {
            setSelectedCartTopic(topicId);
        } else {
            setSelectedOrderTopic(topicId);
        }

        setConversationMessages((prev) => {
            const withoutSameTopic = prev.filter((item) => item.topicId !== topicId && item.group !== group);
            return [
                ...withoutSameTopic,
                {
                    id: `${group}-${topicId}-user`,
                    role: 'user',
                    group,
                    topicId,
                    message: safeText(topicConfig.labelKey, topicConfig.fallback)
                },
                {
                    id: `${group}-${topicId}-assistant`,
                    role: 'assistant',
                    group,
                    topicId,
                    topicLabel: safeText(topicConfig.labelKey, topicConfig.fallback),
                    message: safeText(topicConfig.messageKey, topicConfig.messageFallback)
                }
            ];
        });
    };

    const sendDraftMessage = () => {
        const nextMessage = draftMessage.trim();
        if (!nextMessage) {
            return;
        }

        const assistantReply = createAssistantReply(nextMessage);

        setConversationMessages((prev) => ([
            ...prev,
            {
                id: `user-${Date.now()}`,
                role: 'user',
                message: nextMessage
            },
            assistantReply ? {
                id: `assistant-${Date.now() + 1}`,
                role: 'assistant',
                message: assistantReply.message,
                actionLabel: assistantReply.actionLabel,
                actionTo: assistantReply.actionTo
            } : null
        ].filter(Boolean)));

        setDraftMessage('');
    };

    return (
        <>
            <button
                type="button"
                className={`live-help-fab ${routeClassName}`}
                onClick={openHelpPanel}
                aria-label={t('liveHelp.buttonAria', 'Canlı yardımı aç')}
            >
                <span className="live-help-fab-ring" aria-hidden="true">
                    <svg viewBox="0 0 24 24" className="live-help-fab-icon">
                        <path
                            d="M5 13.5v-1.2C5 7.72 8.13 4.5 12 4.5s7 3.22 7 7.8v1.2"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.9"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                        <rect
                            x="4.2"
                            y="12.4"
                            width="3.3"
                            height="5.9"
                            rx="1.65"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.9"
                        />
                        <rect
                            x="16.5"
                            y="12.4"
                            width="3.3"
                            height="5.9"
                            rx="1.65"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.9"
                        />
                        <path
                            d="M16.5 18.1c0 1.5-1.52 2.4-3.7 2.4H11.5"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.9"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                        <path
                            d="M11.5 20.5h-1.4"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.9"
                            strokeLinecap="round"
                        />
                        <circle cx="10.1" cy="20.5" r="0.9" fill="currentColor"/>
                    </svg>
                </span>
                <span className="live-help-fab-label">{safeText('footer.liveHelp', 'Canlı Yardım')}</span>
            </button>

            {isOpen && (
                <div className="live-help-overlay" onClick={() => setIsOpen(false)}>
                    <div className={`live-help-panel ${isMobile ? 'is-mobile' : 'is-desktop'}`} onClick={(event) => event.stopPropagation()}>
                        <div className="live-help-panel-head">
                            <div className="live-help-panel-title-wrap">
                                <span className="live-help-panel-head-icon" aria-hidden="true">
                                    <svg viewBox="0 0 24 24" className="live-help-fab-icon">
                                        <path
                                            d="M5 13.5v-1.2C5 7.72 8.13 4.5 12 4.5s7 3.22 7 7.8v1.2"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="1.9"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                        <rect x="4.2" y="12.4" width="3.3" height="5.9" rx="1.65" fill="none" stroke="currentColor" strokeWidth="1.9" />
                                        <rect x="16.5" y="12.4" width="3.3" height="5.9" rx="1.65" fill="none" stroke="currentColor" strokeWidth="1.9" />
                                        <path d="M16.5 18.1c0 1.5-1.52 2.4-3.7 2.4H11.5" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
                                        <path d="M11.5 20.5h-1.4" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
                                        <circle cx="10.1" cy="20.5" r="0.9" fill="currentColor"/>
                                    </svg>
                                </span>
                                <div>
                                <strong>{safeText('liveHelp.title', 'Canlı Destek')}</strong>
                                <span>{safeText('liveHelp.subtitle', 'Size hemen yardımcı olalım')}</span>
                                </div>
                            </div>
                            <button
                                type="button"
                                className="live-help-close"
                                onClick={() => setIsOpen(false)}
                                aria-label={safeText('liveHelp.closeAria', 'Canlı yardımı kapat')}
                            >
                                <i className="pi pi-times"/>
                            </button>
                        </div>

                        <div className="live-help-panel-body">
                            <div className="live-help-message is-agent">
                                <span className="live-help-avatar">TB</span>
                                <div className="live-help-bubble">
                                    <strong>{safeText('liveHelp.agentName', 'Trend Burada Destek')}</strong>
                                    <p>{safeText('liveHelp.welcomeMessage', 'Sipariş, iade, teslimat veya ürün bilgisi için size yardımcı olabiliriz.')}</p>
                                </div>
                            </div>

                            {cartItems.length > 0 && (
                                <section className="live-help-context-section">
                                    <div className="live-help-context-head">
                                        <strong>{safeText('liveHelp.cartSectionTitle', 'Sepetinizle ilgili yardımcı olalım')}</strong>
                                        <span>{safeText('liveHelp.cartSectionSubtitle', 'Destek almak istediğiniz konuyu seçin')}</span>
                                    </div>

                                    <div className="live-help-product-strip">
                                        {cartItems.map((item) => (
                                            <div key={item.lineId} className="live-help-mini-product-card">
                                                <img src={item.img} alt={item.title}/>
                                                <div>
                                                    <strong>{item.mark}</strong>
                                                    <span>{item.title}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="live-help-topic-grid">
                                        {CART_HELP_TOPICS.map((topic) => (
                                            <button
                                                key={topic.id}
                                                type="button"
                                                className={`live-help-topic-card ${selectedCartTopic === topic.id ? 'is-active' : ''}`}
                                                onClick={() => handleTopicSelect(topic.id, 'cart')}
                                            >
                                                {safeText(topic.labelKey, topic.fallback)}
                                            </button>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {orderHistory.length > 0 && (
                                <section className="live-help-context-section">
                                    <div className="live-help-context-head">
                                        <strong>{safeText('liveHelp.orderSectionTitle', 'Sipariş ve kargo desteği')}</strong>
                                        <span>{safeText('liveHelp.orderSectionSubtitle', 'Son siparişiniz üzerinden hızlı destek alın')}</span>
                                    </div>

                                    <div className="live-help-order-summary-card">
                                        <div className="live-help-order-summary-top">
                                            <strong>#{lastOrder?.id}</strong>
                                            <span>{new Date(lastOrder?.createdAt || Date.now()).toLocaleDateString('tr-TR')}</span>
                                        </div>
                                        <div className="live-help-order-summary-items">
                                            {(lastOrder?.items || []).slice(0, 2).map((item) => (
                                                <div key={`${lastOrder?.id}-${item.id}-${item.lineId || item.title}`} className="live-help-order-mini-line">
                                                    <img src={item.img} alt={item.title}/>
                                                    <span>{item.mark} {item.title}</span>
                                                </div>
                                            ))}
                                        </div>
                                        {orderTotalLabel && (
                                            <div className="live-help-order-summary-total">
                                                <span>{safeText('liveHelp.orderTotal', 'Toplam')}</span>
                                                <strong>{orderTotalLabel}</strong>
                                            </div>
                                        )}
                                    </div>

                                    <div className="live-help-topic-grid">
                                        {ORDER_HELP_TOPICS.map((topic) => (
                                            <button
                                                key={topic.id}
                                                type="button"
                                                className={`live-help-topic-card ${selectedOrderTopic === topic.id ? 'is-active' : ''}`}
                                                onClick={() => handleTopicSelect(topic.id, 'order')}
                                            >
                                                {safeText(topic.labelKey, topic.fallback)}
                                            </button>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {conversationMessages.map((message) => (
                                <div key={message.id} className={`live-help-message ${message.role === 'user' ? 'is-user' : 'is-agent'}`}>
                                    {message.role !== 'user' && <span className="live-help-avatar">TB</span>}
                                    <div className="live-help-bubble">
                                        {message.role !== 'user' && message.topicLabel && <strong>{message.topicLabel}</strong>}
                                        <p>{message.message}</p>
                                        {message.role !== 'user' && message.actionTo && (
                                            <button
                                                type="button"
                                                className="live-help-inline-action"
                                                onClick={() => {
                                                    setIsOpen(false);
                                                    history.push(message.actionTo);
                                                }}
                                            >
                                                {message.actionLabel}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                            <div ref={conversationEndRef} />
                        </div>

                        <div className="live-help-panel-foot">
                            <div className="live-help-input-shell">
                                <input
                                    type="text"
                                    value={draftMessage}
                                    onChange={(event) => setDraftMessage(event.target.value)}
                                    onKeyDown={(event) => {
                                        if (event.key === 'Enter') {
                                            event.preventDefault();
                                            sendDraftMessage();
                                        }
                                    }}
                                    aria-label={t('liveHelp.inputAria', 'Mesaj alanı')}
                                    placeholder={safeText('liveHelp.inputPlaceholder', 'Mesaj yazın...')}
                                />
                                <button type="button" aria-label={safeText('liveHelp.sendAria', 'Mesaj gönder')} onClick={sendDraftMessage}>
                                    <i className="pi pi-send"/>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default LiveHelpWidget;
