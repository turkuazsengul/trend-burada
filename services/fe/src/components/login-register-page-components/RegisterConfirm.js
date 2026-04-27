import React, {useContext, useState} from 'react';
import {InputText} from "primereact/inputtext";
import {Button} from "primereact/button";
import RegisterService from "../../service/RegisterService";
import AppContext from "../../AppContext";
import {useHistory} from "react-router-dom";
import {USE_DEMO_LOCAL_AUTH} from "../../constants/UrlConstans";
import DemoAuthService from "../../service/DemoAuthService";

export const Confirm = ({UserId: userId}) => {
    const history = useHistory();
    const myContext = useContext(AppContext)
    const t = myContext?.t || ((key) => key);

    const [confirmValue, setConfirmValue] = useState("");
    const [wrongAccountInfo, setWrongAccountInfo] = useState(false);
    const [labelMessage, setLabelMessage] = useState("");
    const [disableConfirm, setDisableConfirm] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);
    const [confirmLoading, setConfirmLoading] = useState(false);
    const [demoVerificationCode, setDemoVerificationCode] = useState(() => {
        return USE_DEMO_LOCAL_AUTH ? DemoAuthService.getVerificationDetails(userId)?.verificationCode || "" : "";
    });

    const getErrorMessage = (response, fallbackMessage) => {
        return response?.data?.detail?.exceptionDetailMessage || fallbackMessage;
    }

    const confirmButtonClick = () => {
        if (!userId) {
            setWrongAccountInfo(true);
            setLabelMessage("Onay için kullanıcı bilgisi bulunamadı.");
            return;
        }

        if (!confirmValue.trim()) {
            setWrongAccountInfo(true);
            setLabelMessage("Lütfen e-posta doğrulama kodunu giriniz.");
            return;
        }

        if (USE_DEMO_LOCAL_AUTH) {
            const response = DemoAuthService.confirm(userId, confirmValue.trim());

            if (response.success) {
                setWrongAccountInfo(false);
                setLabelMessage(response.message);
                history.push("/login");
                window.location.reload();
            } else {
                setWrongAccountInfo(true);
                setLabelMessage(response.message || t('register.genericError'));
            }
            return;
        }

        setConfirmLoading(true);
        RegisterService.confirm(userId, confirmValue.trim()).then(response => {
            if (response !== 11 && response.data) {
                if (response.data.returnCode === 99) {
                    setWrongAccountInfo(false);
                    history.push("/login");
                    window.location.reload();
                } else {
                    setLabelMessage(getErrorMessage(response, t('register.genericError')));
                    setWrongAccountInfo(true);
                }
            } else {
                setLabelMessage(t('register.genericError'));
                setWrongAccountInfo(true);
            }

            setConfirmLoading(false);
        }, (error) => {
            setWrongAccountInfo(true);
            setLabelMessage(getErrorMessage(error.response, t('register.genericError')));
            setConfirmLoading(false);
        })
    }

    const createConfirmClick = () => {
        if (!userId) {
            setWrongAccountInfo(true);
            setLabelMessage("Doğrulama kodu gönderilemedi.");
            return;
        }

        if (USE_DEMO_LOCAL_AUTH) {
            const response = DemoAuthService.createConfirm(userId);

            if (response.success) {
                setWrongAccountInfo(false);
                setLabelMessage(response.message || "Doğrulama kodu tekrar gönderildi.");
                setDisableConfirm(false);
                setDemoVerificationCode(response.verificationCode || "");
            } else {
                setWrongAccountInfo(true);
                setLabelMessage(response.message || t('register.genericError'));
            }
            return;
        }

        setResendLoading(true);
        RegisterService.createConfirm(userId).then(response => {
            if (response !== 11 && response.data) {
                if (response.data.returnCode === 99) {
                    setWrongAccountInfo(false);
                    setLabelMessage("Doğrulama kodu tekrar gönderildi.");
                    setDisableConfirm(false);
                } else {
                    setLabelMessage(getErrorMessage(response, t('register.genericError')));
                    setWrongAccountInfo(true);
                }
            } else {
                setLabelMessage(t('register.genericError'));
                setWrongAccountInfo(true);
            }

            setResendLoading(false);
        }, (error) => {
            setWrongAccountInfo(true);
            setLabelMessage(getErrorMessage(error.response, t('register.genericError')));
            setResendLoading(false);
        })
    }

    const confirmMessageCard = () => {
        if (wrongAccountInfo || labelMessage) {
            return (
                <div className={`register-confirm-alert ${wrongAccountInfo ? 'is-error' : 'is-success'}`}>
                    <i className={`pi ${wrongAccountInfo ? 'pi-exclamation-circle' : 'pi-check-circle'}`}/>
                    <label>{labelMessage}</label>
                </div>
            )
        }
    }

    return (
        <div className="register-confirm">
            <div className="register-confirm-hero">
                <div className="register-confirm-icon-wrap">
                    <i className="pi pi-envelope register-confirm-icon"/>
                </div>

                <div className="register-confirm-copy">
                    <span className="register-confirm-badge">E-Posta Onayı</span>
                    <h3>Hesabınız neredeyse hazır</h3>
                    <p>Kayıt işlemini tamamlamak için e-posta adresinize gönderilen doğrulama kodunu girin.</p>
                </div>
            </div>

            <div className="register-confirm-panel">
                <div className="register-confirm-info-row">
                    <div className="register-confirm-info-card">
                        <span className="register-confirm-info-label">Adım</span>
                        <strong>1 / 1</strong>
                    </div>

                    <div className="register-confirm-info-card">
                        <span className="register-confirm-info-label">Durum</span>
                        <strong>Doğrulama Bekleniyor</strong>
                    </div>
                </div>

                <div className="register-confirm-item">
                    {confirmMessageCard()}
                </div>

                <div className="register-confirm-item register-confirm-field">
                    <label>Doğrulama Kodu</label>
                    <InputText
                        placeholder={"E-posta doğrulama kodunu giriniz"}
                        value={confirmValue}
                        type="text"
                        onChange={(e) => {
                            setConfirmValue(e.target.value)
                            setWrongAccountInfo(false);
                            setLabelMessage("");
                        }}
                    />
                    <span className="register-confirm-helper">Kod gelmediyse aşağıdaki butonla tekrar gönderebilirsiniz.</span>
                </div>

                {USE_DEMO_LOCAL_AUTH && demoVerificationCode ? (
                    <div className="register-confirm-item">
                        <div className="register-confirm-demo-card">
                            <span className="register-confirm-demo-label">Demo Doğrulama Kodu</span>
                            <strong>{demoVerificationCode}</strong>
                            <p>Demo modda e-posta gönderilmez. Bu kodu kullanarak hesabınızı onaylayabilirsiniz.</p>
                        </div>
                    </div>
                ) : null}

                <div className="register-confirm-actions">
                    <Button className="register-confirm-submit"
                            label={"Kodu Doğrula"}
                            disabled={disableConfirm}
                            loading={confirmLoading}
                            onClick={confirmButtonClick}/>

                    <Button className="register-confirm-secondary"
                            label={"Kodu Tekrar Gönder"}
                            loading={resendLoading}
                            onClick={createConfirmClick}/>
                </div>
            </div>
        </div>
    );
}
