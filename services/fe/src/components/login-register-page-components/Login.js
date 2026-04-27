import React, {useContext, useState} from 'react';
import {InputText} from "primereact/inputtext";
import {Button} from "primereact/button";
import AuthService from "../../service/AuthService";
import {useHistory, useLocation} from "react-router-dom";
import {Password} from 'primereact/password';
import {USE_DEMO_LOCAL_AUTH} from "../../constants/UrlConstans";
import DemoAuthService from "../../service/DemoAuthService";
import AppContext from "../../AppContext";

export const Login = ({
    presetEmail = "",
    lockEmail = false,
    onUseDifferentEmail,
    showSocialActions = true,
    defaultRedirectTarget = '/'
}) => {
    const {t = (key) => key} = useContext(AppContext) || {};
    const history = useHistory();
    const location = useLocation();

    const [username, setUsername] = useState(presetEmail);
    const [password, setPassword] = useState("");

    const [wrongAccountInfo, setWrongAccountInfo] = useState(false);
    const [labelMessage, setLabelMessage] = useState("");

    const redirectTarget = new URLSearchParams(location.search).get('redirect') || defaultRedirectTarget;

    const loginButtonOnClick = async () => {
        if (checkValidation()) {
            if (USE_DEMO_LOCAL_AUTH) {
                try {
                    const response = DemoAuthService.login(username, password);
                    localStorage.setItem("token", response.token);
                    localStorage.setItem("user", JSON.stringify(response.user));
                    history.push(redirectTarget)
                    window.location.reload();
                } catch (error) {
                    setWrongAccountInfo(true);
                    setLabelMessage(error?.message || t('login.invalidCreds'))
                }
                return;
            }

            AuthService.login(username, password).then((response) => {
                localStorage.setItem("token", response.data.returnData[0].accessTokenResponse.access_token);
                localStorage.setItem("user", JSON.stringify(response.data.returnData[0].user));
                history.push(redirectTarget)
                window.location.reload();
            }).catch(() => {
                setWrongAccountInfo(true);
                setLabelMessage(t('login.invalidCreds'))
            })
        }
    }

    const checkValidation = () => {
        if (username === "" || password === "") {
            setWrongAccountInfo(true);
            if (username === "") {
                setLabelMessage(t('login.invalidEmail'))
            } else if (password === "") {
                setLabelMessage(t('login.invalidPassword'))
            }
            return false;
        } else {
            return true;
        }
    }

    const failLoginMessageLabel = () => {
        if (wrongAccountInfo) {
            return (
                <div className="fail-login-message-item">
                    <i className="pi pi-exclamation-circle"/>
                    <label>{labelMessage}</label>
                </div>
            )
        }
    }

    const forgetPasswordClick = () => {

    }


    return (
        <div className="login">
            {failLoginMessageLabel()}

            {lockEmail ? (
                <div className="login-item login-identity-card">
                    <span className="login-identity-label">{t('loginPage.emailStepLabel')}</span>
                    <div className="login-identity-row">
                        <strong>{username}</strong>
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
            ) : (
                <div className="login-item">
                    <label>{t('login.email')}</label>
                    <InputText placeholder={t('login.emailPlaceholder')}
                               value={username} type="text"
                               onChange={(e) => {
                                   setUsername(e.target.value)
                                   setWrongAccountInfo(false);
                               }}
                    />
                </div>
            )}

            <div className="login-item">
                <label>{t('login.password')}</label>
                <Password placeholder={t('login.passwordPlaceholder')}
                          feedback={false}
                          value={password}
                          toggleMask
                          style={{width: '100%', fontSize: '1px'}}
                          onChange={(e) => {
                              setPassword(e.target.value)
                              setWrongAccountInfo(false);
                          }}
                />
            </div>

            <div className="login-item">
                <div className="forget-password">
                    <Button className="login-forgot-button" onClick={forgetPasswordClick}>{t('login.forgot')}</Button>
                </div>
            </div>

            <div className="login-item">
                <Button className="login-submit-button" label={t('login.submit')} onClick={loginButtonOnClick}/>
            </div>

            {showSocialActions ? (
                <div className="login-item social-login-section">
                    <div className="social-login-divider">
                        <span>{t('login.or')}</span>
                    </div>

                    <div className="social-login-actions">
                        <Button
                            type="button"
                            className="social-login-button social-facebook"
                        >
                            <span className="social-facebook-icon pi pi-facebook" aria-hidden="true"/>
                            <span className="social-label">{t('login.facebook')}</span>
                        </Button>
                        <Button
                            type="button"
                            className="social-login-button social-google"
                        >
                            <img
                                className="social-google-icon"
                                src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                                alt=""
                                aria-hidden="true"
                            />
                            <span className="social-label">{t('login.google')}</span>
                        </Button>
                    </div>
                </div>
            ) : null}
        </div>

    );
}
