import React from "react";
import notAuthorized from './images/403.png'

function NotAuthorized() {

    return (
        <div className="grid">
            <div className="col-12">
                <div className="card">
                    <h5>Empty Page</h5>
                    <p>Use this page to start from scratch and place your custom content.</p>

                    <img className="" src={notAuthorized} />

                    <div className="p-text-bold page-error"> Sayfa Bulunamadı </div>
                </div>
            </div>
        </div>
    );
}

export default NotAuthorized
