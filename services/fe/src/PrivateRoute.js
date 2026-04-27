import React, {useEffect, useState} from "react";
import {Route} from "react-router-dom";
import NotAuthorized from "./NotAuthorized.js";
import {LoginPage} from "./components/login-register-page-components/LoginPage";

export const PrivateRoute = ({component: Component, ...rest}) => {

    const [pageData, setPageData] = useState();

    useEffect(() => {
        if (localStorage.getItem("token")) {
            setPageData(Component)
        } else {
            setPageData(<NotAuthorized/>)
        }
    }, []);

    return (
        <Route {...rest} render={props => (pageData)}/>
    )
}
