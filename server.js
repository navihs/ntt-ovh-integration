const dotenv = require('dotenv');
const axios = require('axios');

const {createClient} = require('redis');
let client;

// Require express
const express = require("express");
// Initialize express
const app = express();
const PORT = 3000;

const cors = require('cors')
app.use(cors())

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
    },
    getProductBySKU: (productSKU) => {
        return axios({
            method: 'get',
            url: `${config.MAGENTO_URL}${config.MAGENTO_URL_PRODUCT}/${productSKU}`,
            headers: {
                "Authorization": `Bearer ${config.access_token}`,
                "Content-Type": "application/json"
            }
        })
    }
}

app.get('/magento/getcartbycustomerid/:customer_id', async (req, res) => {
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

app.get('/magento/getproductbysku/:product_sku', async (req, res) => {
    const product_sku = req.params.product_sku;
    console.log("GetProductBySKU " + product_sku)

    try{
        const login = await Magento.login();
        config.access_token = login.data;

        const product = await Magento.getProductBySKU(product_sku);
        res.status(200).json(product.data);
    }
    catch(error){
        console.log(error)
        return res.status(400).json({
            message: error
        });
    }
});

app.get('/redis/:key', async(req, res) => {
   const key = req.params.key;
   const objectType = req.query.type;
   console.log("GetRedisKey " + key);

   try{
      let value = await client.get(key);

      if(objectType == "json")
        value = JSON.parse(value);

      res.status(200).json(value);
   }
   catch(error){
      console.log(error);
      return res.status(400).json({
        message: error
      });
   }
});

app.post('/redis/:key', async (req, res) => {
   const key = req.params.key;
   const value = req.body;
   console.log("PostRedisKey " + key + req.body);

   if(typeof value == "object"){
      await client.set(key, JSON.stringify(value));
   }
   else{
      await client.set(key, value);
   }

   res.sendStatus(200);
});

app.get('/redis/:key/search', async(req, res) => {
    const key = req.params.key;
    const searchCriteria = {
        key: Object.keys(req.query)[0],
        value: req.query[Object.keys(req.query)[0]]
    }
    console.log("SearchRedisKey " + key + " " + JSON.stringify(searchCriteria));
 
    try{
        let value = await client.get(key);
        let table = JSON.parse(value);

        let results = table.filter(item => item[searchCriteria.key] == searchCriteria.value);

        res.status(200).json({
            results: results,
            totalHits: results.length
        });
    }
    catch(error){
       console.log(error);
       return res.status(400).json({
         message: error
       });
    }
 });

async function start() {
    // Connect to Redis
    client = createClient({
        url: 'redis://51.210.242.125:49153'
    });
    await client.connect();
}
