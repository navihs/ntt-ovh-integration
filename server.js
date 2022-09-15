const dotenv = require('dotenv');
const axios = require('axios');


// Require express
const express = require("express");
// Initialize express
const app = express();
const PORT = 3000;
// parse JSON
app.use(express.json());
// parse URL encoded data
app.use(express.urlencoded({ extended: true }));
// create a server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    start();
});

const config = dotenv.config().parsed;

const Magento = {
    login: () => {
        return axios({
        method: 'post',
        url: `${config.MAGENTO_URL}${config.MAGENTO_URL_AUTH}`, 
        data: {
            username: config.MAGENTO_USERNAME,
            password: config.MAGENTO_PASSWORD
        },
        headers: { "Content-Type": "application/json" }
        })
    },
    getCartsByCustomerId: (customerId) => {
        return axios({
        method: 'get',
        url: `${config.MAGENTO_URL}${config.MAGENTO_URL_CART}?searchCriteria[filter_groups][0][filters][0][field]=customer_id&searchCriteria[filter_groups][0][filters][0][value]=${customerId}`, 
        headers: { 
            "Authorization": `Bearer ${config.access_token}`,
            "Content-Type": "application/json"
        }
        })
    }
}
  
app.get('/magento/getcartbycustomerid/customer_id', async (req, res) => {
    const customer_id = req.params.customer_id;
    console.log("GetCartByCustomerId " + customer_id)

    try{
        const login = await Magento.login();
        config.access_token = login.data;

        const cart = await Magento.getCartsByCustomerId(customer_id);
        res.status(200).json(cart.data);            
    }
    catch(error){
        console.log(error)
        return res.status(400).json({
            message: error
        });
    }
});

async function start() {
    
}
