import axios from "axios";

export const BASE_URL = 'http://localhost:20000/api/v1/product';

const getCategory = () => {

    return axios.get(BASE_URL + '/category/getAll', {})
        .then(response => {
            console.log(response)
            return response.data.returnData;
        }).catch((error) => {
            console.log('error ' + error);
        });

};

export default {
    getCategory,
};
