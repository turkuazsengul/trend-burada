import axios from "axios";
import {REGISTER_URL, REGISTER_CONFIRM_URL, REGISTER_CREATE_CONFIRM_URL} from "../constants/UrlConstans";

const register = (data) => {
    return axios.post(REGISTER_URL, data);
};

const confirm = (userId, confirmCode) => {
    return axios.post(REGISTER_CONFIRM_URL, {},
        {params: {userId, confirmCode}}
    );
};

const createConfirm = (userId) => {
    return axios.post(REGISTER_CREATE_CONFIRM_URL, {},
        {params: {userId}}
    );
};

export default {
    register,
    confirm,
    createConfirm,
};
