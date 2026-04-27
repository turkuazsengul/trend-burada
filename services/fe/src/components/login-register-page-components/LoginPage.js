import React, {useContext, useState} from 'react';
import {InputText} from "primereact/inputtext";
import {Button} from "primereact/button";
import validator from "validator";
import {Register} from "./Register";
import {Login} from "./Login";
import '../../css/loader.css'
import AppContext from "../../AppContext";
import AuthService from "../../service/AuthService";
import {USE_DEMO_LOCAL_AUTH} from "../../constants/UrlConstans";
import DemoAuthService from "../../service/DemoAuthService";

export const LoginPage = () => {
    const {t = (key) => key} = useContext(AppContext) || {};

    const [step, setStep] = useState("email");
    const [email, setEmail] = useState("");
    const [infoMessage, setInfoMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [checkingAccount, setCheckingAccount] = useState(false);

    const resolveAccountStatus = async () => {
        const normalizedEmail = String(email || "").trim().toLowerCase();

        if (!normalizedEmail || !validator.isEmail(normalizedEmail)) {
            setErrorMessage(t('loginPage.invalidEmail'));
            setInfoMessage("");
            return;
        }

        setCheckingAccount(true);
        setErrorMessage("");
        setInfoMessage("");

        try {
            const accountStatus = USE_DEMO_LOCAL_AUTH
                ? DemoAuthService.lookupAccountStatus(normalizedEmail)
                : await AuthService.lookupAccountStatus(normalizedEmail);

            if (accountStatus?.exists) {
                setStep("login");
                setInfoMessage(accountStatus?.emailVerified === false ? t('loginPage.unverifiedInfo') : "");
            } else {
                setStep("register");
                setInfoMessage(t('loginPage.registerHint'));
            }
        } catch (error) {
            setErrorMessage(t('loginPage.genericError'));
        } finally {
            setCheckingAccount(false);
        }
    };

    const resetFlow = () => {
        setStep("email");
        setInfoMessage("");
        setErrorMessage("");
    };

    const emailStepView = () => {
        return (
            <div className="login email-entry-flow">
                {renderAlerts()}

                <div className="login-item email-entry-intro">
                    <div className="email-entry-card">
                        <span className="email-entry-badge">{t('loginPage.emailStepBadge')}</span>
                        <h2>{t('loginPage.emailStepTitle')}</h2>
                        <p>{t('loginPage.emailStepSubtitle')}</p>
                    </div>
                </div>

                <div className="login-item">
                    <label>{t('login.email')}</label>
                    <InputText
                        placeholder={t('login.emailPlaceholder')}
                        value={email}
                        type="text"
                        onChange={(e) => {
                            setEmail(e.target.value);
                            setErrorMessage("");
                        }}
                    />
                </div>

                <div className="login-item">
                    <Button
                        className="login-submit-button"
                        label={t('loginPage.continue')}
                        loading={checkingAccount}
                        onClick={resolveAccountStatus}
                    />
                </div>

                <div className="login-item email-entry-note">
                    <p>{t('loginPage.emailStepFootnote')}</p>
                </div>
            </div>
        );
    };

    const stepMeta = {
        email: {
            eyebrow: t('loginPage.emailStepEyebrow'),
            title: t('loginPage.title'),
            subtitle: t('loginPage.subtitle')
        },
        login: {
            eyebrow: t('loginPage.loginTab'),
            title: t('loginPage.returningTitle'),
            subtitle: t('loginPage.returningSubtitle')
        },
        register: {
            eyebrow: t('loginPage.registerTab'),
            title: t('loginPage.newAccountTitle'),
            subtitle: t('loginPage.newAccountSubtitle')
        }
    };

    const currentMeta = stepMeta[step];

    const renderAlerts = () => {
        return (
            <>
                {errorMessage ? (
                    <div className="fail-login-message-item">
                        <i className="pi pi-exclamation-circle"/>
                        <label>{errorMessage}</label>
                    </div>
                ) : null}

                {infoMessage ? (
                    <div className="success-login-message-item">
                        <i className="pi pi-check-circle"/>
                        <label>{infoMessage}</label>
                    </div>
                ) : null}
            </>
        );
    };

    return (
        <div className="catalog login-page-shell">
            <div className="container-items">
                <div className="login-card-wrap">
                    <div className="login-page-headline">
                        <span className="login-page-eyebrow">{currentMeta.eyebrow}</span>
                        <h1>{currentMeta.title}</h1>
                        <p>{currentMeta.subtitle}</p>
                    </div>

                    <div className="login-card-panel login-card-panel-single">
                        {step === "email" ? emailStepView() : null}
                        {step === "login" ? (
                            <>
                                {renderAlerts()}
                                <Login
                                    presetEmail={email}
                                    lockEmail
                                    onUseDifferentEmail={resetFlow}
                                    showSocialActions={false}
                                />
                            </>
                        ) : null}
                        {step === "register" ? (
                            <>
                                {renderAlerts()}
                                <Register
                                    presetEmail={email}
                                    lockEmail
                                    onUseDifferentEmail={resetFlow}
                                    showSocialActions={false}
                                />
                            </>
                        ) : null}
                    </div>
                </div>
            </div>
        </div>
    );
}
