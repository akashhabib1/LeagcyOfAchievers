const express = require('express');
const crypto = require('crypto');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// TODO: REPLACE THESE WITH YOUR ACTUAL CREDENTIALS
// Note: This Salt Key is for a test environment.
// For live payments, get production keys from your PhonePe dashboard.
const MERCHANT_ID = 'TESTMERCHANT'; // Replace with your Merchant ID
const SALT_KEY = 'MGE0MWJlYmItZTgyYS00MmI5LWI1MzMtOWNlOWM5NGU0ODNi'; 
const SALT_INDEX = 1;

// Base URLs for the PhonePe API
const PHONEPE_PAY_URL = "https://api.phonepe.com/apis/hermes/pg/v1/pay";

app.use(express.json());
// Assuming your website's HTML file is in a 'public' directory
app.use(express.static(path.join(__dirname, 'public'))); 

// This endpoint initiates the payment request to PhonePe.
app.post('/api/pay', async (req, res) => {
    try {
        const { amount } = req.body;
        const transactionId = `T${Date.now()}`; // Unique transaction ID for each payment
        const merchantUserId = `MUID${Date.now()}`;

        const payload = {
            merchantId: MERCHANT_ID,
            merchantTransactionId: transactionId,
            merchantUserId: merchantUserId,
            amount: amount, // Amount in paise
            redirectUrl: `https://your-domain.com/payment-redirect`, // Update with your actual domain
            redirectMode: "POST",
            paymentInstrument: {
                type: "PAY_PAGE"
            }
        };

        const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64');
        const checksumString = base64Payload + '/pg/v1/pay' + SALT_KEY;
        const sha256Hash = crypto.createHash('sha256').update(checksumString).digest('hex');
        const finalChecksum = sha256Hash + '###' + SALT_INDEX;

        const response = await axios.post(PHONEPE_PAY_URL, {
            request: base64Payload
        }, {
            headers: {
                'Content-Type': 'application/json',
                'X-VERIFY': finalChecksum,
                'accept': 'application/json'
            }
        });

        res.json(response.data);

    } catch (error) {
        console.error('Payment initiation failed:', error);
        res.status(500).json({ success: false, message: 'Payment initiation failed.' });
    }
});

// This endpoint receives the final redirect from PhonePe after the user completes the payment.
app.post('/api/redirect', (req, res) => {
    const status = req.body.code === 'PAYMENT_SUCCESS' ? 'success' : 'failure';
    // TODO: In a real app, you would verify the payment here and update your database.
    if (status === 'success') {
        res.redirect('/success-page.html');
    } else {
        res.redirect('/failure-page.html');
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
