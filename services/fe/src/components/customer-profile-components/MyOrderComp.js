import React from 'react';
import ProfileNavigation from "./ProfileNavigation";
import '../../css/customer-profile/customer-profile.css'

const MyOrderComp = () => {


    return (
        <div className="catalog">
            <div className="container-items">
                <div className="my-account-page">
                    <ProfileNavigation
                        userFullName="TEST"
                        activeSection="orders"
                    />


                    <div className="process-column">
                        <div className="process-row">
                            <div>TEST-ACCOUNT</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default MyOrderComp;
