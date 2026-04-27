import React, {useEffect, useRef, useState} from 'react';
import ProfileNavigation from "./ProfileNavigation";
import '../../css/customer-profile/user-address.css'
import {useHistory} from "react-router-dom";
import {Card} from "primereact/card";
import {Button} from "primereact/button";
import {MY_ORDER_URL} from "../../constants/UrlConstans";

const MyAddress = () => {
    const history = useHistory();
    const toastCenter = useRef(null);
    const [user, setUser] = useState({});
    const [fullName, setFullName] = useState("");


    useEffect(() => {
        const storedUserStr = localStorage.getItem("user");
        const user = JSON.parse(storedUserStr);
        setFullName(user.name + ' ' + user.surname)
    }, []);

    const header = (
        <img alt="Card" src="https://primefaces.org/cdn/primereact/images/usercard.png"/>
    );
    const footer = (
        <>
            {/*<div className="card-delete-button">*/}
            {/*    <a href="">*/}
            {/*        <div>*/}
            {/*            <i className="pi pi-trash" style={{color: '#708090', fontSize: "16px"}}></i>*/}
            {/*            <span style={{fontSize: "14px", marginLeft: "0.7rem"}}>Sil</span>*/}
            {/*        </div>*/}
            {/*    </a>*/}
            {/*</div>*/}

            <div className="card-delete-button">
                <Button label="Sil" style={{marginLeft: '5rem'}} icon="pi pi-trash" text/>
                {/*<a href="https://react.dev" target="_blank" rel="noopener noreferrer" className="p-button font-bold" >*/}
                {/*    Navigate*/}
                {/*</a>*/}
            </div>

            <div className="card-update-button">
                <Button label="Cancel" severity="secondary" icon="pi pi-times" style={{marginLeft: '5rem'}} outlined/>
                <Button label="Primary" outlined />
            </div>

        </>
    );

    const addressCard = () => {
        return (
            <div className="address-card">
                <div className="address-card-content">
                    <div className="address-title">ADRES BAŞLIĞI</div>
                    <hr/>
                    <div className="address-owner">
                        <span>Ad-Soyad</span>
                    </div>
                    <div className="address-desc">Adress ile ilgili kısaltılmış genel bilgi içerecek</div>
                    <div className="address-owner-phone">539 316 47 59</div>
                </div>
                <div className="address-card-footer">
                    {footer}
                </div>
            </div>
        )
    }

    return (

        <div className="catalog">
            <div className="container-items">
                <div className="my-account-page">
                    <ProfileNavigation userFullName={fullName}/>

                    <div className="process-column">
                        <div className="process-row">
                            <div className="process-header-item">
                                Kullanıcı Bilgilerim
                            </div>
                        </div>

                        <div className="process-row">
                            <div className="address-items">
                                <div className="address-item">
                                    {addressCard()}
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    )
}
export default MyAddress;
