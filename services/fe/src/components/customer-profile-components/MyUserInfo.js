import React, {useContext, useEffect, useMemo, useRef, useState} from 'react';
import ProfileNavigation, {buildProfileSections} from "./ProfileNavigation";
import '../../css/customer-profile/customer-profile.css'
import {InputText} from "primereact/inputtext";
import {Button} from "primereact/button";
import {Password} from "primereact/password";
import {InputMask} from "primereact/inputmask";
import {useHistory, useLocation} from "react-router-dom";
import {Calendar} from "primereact/calendar";
import {Toast} from "primereact/toast";
import AppContext from "../../AppContext";
import {InputTextarea} from "primereact/inputtextarea";
import UserActivityService from "../../service/UserActivityService";
import {
    useAddresses,
    useCreateAddress,
    useDeleteAddress,
    useUpdateAddress,
    buildSetDefaultBody,
} from "../../hooks/useAddresses";
import {
    useCustomerProfile,
    useUpdateCustomerProfile,
    extractFieldErrors,
} from "../../hooks/useCustomerProfile";

// Server gender enum is uppercase (FEMALE/MALE/UNSPECIFIED); UI radio buttons use lowercase.
// Two helpers keep that conversion in one place.
const genderToServer = (uiValue) => {
    if (!uiValue) return null;
    return uiValue.toLowerCase();
};
const genderToUi = (serverValue) => {
    if (!serverValue) return '';
    return String(serverValue).toLowerCase();
};

// Convert a JavaScript Date (PrimeReact Calendar value) to ISO yyyy-MM-dd that the server
// LocalDate parser accepts. Null in -> null out.
const dateToIso = (date) => {
    if (!date) return null;
    const d = date instanceof Date ? date : new Date(date);
    if (Number.isNaN(d.getTime())) return null;
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
};

// fullName is a single column on the server. Existing UI shows two readonly inputs
// (Ad / Soyad), so we split on the first whitespace for display only — purely cosmetic
// since these fields are not editable.
const splitFullName = (fullName) => {
    const value = String(fullName || '').trim();
    if (!value) return {firstName: '', lastName: ''};
    const [first, ...rest] = value.split(/\s+/);
    return {firstName: first || '', lastName: rest.join(' ')};
};

// Backend phone validation regex (mirrors AddressRequest.java). Keep the source of truth
// on the server but reject obviously-bad input client-side so users don't get a 400.
const ADDRESS_PHONE_REGEX = /^[+0-9 ()\-]{6,30}$/;
const DEFAULT_COUNTRY = "Türkiye";

const buildEmptyAddressForm = (overrides = {}) => ({
    title: "",
    fullName: "",
    phone: "",
    country: DEFAULT_COUNTRY,
    city: "",
    district: "",
    neighborhood: "",
    addressLine: "",
    postalCode: "",
    ...overrides,
});

const AI_SHOP_BODY_KEY = 'tb_ai_shop_body_profile_v1';
const BODY_PROFILE_DEFAULTS = {
    height: '',
    weight: '',
    gender: 'kadin',
    topSize: 'M',
    bottomSize: '38',
    trouserLength: '',
    waist: '',
    budget: ''
};

const readBodyProfile = () => {
    try {
        const raw = localStorage.getItem(AI_SHOP_BODY_KEY);
        if (!raw) return BODY_PROFILE_DEFAULTS;
        return {...BODY_PROFILE_DEFAULTS, ...JSON.parse(raw)};
    } catch (e) {
        return BODY_PROFILE_DEFAULTS;
    }
};

const MyUserInfo = () => {
    const {t = (key) => key, isMobile = false} = useContext(AppContext) || {};
    const safeText = (key, fallback) => {
        const value = t(key);
        return value === key ? fallback : value;
    };
    const DISABLE_INPUT_TOOLTIP_MESSAGE = t('profile.readonlyTooltip');
    const history = useHistory();
    const location = useLocation();
    const profileSections = useMemo(() => buildProfileSections(t), [t]);

    const toastCenter = useRef(null);

    const [userId, setUserId] = useState("");
    const [fullName, setFullName] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [gender, setGender] = useState("");
    const [email, setEmail] = useState("");
    const [birthDate, setBirthDate] = useState(null);
    const [phoneNumber, setPhoneNumber] = useState("");
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [againNewPassword, setAgainNewPassword] = useState("");
    const [updateBtnDisabled, setUpdateBtnDisabled] = useState(true);
    const [passUpdateBtnDisabled, setPassUpdateBtnDisabled] = useState(true);
    const [activeSection, setActiveSection] = useState('user-info');
    const [compactProfileNav, setCompactProfileNav] = useState(typeof window !== 'undefined' ? window.innerWidth <= 768 : false);
    const [accountSubTab, setAccountSubTab] = useState('membership');
    const [newPhoneNumber, setNewPhoneNumber] = useState("");
    const [phoneOtpModalOpen, setPhoneOtpModalOpen] = useState(false);
    const [phoneOtpCode, setPhoneOtpCode] = useState("");
    const [phoneOtpError, setPhoneOtpError] = useState("");
    const [contactPrefs, setContactPrefs] = useState({
        email: true,
        sms: false,
        push: false
    });
    const [bodyProfile, setBodyProfile] = useState(BODY_PROFILE_DEFAULTS);
    const [showAddressForm, setShowAddressForm] = useState(false);
    const [orderHistory, setOrderHistory] = useState([]);
    const [viewedProducts, setViewedProducts] = useState([]);
    const [editingAddressId, setEditingAddressId] = useState(null);
    const [addressForm, setAddressForm] = useState(buildEmptyAddressForm());

    // Address CRUD is delegated to React Query — see src/hooks/useAddresses.js. The hook
    // gates itself on a valid Bearer token so guests don't ping the backend unnecessarily.
    const {
        data: addresses = [],
        isLoading: addressesLoading,
        isError: addressesError,
    } = useAddresses();
    const createAddressMutation = useCreateAddress();
    const updateAddressMutation = useUpdateAddress();
    const deleteAddressMutation = useDeleteAddress();

    const showMessage = (labelText, detailText, ref, severity) => {
        ref.current.show({severity: severity, summary: labelText, detail: detailText, life: 3000});
    };

    // Customer profile is now sourced from GET /api/v1/customer/me (React Query). When the
    // request 401s the user is bounced to /login below; on success we sync the form's
    // local state so existing edit/dirty-tracking continues to work without rewiring every
    // input to derive its value from the cache directly.
    const {
        data: customerProfile,
        isLoading: profileLoading,
        isError: profileError,
        error: profileFetchError,
    } = useCustomerProfile();
    const updateProfileMutation = useUpdateCustomerProfile();
    const [fieldErrors, setFieldErrors] = useState({});

    useEffect(() => {
        // 401 means the token is missing or expired — same behaviour the legacy localStorage
        // path used to take.
        if (profileFetchError && profileFetchError.response && profileFetchError.response.status === 401) {
            localStorage.removeItem("token");
            history.push("/login");
            return;
        }
        if (profileError && !customerProfile) {
            showMessage(t('profile.noUserTitle'), t('profile.noUserDetail'), toastCenter, 'warn');
        }
    }, [profileError, profileFetchError, customerProfile, history, t]);

    useEffect(() => {
        if (!customerProfile) {
            return;
        }
        // server returns customerCode as `customerId` (cust-XXXX). It's the public-facing id
        // we stash into the userId state so unrelated code paths (Activity, Cart events,
        // toasts) keep working.
        setUserId(customerProfile.customerId || "");
        setEmail(customerProfile.email || "");
        const split = splitFullName(customerProfile.fullName);
        setFirstName(split.firstName);
        setLastName(split.lastName);
        setFullName(customerProfile.fullName || "");
        setGender(genderToUi(customerProfile.gender));
        setBirthDate(customerProfile.birthDate ? new Date(customerProfile.birthDate) : null);
        setPhoneNumber(customerProfile.phone || "");
        setNewPhoneNumber(customerProfile.phone || "");
    }, [customerProfile]);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const requestedSection = params.get('section');
        const availableSections = profileSections.flatMap((group) => group.items.map((item) => item.key));

        if (requestedSection && availableSections.includes(requestedSection)) {
            setActiveSection(requestedSection);
            return;
        }

        setActiveSection('user-info');
    }, [location.search, profileSections]);

    useEffect(() => {
        const onResize = () => {
            setCompactProfileNav(window.innerWidth <= 768);
        };

        onResize();
        window.addEventListener('resize', onResize, {passive: true});
        return () => window.removeEventListener('resize', onResize);
    }, []);

    useEffect(() => {
        setBodyProfile(readBodyProfile());
    }, []);

    // NOTE: addresses used to be stored under `tb_addresses_${userId}` in localStorage with a
    // seeded fallback row (Moda Mah. ...) when no entries existed. Both the read and write
    // effects, plus the seed, were removed when the feature moved to the backend. The legacy
    // localStorage keys are wiped at app boot by src/utils/clearLegacyAddresses.js.

    useEffect(() => {
        if (!userId) {
            return;
        }
        setOrderHistory(UserActivityService.getOrders());
        setViewedProducts(UserActivityService.getViewedProducts());
    }, [userId, activeSection]);

    const clickUserInformationUpdateBtn = () => {
        // Phone is intentionally NOT included here — it has its own OTP-gated path
        // (handleApprovePhoneOtp) which fires its own PATCH after the 6-digit code is
        // validated. Sending it from this button would bypass that demo flow.
        //
        // fullName / email / firstName / lastName are also absent: the request DTO doesn't
        // expose them, and the server treats them as immutable identity fields. Even if a
        // future bug let an attacker post them, the controller would simply ignore them.
        setFieldErrors({});
        const body = {
            gender: genderToServer(gender),
            birthDate: dateToIso(birthDate),
        };

        updateProfileMutation.mutate(body, {
            onSuccess: () => {
                setUpdateBtnDisabled(true);
                showMessage(
                    safeText('profile.updatedTitle', 'Bilgiler kaydedildi'),
                    safeText('profile.updatedDetail', 'Profil bilgileriniz başarıyla güncellendi.'),
                    toastCenter,
                    'success'
                );
            },
            onError: (error) => {
                if (error && error.response && error.response.status === 401) {
                    localStorage.removeItem("token");
                    history.push("/login");
                    return;
                }
                const errors = extractFieldErrors(error);
                setFieldErrors(errors);
                if (Object.keys(errors).length > 0) {
                    showMessage(
                        safeText('profile.validationTitle', 'Geçersiz alanlar var'),
                        safeText('profile.validationDetail', 'Lütfen kırmızı ile işaretli alanları kontrol edin.'),
                        toastCenter,
                        'warn'
                    );
                } else {
                    showMessage(
                        safeText('profile.updateErrorTitle', 'Güncelleme başarısız'),
                        safeText('profile.updateErrorDetail', 'Profiliniz şu anda güncellenemiyor. Lütfen daha sonra tekrar deneyin.'),
                        toastCenter,
                        'warn'
                    );
                }
            },
        });
    }

    const PHONE_OTP_DEMO_CODE = '428613';

    const handleSendPhoneOtp = () => {
        const digits = String(newPhoneNumber || '').replace(/\D/g, '');
        if (digits.length !== 11) {
            showMessage(
                safeText('profile.phoneInvalidTitle', 'Geçersiz Telefon'),
                safeText('profile.phoneInvalidDetail', 'Lütfen geçerli bir cep telefonu numarası girin.'),
                toastCenter,
                'warn'
            );
            return;
        }

        setPhoneOtpCode('');
        setPhoneOtpError('');
        setPhoneOtpModalOpen(true);
    };

    const handleApprovePhoneOtp = () => {
        if (phoneOtpCode !== PHONE_OTP_DEMO_CODE) {
            setPhoneOtpError(safeText('profile.phoneOtpInvalid', 'Doğrulama kodu hatalı. Demo kod: 428613'));
            return;
        }

        // OTP is the local "you own this number" guard; the server-side persistence is the
        // PATCH below. Both sides must succeed before we celebrate — otherwise the local
        // state would drift from the database and a refresh would revert the change.
        const phoneBody = {phone: String(newPhoneNumber || '').trim()};

        updateProfileMutation.mutate(phoneBody, {
            onSuccess: () => {
                setPhoneNumber(newPhoneNumber);
                setPhoneOtpModalOpen(false);
                setPhoneOtpError('');
                setPhoneOtpCode('');
                showMessage(
                    safeText('profile.phoneUpdatedTitle', 'Başarılı'),
                    safeText('profile.phoneUpdatedDetail', 'Cep telefonu numaranız güncellendi.'),
                    toastCenter,
                    'success'
                );
            },
            onError: (error) => {
                if (error && error.response && error.response.status === 401) {
                    localStorage.removeItem("token");
                    history.push("/login");
                    return;
                }
                const errors = extractFieldErrors(error);
                if (errors.phone) {
                    // Surface the server's specific complaint (e.g. bad characters) inside
                    // the modal so the user can fix it without dismissing the dialog.
                    setPhoneOtpError(errors.phone);
                    return;
                }
                setPhoneOtpError(safeText(
                    'profile.phoneUpdateErrorDetail',
                    'Telefon güncellenemedi. Lütfen daha sonra tekrar deneyin.'
                ));
            },
        });
    };

    const sectionMeta = {
        'user-info': {title: t('profile.accountInfoTitle'), subtitle: t('profile.accountInfoSubtitle')},
        'body-info': {title: safeText('profile.bodyInfo', 'Beden Bilgilerim'), subtitle: safeText('profile.bodyInfoText', 'AI Shop önerilerinin size daha doğru kombinler sunabilmesi için ölçülerinizi burada güncelleyebilirsiniz.')},
        'address': {title: t('profile.sectionTitleAddress'), subtitle: t('profile.sectionSubtitleAddress')},
        'saved-cards': {title: t('profile.sectionTitleCards'), subtitle: t('profile.sectionSubtitleCards')},
        'orders': {title: t('profile.sectionTitleOrders'), subtitle: t('profile.sectionSubtitleOrders')},
        'seller-messages': {title: t('profile.sectionTitleMessages'), subtitle: t('profile.sectionSubtitleMessages')},
        'reviews': {title: t('profile.sectionTitleReviews'), subtitle: t('profile.sectionSubtitleReviews')},
        'buy-again': {title: t('profile.sectionTitleBuyAgain'), subtitle: t('profile.sectionSubtitleBuyAgain')},
        'coupons': {title: t('profile.sectionTitleCoupons'), subtitle: t('profile.sectionSubtitleCoupons')},
        'history': {title: t('profile.sectionTitleHistory'), subtitle: t('profile.sectionSubtitleHistory')},
        'followed-stores': {title: t('profile.sectionTitleFollowed'), subtitle: t('profile.sectionSubtitleFollowed')}
    };

    const renderPlaceholderSection = () => {
        const info = sectionMeta[activeSection] || sectionMeta['user-info'];

        return (
            <div className="process-row">
                <div className="process-header-item">{info.title}</div>
                <div className="profile-placeholder-panel">
                    <p>{info.subtitle}</p>
                    <div className="profile-placeholder-grid">
                        <div className="profile-placeholder-card">
                            <h4>{t('profile.demoComponent')}</h4>
                            <span>{t('profile.demoComponentText')}</span>
                        </div>
                        <div className="profile-placeholder-card">
                            <h4>{t('profile.quickAction')}</h4>
                            <span>{t('profile.quickActionText')}</span>
                        </div>
                        <div className="profile-placeholder-card">
                            <h4>{t('profile.statusBox')}</h4>
                            <span>{t('profile.statusBoxText')}</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderUserInfoSection = () => {
        return (
            <>
                <div className="process-row">
                    <div className="process-header-item">
                        {t('profile.accountInfoTitle')}
                    </div>
                </div>
                <div className="process-row user-info-layout user-info-shell">
                    <div className="user-info-tabs">
                        <button
                            type="button"
                            className={`user-info-tab ${accountSubTab === 'membership' ? 'is-active' : ''}`}
                            onClick={() => setAccountSubTab('membership')}
                        >
                            {safeText('profile.membershipInfo', 'Üyelik Bilgilerim')}
                        </button>
                        <button
                            type="button"
                            className={`user-info-tab ${accountSubTab === 'password' ? 'is-active' : ''}`}
                            onClick={() => setAccountSubTab('password')}
                        >
                            {safeText('profile.passwordUpdate', 'Şifre Değişikliği')}
                        </button>
                        <button
                            type="button"
                            className={`user-info-tab ${accountSubTab === 'contact' ? 'is-active' : ''}`}
                            onClick={() => setAccountSubTab('contact')}
                        >
                            {safeText('profile.contactPreferences', 'İletişim Tercihlerim')}
                        </button>
                    </div>

                    {accountSubTab === 'membership' ? (
                        <div className="user-detail">
                            <div className="user-detail-body">
                                <div className="detail-row-1">
                                    <div className="user-detail-item">
                                        <div className="header-item">{t('profile.name')}</div>
                                        <InputText
                                            tooltip={DISABLE_INPUT_TOOLTIP_MESSAGE}
                                            tooltipOptions={{position: 'top'}}
                                            value={firstName}
                                            disabled={true}
                                            onChange={(e) => setFirstName(e.target.value)}
                                        />
                                    </div>
                                    <div className="user-detail-item">
                                        <div className="header-item">{t('profile.surname')}</div>
                                        <InputText
                                            value={lastName}
                                            disabled={true}
                                            onChange={(e) => setLastName(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="detail-row-2">
                                    <div className="user-detail-item">
                                        <div className="header-item">{t('profile.email')}</div>
                                        <InputText
                                            disabled={true}
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                        />
                                    </div>
                                    <div className="user-detail-item">
                                        <div className="header-item">{safeText('profile.gender', 'Cinsiyet')}</div>
                                        <div className="gender-check-list">
                                            <label className="gender-check-item">
                                                <input
                                                    type="radio"
                                                    name="profile-gender"
                                                    checked={gender === 'female'}
                                                    onChange={() => {
                                                        setGender('female');
                                                        setUpdateBtnDisabled(false);
                                                    }}
                                                />
                                                <span>{safeText('profile.genderFemale', 'Kadın')}</span>
                                            </label>
                                            <label className="gender-check-item">
                                                <input
                                                    type="radio"
                                                    name="profile-gender"
                                                    checked={gender === 'male'}
                                                    onChange={() => {
                                                        setGender('male');
                                                        setUpdateBtnDisabled(false);
                                                    }}
                                                />
                                                <span>{safeText('profile.genderMale', 'Erkek')}</span>
                                            </label>
                                            <label className="gender-check-item">
                                                <input
                                                    type="radio"
                                                    name="profile-gender"
                                                    checked={gender === 'unspecified' || !gender}
                                                    onChange={() => {
                                                        setGender('unspecified');
                                                        setUpdateBtnDisabled(false);
                                                    }}
                                                />
                                                <span>{safeText('profile.genderUnspecified', 'Belirtmek İstemiyorum')}</span>
                                            </label>
                                        </div>
                                        {fieldErrors.gender && (
                                            <div className="bank-otp-error">{fieldErrors.gender}</div>
                                        )}
                                    </div>
                                </div>

                                <div className="detail-row-3">
                                    <div className="user-detail-item">
                                        <div className="header-item">{t('profile.birthDate')}</div>
                                        <Calendar
                                            dateFormat={"dd.mm.yy"}
                                            id="buttondisplay"
                                            value={birthDate}
                                            placeholder={safeText('profile.birthDatePlaceholder', 'GG.AA.YYYY')}
                                            onChange={(e) => {
                                                setBirthDate(e.value)
                                                setUpdateBtnDisabled(false)
                                            }}
                                            maxDate={new Date()}
                                        />
                                        {fieldErrors.birthDate && (
                                            <div className="bank-otp-error">{fieldErrors.birthDate}</div>
                                        )}
                                    </div>
                                </div>
                                <div className="detail-row-4">
                                    <div className="user-detail-item">
                                        <div className="user-detail-button">
                                            <Button
                                                className="profile-action-btn"
                                                onClick={clickUserInformationUpdateBtn}
                                                label={updateProfileMutation.isLoading
                                                    ? safeText('profile.updating', 'Kaydediliyor...')
                                                    : t('profile.update')}
                                                disabled={updateBtnDisabled || updateProfileMutation.isLoading || profileLoading}
                                                size="large"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="user-subsection-divider"/>

                            <div className="contact-preference-box phone-update-box">
                                <h4>{safeText('profile.contactInfo', 'İletişim Bilgisi')}</h4>
                                <p>{safeText('profile.phoneTabInfo', 'Telefon numaranızı doğrulama kodu ile güvenli şekilde güncelleyebilirsiniz.')}</p>

                                <div className="phone-update-grid">
                                    <label className="phone-update-field">
                                        <span>{safeText('profile.phoneTab', 'Cep Telefonu')}</span>
                                        <InputMask
                                            mask="0(999)-999-99-99"
                                            placeholder="0(5__) ___ __ __"
                                            keyfilter="int"
                                            value={newPhoneNumber}
                                            onChange={(e) => setNewPhoneNumber(e.value)}
                                        />
                                    </label>
                                </div>

                                <div className="user-detail-button">
                                    <Button
                                        className="profile-action-btn"
                                        label={safeText('profile.sendPhoneOtp', 'SMS Kodu Gönder')}
                                        onClick={handleSendPhoneOtp}
                                    />
                                </div>
                            </div>
                        </div>
                    ) : null}

                    {accountSubTab === 'password' ? (
                        <div className="password-change">
                            <div className="password-change-info">
                                {safeText('profile.passwordHintAccount', 'Şifreniz en az bir harf, rakam veya özel karakter içermeli ve en az 8 karakterden oluşmalıdır.')}
                            </div>
                            <div className="password-change-body">
                                <div className="password-row-1">
                                    <div className="password-item">
                                        <div className="header-item">{t('profile.currentPassword')}</div>
                                        <Password
                                            feedback={false}
                                            value={currentPassword}
                                            toggleMask
                                            className="account-password-input"
                                            onChange={(e) => {
                                                setCurrentPassword(e.target.value)
                                                setPassUpdateBtnDisabled(false)
                                            }}
                                        />
                                    </div>
                                </div>

                                <div className="password-row-2">
                                    <div className="password-item">
                                        <div className="header-item">{t('profile.newPassword')}</div>
                                        <Password
                                            value={newPassword}
                                            toggleMask
                                            className="account-password-input"
                                            onChange={(e) => {
                                                setNewPassword(e.target.value)
                                                setPassUpdateBtnDisabled(false)
                                            }}
                                        />
                                    </div>
                                </div>

                                <div className="password-row-3">
                                    <div className="password-item">
                                        <div className="header-item">{t('profile.repeatPassword')}</div>
                                        <Password
                                            feedback={false}
                                            value={againNewPassword}
                                            toggleMask
                                            className="account-password-input"
                                            onChange={(e) => {
                                                setAgainNewPassword(e.target.value)
                                                setPassUpdateBtnDisabled(false)
                                            }}
                                        />
                                    </div>
                                </div>

                                <div className="password-row-4">
                                    <div className="password-item">
                                        <div className="user-detail-button">
                                            <Button
                                                className="profile-action-btn"
                                                label={t('profile.update')}
                                                disabled={passUpdateBtnDisabled}
                                                size="large"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : null}

                    {accountSubTab === 'contact' ? (
                        <div className="contact-preference-box">
                            <h4>{safeText('profile.contactPreferences', 'İletişim Tercihlerim')}</h4>
                            <p>{safeText('profile.contactPrefText', 'Kampanya, bildirim ve fırsat mesajları için tercihlerinizi buradan yönetebilirsiniz.')}</p>
                            <label className="contact-preference-item">
                                <input
                                    type="checkbox"
                                    checked={contactPrefs.email}
                                    onChange={(e) => setContactPrefs((prev) => ({...prev, email: e.target.checked}))}
                                />
                                <span>{safeText('profile.contactByEmail', 'E-posta ile bilgilendirme')}</span>
                            </label>
                            <label className="contact-preference-item">
                                <input
                                    type="checkbox"
                                    checked={contactPrefs.sms}
                                    onChange={(e) => setContactPrefs((prev) => ({...prev, sms: e.target.checked}))}
                                />
                                <span>{safeText('profile.contactBySms', 'SMS ile bilgilendirme')}</span>
                            </label>
                            <label className="contact-preference-item">
                                <input
                                    type="checkbox"
                                    checked={contactPrefs.push}
                                    onChange={(e) => setContactPrefs((prev) => ({...prev, push: e.target.checked}))}
                                />
                                <span>{safeText('profile.contactByPush', 'Uygulama bildirimi')}</span>
                            </label>
                            <div className="user-detail-button">
                                <Button
                                    className="profile-action-btn"
                                    label={t('profile.update')}
                                    onClick={() => showMessage('Bilgi', 'İletişim tercihleriniz demo olarak güncellendi.', toastCenter, 'info')}
                                />
                            </div>
                        </div>
                    ) : null}

                </div>
            </>
        );
    };

    const renderBodyInfoSection = () => {
        const saveBodyProfile = () => {
            localStorage.setItem(AI_SHOP_BODY_KEY, JSON.stringify(bodyProfile));
            showMessage(
                safeText('profile.bodyProfileSavedTitle', 'Beden bilgileri kaydedildi'),
                safeText('profile.bodyProfileSavedDetail', 'AI Shop ve hesabım ekranında aynı beden bilgileri kullanılacak.'),
                toastCenter,
                'success'
            );
        };

        return (
            <>
                <div className="process-row">
                    <div className="process-header-item">{safeText('profile.bodyInfo', 'Beden Bilgilerim')}</div>
                </div>
                <div className="process-row">
                    <div className="contact-preference-box phone-update-box">
                        <h4>{safeText('profile.bodyInfo', 'Beden Bilgilerim')}</h4>
                        <p>{safeText('profile.bodyInfoText', 'AI Shop önerilerinin size daha doğru kombinler sunabilmesi için ölçülerinizi burada güncelleyebilirsiniz.')}</p>

                        <div className="phone-update-grid">
                            <label className="phone-update-field">
                                <span>{safeText('aiShop.height', 'Boy')}</span>
                                <InputText value={bodyProfile.height} onChange={(e) => setBodyProfile((prev) => ({...prev, height: e.target.value}))} placeholder="cm" />
                            </label>
                            <label className="phone-update-field">
                                <span>{safeText('aiShop.weight', 'Kilo')}</span>
                                <InputText value={bodyProfile.weight} onChange={(e) => setBodyProfile((prev) => ({...prev, weight: e.target.value}))} placeholder="kg" />
                            </label>
                            <label className="phone-update-field">
                                <span>{safeText('aiShop.gender', 'Cinsiyet')}</span>
                                <div className="gender-check-list">
                                    <label className="gender-check-item">
                                        <input type="radio" name="body-gender" checked={bodyProfile.gender === 'kadin'} onChange={() => setBodyProfile((prev) => ({...prev, gender: 'kadin'}))} />
                                        <span>{safeText('profile.genderFemale', 'Kadın')}</span>
                                    </label>
                                    <label className="gender-check-item">
                                        <input type="radio" name="body-gender" checked={bodyProfile.gender === 'erkek'} onChange={() => setBodyProfile((prev) => ({...prev, gender: 'erkek'}))} />
                                        <span>{safeText('profile.genderMale', 'Erkek')}</span>
                                    </label>
                                    <label className="gender-check-item">
                                        <input type="radio" name="body-gender" checked={bodyProfile.gender === 'cocuk'} onChange={() => setBodyProfile((prev) => ({...prev, gender: 'cocuk'}))} />
                                        <span>{safeText('aiShop.genderChild', 'Çocuk')}</span>
                                    </label>
                                </div>
                            </label>
                            <label className="phone-update-field">
                                <span>{safeText('aiShop.topSize', 'Kıyafet bedeni')}</span>
                                <InputText value={bodyProfile.topSize} onChange={(e) => setBodyProfile((prev) => ({...prev, topSize: e.target.value}))} placeholder="XS / S / M / L / XL" />
                            </label>
                            <label className="phone-update-field">
                                <span>{safeText('aiShop.bottomSize', 'Pantolon bedeni')}</span>
                                <InputText value={bodyProfile.bottomSize} onChange={(e) => setBodyProfile((prev) => ({...prev, bottomSize: e.target.value}))} placeholder="36 / 38 / 40" />
                            </label>
                            <label className="phone-update-field">
                                <span>{safeText('aiShop.trouserLength', 'Pantolon boy ölçüsü')}</span>
                                <InputText value={bodyProfile.trouserLength} onChange={(e) => setBodyProfile((prev) => ({...prev, trouserLength: e.target.value}))} placeholder="İç boy / paça" />
                            </label>
                            <label className="phone-update-field">
                                <span>{safeText('aiShop.waist', 'Bel ölçüsü')}</span>
                                <InputText value={bodyProfile.waist} onChange={(e) => setBodyProfile((prev) => ({...prev, waist: e.target.value}))} placeholder="cm" />
                            </label>
                            <label className="phone-update-field">
                                <span>{safeText('aiShop.budget', 'Bütçe üst limiti')}</span>
                                <InputText value={bodyProfile.budget} onChange={(e) => setBodyProfile((prev) => ({...prev, budget: e.target.value}))} placeholder="2500" />
                            </label>
                        </div>

                        <div className="user-detail-button">
                            <Button
                                className="profile-action-btn"
                                label={safeText('profile.update', 'Güncelle')}
                                onClick={saveBodyProfile}
                            />
                        </div>
                    </div>
                </div>
            </>
        );
    };

    const clearAddressForm = () => {
        setAddressForm(buildEmptyAddressForm());
        setEditingAddressId(null);
        setShowAddressForm(false);
    };

    const handleOpenNewAddressForm = () => {
        setEditingAddressId(null);
        setAddressForm(buildEmptyAddressForm({
            fullName: fullName || '',
            phone: phoneNumber || '',
        }));
        setShowAddressForm(true);
    };

    const handleEditAddress = (address) => {
        setEditingAddressId(address.id);
        setAddressForm({
            title: address.title || '',
            fullName: address.fullName || '',
            phone: address.phone || '',
            country: address.country || DEFAULT_COUNTRY,
            city: address.city || '',
            district: address.district || '',
            neighborhood: address.neighborhood || '',
            addressLine: address.addressLine || '',
            postalCode: address.postalCode || '',
        });
        setShowAddressForm(true);
    };

    const handleAddressFieldChange = (field, value) => {
        setAddressForm((prev) => ({...prev, [field]: value}));
    };

    const handleAddressMutationError = (error, fallbackDetailKey, fallbackDetailText) => {
        if (error && error.response && error.response.status === 401) {
            // Token expired or missing — bounce to login like the rest of the app does.
            localStorage.removeItem("token");
            history.push("/login");
            return;
        }
        const status = error && error.response && error.response.status;
        const detail = status === 400
            ? safeText('profile.addressFormErrorDetail', 'Lütfen tüm zorunlu alanları kontrol edin.')
            : safeText(fallbackDetailKey, fallbackDetailText);
        showMessage(
            safeText('profile.addressFormErrorTitle', 'Adres kaydedilemedi'),
            detail,
            toastCenter,
            'warn'
        );
    };

    const handleDeleteAddress = (addressId) => {
        deleteAddressMutation.mutate(addressId, {
            onError: (error) => handleAddressMutationError(
                error,
                'profile.addressDeleteErrorDetail',
                'Adres silinemedi. Lütfen daha sonra tekrar deneyin.'
            ),
        });
    };

    const handleSetDefaultAddress = (address) => {
        // Backend's PUT is intentionally full-replace, so we build a body from the existing
        // AddressView and flip just the isDefault flag. The server clears any previous
        // default in the same transaction — we don't have to.
        updateAddressMutation.mutate(
            {id: address.id, body: buildSetDefaultBody(address)},
            {
                onError: (error) => handleAddressMutationError(
                    error,
                    'profile.addressSetDefaultErrorDetail',
                    'Varsayılan adres güncellenemedi.'
                ),
            }
        );
    };

    const handleAddressSave = () => {
        // Mirror the backend's @NotBlank checks: title / fullName / phone / country / city /
        // district / addressLine are required. neighborhood and postalCode are optional.
        const requiredMissing = !addressForm.title.trim()
            || !addressForm.fullName.trim()
            || !addressForm.phone.trim()
            || !addressForm.country.trim()
            || !addressForm.city.trim()
            || !addressForm.district.trim()
            || !addressForm.addressLine.trim();
        if (requiredMissing) {
            showMessage(t('profile.addressFormErrorTitle'), t('profile.addressFormErrorDetail'), toastCenter, 'warn');
            return;
        }

        if (!ADDRESS_PHONE_REGEX.test(addressForm.phone.trim())) {
            showMessage(
                safeText('profile.addressFormErrorTitle', 'Adres kaydedilemedi'),
                safeText('profile.addressPhoneInvalidDetail', 'Telefon numarası rakam, boşluk, parantez, tire veya + içerebilir (6-30 karakter).'),
                toastCenter,
                'warn'
            );
            return;
        }

        // Trimming mirrors what AddressService does on the server, but we trim here too so the
        // optimistic body sent over the wire matches what gets stored. neighborhood and
        // postalCode get null when blank, matching the server's trimToNull.
        const trimOrNull = (value) => {
            const trimmed = String(value || '').trim();
            return trimmed.length === 0 ? '' : trimmed;
        };

        // Newly-created addresses default to isDefault=true when this is the first address;
        // edits preserve whatever the row already had unless the user explicitly changed it.
        const editedAddress = editingAddressId
            ? addresses.find((item) => item.id === editingAddressId)
            : null;
        const isFirstAddress = addresses.length === 0;
        const isDefaultFlag = editedAddress
            ? Boolean(editedAddress.isDefault)
            : isFirstAddress;

        const body = {
            title: addressForm.title.trim(),
            fullName: addressForm.fullName.trim(),
            phone: addressForm.phone.trim(),
            country: addressForm.country.trim(),
            city: addressForm.city.trim(),
            district: addressForm.district.trim(),
            neighborhood: trimOrNull(addressForm.neighborhood),
            addressLine: addressForm.addressLine.trim(),
            postalCode: trimOrNull(addressForm.postalCode),
            isDefault: isDefaultFlag,
        };

        const onSuccess = () => clearAddressForm();
        const onError = (error) => handleAddressMutationError(
            error,
            'profile.addressSaveErrorDetail',
            'Adres kaydedilemedi. Lütfen daha sonra tekrar deneyin.'
        );

        if (editingAddressId) {
            updateAddressMutation.mutate({id: editingAddressId, body}, {onSuccess, onError});
        } else {
            createAddressMutation.mutate(body, {onSuccess, onError});
        }
    };

    const isAddressBusy = createAddressMutation.isLoading
        || updateAddressMutation.isLoading
        || deleteAddressMutation.isLoading;

    const renderAddressSection = () => {
        return (
            <>
                <div className="process-row">
                    <div className="process-header-item">{t('profile.sectionTitleAddress')}</div>
                    <div className="address-toolbar">
                        <p>{t('profile.sectionSubtitleAddress')}</p>
                        <Button
                            className="address-add-btn"
                            icon="pi pi-plus"
                            label={t('profile.addAddress')}
                            onClick={handleOpenNewAddressForm}
                            disabled={isAddressBusy}
                        />
                    </div>
                </div>

                <div className="process-row">
                    {addressesLoading ? (
                        <div className="address-empty-state">
                            {safeText('profile.addressLoading', 'Adresleriniz yükleniyor...')}
                        </div>
                    ) : addressesError ? (
                        <div className="address-empty-state">
                            {safeText('profile.addressLoadError', 'Adresler yüklenemedi. Lütfen sayfayı yenileyin.')}
                        </div>
                    ) : addresses.length === 0 ? (
                        <div className="address-empty-state">{t('profile.addressEmpty')}</div>
                    ) : (
                        <div className="address-grid">
                            {addresses.map((address) => (
                                <div key={address.id} className={`address-card ${address.isDefault ? 'is-default' : ''}`}>
                                    <div className="address-card-top">
                                        <div className="address-card-title-group">
                                            <div className="address-card-title-line">
                                                <h4>{(address.title || '').trim() || safeText('profile.addressCardFallbackTitle', 'Teslimat Adresim')}</h4>
                                            </div>
                                        </div>
                                        {address.isDefault ? <div className="address-default-tag">{t('profile.defaultAddress')}</div> : null}
                                    </div>

                                    <div className="address-card-content">
                                        <strong>{address.fullName}</strong>
                                        <span>{address.phone}</span>
                                        <span>{[address.neighborhood, address.district, address.city].filter(Boolean).join(' / ')}</span>
                                        <p>{address.addressLine}</p>
                                        <span>{[address.postalCode, address.country].filter(Boolean).join(' • ')}</span>
                                    </div>

                                    <div className="address-card-actions">
                                        {!address.isDefault ? (
                                            <button
                                                type="button"
                                                onClick={() => handleSetDefaultAddress(address)}
                                                disabled={isAddressBusy}
                                            >
                                                {t('profile.setDefault')}
                                            </button>
                                        ) : <span className="address-action-placeholder"/>}
                                        <button
                                            type="button"
                                            onClick={() => handleEditAddress(address)}
                                            disabled={isAddressBusy}
                                        >
                                            {t('profile.editAddress')}
                                        </button>
                                        <button
                                            type="button"
                                            className="is-danger"
                                            onClick={() => handleDeleteAddress(address.id)}
                                            disabled={isAddressBusy}
                                        >
                                            {t('profile.deleteAddress')}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {showAddressForm ? (
                    <div className="process-row">
                        <div className="address-form-panel">
                            <h3>{editingAddressId ? t('profile.editAddressTitle') : t('profile.newAddressTitle')}</h3>

                            <div className="address-form-grid">
                                <div className="address-form-field">
                                    <label>{t('profile.addressTitle')}</label>
                                    <InputText value={addressForm.title} onChange={(e) => handleAddressFieldChange('title', e.target.value)} maxLength={60}/>
                                </div>
                                <div className="address-form-field">
                                    <label>{t('profile.nameSurname')}</label>
                                    <InputText value={addressForm.fullName} onChange={(e) => handleAddressFieldChange('fullName', e.target.value)} maxLength={120}/>
                                </div>

                                <div className="address-form-field">
                                    <label>{t('profile.phone')}</label>
                                    <InputMask
                                        mask="0(999)-999-99-99"
                                        placeholder="0(5__) ___ __ __"
                                        keyfilter="int"
                                        value={addressForm.phone}
                                        onChange={(e) => handleAddressFieldChange('phone', e.target.value)}
                                    />
                                </div>
                                <div className="address-form-field">
                                    <label>{safeText('profile.country', 'Ülke')}</label>
                                    <InputText value={addressForm.country} onChange={(e) => handleAddressFieldChange('country', e.target.value)} maxLength={60}/>
                                </div>

                                <div className="address-form-field">
                                    <label>{t('profile.city')}</label>
                                    <InputText value={addressForm.city} onChange={(e) => handleAddressFieldChange('city', e.target.value)} maxLength={60}/>
                                </div>
                                <div className="address-form-field">
                                    <label>{t('profile.district')}</label>
                                    <InputText value={addressForm.district} onChange={(e) => handleAddressFieldChange('district', e.target.value)} maxLength={60}/>
                                </div>

                                <div className="address-form-field">
                                    <label>{safeText('profile.neighborhood', 'Mahalle (opsiyonel)')}</label>
                                    <InputText value={addressForm.neighborhood} onChange={(e) => handleAddressFieldChange('neighborhood', e.target.value)} maxLength={80}/>
                                </div>
                                <div className="address-form-field">
                                    <label>{safeText('profile.postalCode', 'Posta Kodu (opsiyonel)')}</label>
                                    <InputText value={addressForm.postalCode} onChange={(e) => handleAddressFieldChange('postalCode', e.target.value)} maxLength={20}/>
                                </div>
                            </div>

                            <div className="address-form-field">
                                <label>{safeText('profile.addressLineLabel', 'Açık Adres')}</label>
                                <InputTextarea
                                    autoResize
                                    rows={4}
                                    value={addressForm.addressLine}
                                    onChange={(e) => handleAddressFieldChange('addressLine', e.target.value)}
                                    maxLength={500}
                                />
                            </div>

                            <div className="address-form-actions">
                                <Button label={t('profile.cancel')} className="p-button-text" onClick={clearAddressForm} disabled={isAddressBusy}/>
                                <Button label={t('profile.saveAddress')} onClick={handleAddressSave} disabled={isAddressBusy} loading={isAddressBusy}/>
                            </div>
                        </div>
                    </div>
                ) : null}
            </>
        );
    };

    const renderOrdersSection = () => {
        return (
            <div className="process-row">
                <div className="process-header-item">{t('profile.sectionTitleOrders')}</div>
                {orderHistory.length === 0 ? (
                    <div className="profile-placeholder-panel">
                        <p>{safeText('profile.noOrdersText', 'Henüz sipariş bulunmuyor.')}</p>
                    </div>
                ) : (
                    <div className="profile-order-list">
                        {orderHistory.map((order) => (
                            <div key={order.id} className="profile-order-card">
                                <div className="profile-order-head">
                                    <strong>#{order.id}</strong>
                                    <span>{new Date(order.createdAt).toLocaleDateString('tr-TR')}</span>
                                </div>
                                <div className="profile-order-items">
                                    {(order.items || []).slice(0, 3).map((item) => (
                                        <div key={`${order.id}-${item.id}`} className="profile-order-item">
                                            <img src={item.img} alt={item.title}/>
                                            <div>
                                                <strong>{item.mark}</strong>
                                                <span>{item.title}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="profile-order-foot">
                                    <span>{safeText('profile.orderTotal', 'Toplam')}</span>
                                    <strong>{Number(order?.summary?.total || 0).toLocaleString('tr-TR', {minimumFractionDigits: 2, maximumFractionDigits: 2})} TL</strong>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    const renderViewedSection = () => {
        return (
            <div className="process-row">
                <div className="process-header-item">{t('profile.sectionTitleHistory')}</div>
                {viewedProducts.length === 0 ? (
                    <div className="profile-placeholder-panel">
                        <p>{safeText('profile.noViewedText', 'Henüz incelediğiniz ürün bulunmuyor.')}</p>
                    </div>
                ) : (
                    <div className="profile-viewed-grid">
                        {viewedProducts.slice(0, 16).map((item) => (
                            <a key={item.id} href={`/detail/${item.routeId || item.productCode || item.id}`} className="profile-viewed-card">
                                <img src={item.img} alt={item.title}/>
                                <strong>{item.mark}</strong>
                                <span>{item.title}</span>
                            </a>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    const onChangeSection = (sectionKey) => {
        setActiveSection(sectionKey);
        history.replace(`${location.pathname}?section=${sectionKey}`);
    };

    return (

        <div className={`catalog ${isMobile ? 'my-account-mobile-mode' : ''}`}>
            <div className="container-items">
                <Toast ref={toastCenter} position="center"/>
                <div className="my-account-page">
                    <ProfileNavigation
                        userFullName={fullName}
                        activeSection={activeSection}
                        onChangeSection={onChangeSection}
                        compact={compactProfileNav}
                    />

                    <div className="process-column">
                        {activeSection === 'user-info' && renderUserInfoSection()}
                        {activeSection === 'body-info' && renderBodyInfoSection()}
                        {activeSection === 'address' && renderAddressSection()}
                        {activeSection === 'orders' && renderOrdersSection()}
                        {activeSection === 'history' && renderViewedSection()}
                        {!['user-info', 'body-info', 'address', 'orders', 'history'].includes(activeSection) && renderPlaceholderSection()}
                    </div>
                </div>
            </div>

            {phoneOtpModalOpen && (
                <div className="bank-demo-modal-backdrop" onClick={() => setPhoneOtpModalOpen(false)}>
                    <div className="bank-demo-modal phone-otp-modal" onClick={(event) => event.stopPropagation()}>
                        <div className="bank-demo-head">
                            <h3>{safeText('profile.phoneOtpTitle', 'SMS Doğrulama')}</h3>
                            <button type="button" onClick={() => setPhoneOtpModalOpen(false)}>
                                {safeText('common.close', 'Kapat')}
                            </button>
                        </div>

                        <div className="bank-demo-content">
                            <div className="bank-demo-info">
                                {safeText('profile.phoneOtpInfo', 'Numaranızı doğrulamak için telefonunuza SMS kodu gönderildi.')}
                            </div>
                            <div className="bank-demo-row">
                                <span>{safeText('profile.newPhone', 'Yeni Telefon')}</span>
                                <strong>{newPhoneNumber || '-'}</strong>
                            </div>
                            <div className="bank-demo-row">
                                <span>{safeText('profile.phoneOtpDemoCode', 'Demo SMS Kodu')}</span>
                                <strong>{PHONE_OTP_DEMO_CODE}</strong>
                            </div>

                            <div className="bank-otp-area">
                                <label htmlFor="phone-otp-input">{safeText('profile.phoneOtpCode', 'SMS Kodu')}</label>
                                <input
                                    id="phone-otp-input"
                                    type="text"
                                    value={phoneOtpCode}
                                    onChange={(event) => setPhoneOtpCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                                    placeholder={safeText('profile.phoneOtpPlaceholder', '6 haneli kod')}
                                />
                                {phoneOtpError && <div className="bank-otp-error">{phoneOtpError}</div>}
                            </div>
                        </div>

                        <div className="bank-demo-actions">
                            <button type="button" className="cancel" onClick={() => setPhoneOtpModalOpen(false)}>
                                {safeText('profile.cancel', 'Vazgeç')}
                            </button>
                            <button
                                type="button"
                                className="approve"
                                onClick={handleApprovePhoneOtp}
                                disabled={phoneOtpCode.length !== 6 || updateProfileMutation.isLoading}
                            >
                                {updateProfileMutation.isLoading
                                    ? safeText('profile.phoneOtpApproving', 'Kaydediliyor...')
                                    : safeText('profile.phoneOtpApprove', 'Onayla')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
export default MyUserInfo;
