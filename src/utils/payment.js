import Stripe from 'stripe';
import dotenv from 'dotenv';
dotenv.config();

async function payment({
    customer_email='',
    metadata={},
    cancel_url = process.env.CANCEL_URL,
    success_url=process.env.SUCCESS_URL,
    line_items = []
} = {}){
    const stripe = new Stripe(process.env.STRIPE_KEY_PAYMENT);
    const session = await stripe.checkout.sessions.create({
        payment_method_types:['card'],
        mode:'payment',
        customer_email,  // user Email to send message
        metadata,
        cancel_url,
        success_url,
        line_items
    });
    return session;
}
export default payment;