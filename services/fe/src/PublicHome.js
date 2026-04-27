import React, {useRef, useState} from 'react';
import {Route, Switch} from "react-router-dom";
import {HomePage} from "./HomePage";

import "./css/publicPage.css"
import "./css/topBar.css"
import "./css/footer.css"
import "./css/campaignItem.css"
import "./css/login.css"
import './css/dialog.css'
import './css/register-confirm.css'

export const PublicHome = () => {

    return (
        <div>
            <Switch>
                <Route path="/" exact component={HomePage}/>
            </Switch>
        </div>
    );
}
