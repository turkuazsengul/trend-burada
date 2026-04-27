import React, {useContext, useState} from 'react';
import {InputText} from "primereact/inputtext";
import {Button} from "primereact/button";
import validator from 'validator'
import RegisterService from "../../service/RegisterService";
import {Dialog} from "primereact/dialog";
import {Password} from "primereact/password";
import {Divider} from 'primereact/divider';
import {Confirm} from "./RegisterConfirm";
import AppContext from "../../AppContext";
import {USE_DEMO_LOCAL_AUTH} from "../../constants/UrlConstans";
import DemoAuthService from "../../service/DemoAuthService";

export const Register = ({
    presetEmail = "",
    lockEmail = false,
    onUseDifferentEmail,
    showSocialActions = true
}) => {
    const myContext = useContext(AppContext)
    const t = myContext?.t || ((key) => key);

    const [modalVisible, setModalVisible] = useState(false);
    const [createdUserId, setCreatedUserId] = useState(0);
    const [loading, setLoading] = useState(false);

    const [mail, setMail] = useState(presetEmail);
    const [pass, setPass] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");

    const [wrongAccountInfo, setWrongAccountInfo] = useState(false);
    const [labelMessage, setLabelMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    const getErrorMessage = (response) => {
        return response?.data?.detail?.exceptionDetailMessage || t('register.genericError');
    }

    const registerButtonClick = () => {
        const request = {
            enabled: true,
            username: mail,
            emailVerified: false,
            firstName: firstName,
            lastName: lastName,
            email: mail,
            credentials: [
                {
                    type: "password",
                    value: pass,
                    temporary: false
                }
            ],
            access: {
                manageGroupMembership: true,
                view: true,
                mapRoles: true,
                impersonate: true,
                manage: true
            },
            realmRoles: ["USER"]
        }

        if (checkValidation()) {
            if (USE_DEMO_LOCAL_AUTH) {
                const response = DemoAuthService.register({
                    firstName,
                    lastName,
                    email: mail,
                    password: pass
                });

                if (response.success) {
                    setWrongAccountInfo(false);
                    setSuccessMessage("");
                    setLabelMessage("");
                    setCreatedUserId(response.user?.id || 0);
                    setModalVisible(true);
                } else {
                    setWrongAccountInfo(true);
                    setSuccessMessage("");
                    setLabelMessage(response.message || t('register.genericError'));
                }
                return;
            }

            setLoading(true);
            RegisterService.register(request).then(response => {
                if (response !== 11 && response.data) {
                    if (response.data.returnCode === 99) {
                        setCreatedUserId(response.data.returnData[0].pkId);
                        setWrongAccountInfo(false);
                        setSuccessMessage("");
                        setLabelMessage("");
                        setModalVisible(true)
                    } else {
                        setWrongAccountInfo(true);
                        setSuccessMessage("");
                        setLabelMessage(getErrorMessage(response))
                    }
                } else {
                    setWrongAccountInfo(true);
                    setSuccessMessage("");
                    setLabelMessage(t('register.genericError'))
                }

                setLoading(false);
            }, (error) => {
                setWrongAccountInfo(true);
                setSuccessMessage("");
                setLabelMessage(getErrorMessage(error.response))
                setLoading(false);
            })
        }
    }

    const checkValidation = () => {
        if (mail === "" || firstName === "" || lastName === "" || pass === "") {
            setWrongAccountInfo(true);
            setSuccessMessage("");
            if (firstName === "") {
                setLabelMessage(t('register.invalidName'))
            } else if (lastName === "") {
                setLabelMessage(t('register.invalidSurname'))
            } else if (mail === "") {
                setLabelMessage(t('register.invalidEmail'))
            } else if (pass === "") {
                setLabelMessage(t('register.invalidPassword'))
            }
            return false;
        } else {
            if (!validator.isEmail(mail)) {
                setWrongAccountInfo(true);
                setSuccessMessage("");
                setLabelMessage(t('register.invalidEmail'))
                return false;
            } else if (!validator.isStrongPassword(pass, {minLength: 7, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 1})) {
                setWrongAccountInfo(true);
                setSuccessMessage("");
                setLabelMessage(t('register.weakPassword'))
                return false;
            } else {
                setWrongAccountInfo(false);
                setLabelMessage("");
                return true;
            }
        }
    }

    const ModalTemp = () => {
        if (modalVisible) {
            return (
                <div className="base-dialog">
                    <Dialog className="p-dialog-titlebar-close" header={"Hesap Onay"} visible={modalVisible} onHide={onHide}>
                        <Confirm UserId={createdUserId}/>
                    </Dialog>
                </div>
            )
        }

    }

    const failRegisterMessageLabel = () => {
        if (wrongAccountInfo) {
            return (
                <div className="fail-login-message-item">
                    <i className="pi pi-exclamation-circle"/>
                    <label>{labelMessage}</label>
                </div>
            )
        }
    }

    const successRegisterMessageLabel = () => {
        if (successMessage) {
            return (
                <div className="success-login-message-item">
                    <i className="pi pi-check-circle"/>
                    <label>{successMessage}</label>
                </div>
            );
        }
    };

    const onHide = () => {
        setModalVisible(false)
        if (myContext.timer) {
            clearInterval(myContext.timer);
        }
    }

    const header = <h6>{t('register.password')}</h6>;
    const footer = (
        <React.Fragment>
            <Divider/>
            <p className="mt-2">{t('common.suggestions')}</p>
            <ul className="pl-2 ml-2 mt-0" style={{lineHeight: '1.5'}}>
                <li>{t('common.passwordRuleLower')}</li>
                <li>{t('common.passwordRuleUpper')}</li>
                <li>{t('common.passwordRuleNumeric')}</li>
                <li>{t('common.passwordRuleMin')}</li>
            </ul>
        </React.Fragment>
    );

    return (
        <div>
            <div className="login register-form">
                {failRegisterMessageLabel()}
                {successRegisterMessageLabel()}

                <div className="login-item register-intro-item">
                    <div className="register-intro-card">
                        <div className="register-intro-copy">
                            <span className="register-intro-badge">{t('register.introBadge')}</span>
                            <h3>{t('register.introTitle')}</h3>
                            <p>{t('register.introSubtitle')}</p>
                        </div>

                        <div className="register-benefit-list">
                            <div className="register-benefit-chip">{t('register.benefitOrders')}</div>
                            <div className="register-benefit-chip">{t('register.benefitFavorites')}</div>
                            <div className="register-benefit-chip">{t('register.benefitCampaigns')}</div>
                        </div>
                    </div>
                </div>

                {lockEmail ? (
                    <div className="login-item login-identity-card">
                        <span className="login-identity-label">{t('loginPage.emailStepLabel')}</span>
                        <div className="login-identity-row">
                            <strong>{mail}</strong>
                            {onUseDifferentEmail ? (
                                <Button
                                    type="button"
                                    className="login-change-email-button"
                                    label={t('loginPage.changeEmail')}
                                    onClick={onUseDifferentEmail}
                                />
                            ) : null}
                        </div>
                    </div>
                ) : null}

                <div className="login-item register-form-grid">
                    <div className="register-field-card">
                        <label>{t('register.name')}</label>
                        <InputText
                            placeholder={t('register.name')}
                            value={firstName}
                            type="text"
                            onChange={(e) => {
                                setFirstName(e.target.value)
                                setWrongAccountInfo(false);
                            }}
                        />
                    </div>

                    <div className="register-field-card">
                        <label>{t('register.surname')}</label>
                        <InputText
                            placeholder={t('register.surname')}
                            value={lastName}
                            type="text"
                            onChange={(e) => {
                                setLastName(e.target.value)
                                setWrongAccountInfo(false);
                            }}
                        />
                    </div>
                </div>

                {!lockEmail ? (
                    <div className="login-item register-field-card register-field-card-wide">
                        <label>{t('register.email')}</label>
                        <InputText
                            placeholder={t('login.emailPlaceholder')}
                            value={mail}
                            type="text"
                            onChange={(e) => {
                                setMail(e.target.value)
                                setWrongAccountInfo(false);
                            }}
                        />
                    </div>
                ) : null}

                <div className="login-item register-password-block">
                    <div className="register-field-card register-field-card-wide">
                        <label>{t('register.password')}</label>
                        <Password placeholder={t('login.passwordPlaceholder')}
                                  header={header} footer={footer}
                                  value={pass}
                                  toggleMask
                                  style={{width: '100%', fontSize: '1px'}}
                                  onChange={(e) => {
                                      setPass(e.target.value)
                                      setWrongAccountInfo(false);
                                  }}
                        />
                    </div>

                    <div className="register-password-note">
                        <span className="register-password-note-title">{t('register.passwordGuideTitle')}</span>
                        <span className="password-validate-message">{t('register.passwordHint')}</span>
                    </div>
                </div>

                <div className="login-item">
                    <Button className="login-submit-button" label={t('register.submit')} onClick={registerButtonClick} loading={loading}/>
                </div>

                <div className="login-item register-policy-item">
                    <p className="register-policy-note">{t('register.policyNote')}</p>
                </div>

                {showSocialActions ? (
                    <div className="login-item social-login-section">
                        <div className="social-login-divider">
                            <span>{t('register.or')}</span>
                        </div>

                        <div className="social-login-actions">
                            <Button type="button" className="social-login-button social-facebook">
                                <span className="social-facebook-icon pi pi-facebook" aria-hidden="true"/>
                                <span className="social-label">{t('register.facebook')}</span>
                            </Button>
                            <Button type="button" className="social-login-button social-google">
                                <img
                                    className="social-google-icon"
                                    src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                                    alt=""
                                    aria-hidden="true"
                                />
                                <span className="social-label">{t('register.google')}</span>
                            </Button>
                        </div>
                    </div>
                ) : null}
            </div>

            {ModalTemp()}

        </div>


    );
}
